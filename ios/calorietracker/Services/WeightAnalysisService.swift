import Foundation

/// Pure thermodynamic / statistical forecast of where the user's weight is heading based on
/// recent calorie intake, logged weight history, and their profile (gender, age, activity, goal).
/// No network, no LLM — just energy-balance math + linear regression.
struct WeightForecast {
    /// Average daily calories eaten over the last `lookbackDays` days of logged food.
    let avgDailyCalories: Int
    /// Total Daily Energy Expenditure from the user's profile (BMR × activity).
    let tdee: Int
    /// avgDailyCalories − tdee. Negative = deficit, positive = surplus.
    let dailyEnergyBalance: Int

    /// Predicted kg change per week based on energy balance (7,700 kcal ≈ 1 kg body fat).
    let predictedWeeklyChangeKg: Double
    /// Predicted kg change per week derived from linear regression on recent weight log.
    /// Nil if fewer than 2 weight entries in the regression window.
    let observedWeeklyChangeKg: Double?

    /// Current weight (latest entry in the store, or profile weight if no entries).
    let currentWeightKg: Double
    /// Predicted weight 30 days from now at the current predicted pace.
    let predictedWeight30dKg: Double
    let predictedWeight60dKg: Double
    let predictedWeight90dKg: Double

    /// Days until goal weight at the current predicted pace. Nil if no goal, if goal is Maintain,
    /// or if the user is moving in the wrong direction.
    let daysToGoal: Int?
    let goalReachDate: Date?

    /// Sentinel for views to know whether enough data exists to render a meaningful forecast.
    let hasEnoughData: Bool
    /// True when predicted (from diet) and observed (from weight scale) trends disagree substantially.
    /// Hint that the user may be under-logging food or not weighing consistently.
    let trendsDisagree: Bool

    /// How many days of logged food informed the calorie average. Displayed so the user knows
    /// how much history the forecast is based on.
    let daysOfFoodData: Int
    /// How many weight entries informed the observed-trend regression.
    let weightEntriesUsed: Int

    /// Hard cap so ancient data doesn't dominate the projection. Everything within this window
    /// is used — if the user only has a week, that's fine; if they have 3 months, we use 3 months.
    static let maxLookbackDays: Int = 90
}

enum WeightAnalysisService {
    static func compute(weights: [WeightEntry], foods: [FoodEntry], profile: UserProfile) -> WeightForecast {
        let now = Date()
        let calendar = Calendar.current
        let cutoff = calendar.date(byAdding: .day, value: -WeightForecast.maxLookbackDays, to: now) ?? now

        // --- Avg daily calories from food log (up to 90 days of available data) ---
        let recentFoods = foods.filter { $0.timestamp >= cutoff && $0.timestamp <= now }
        let daysLogged = Set(recentFoods.map { calendar.startOfDay(for: $0.timestamp) }).count
        let totalRecentCal = recentFoods.reduce(0) { $0 + $1.calories }
        let avgDailyCal = daysLogged > 0 ? totalRecentCal / daysLogged : 0

        let tdee = Int(profile.tdee)
        let balance = avgDailyCal - tdee
        // 7,700 kcal ≈ 1 kg body fat (ISSN standard for deficit/surplus math).
        let predictedWeeklyKg = Double(balance) * 7.0 / 7_700.0

        // --- Current weight ---
        let sortedWeights = weights.sorted { $0.date > $1.date }
        let currentWeight = sortedWeights.first?.weightKg ?? profile.weightKg

        // --- Observed trend via linear regression on weight history ---
        let regressionWindow = sortedWeights.filter { $0.date >= cutoff }
        let observedWeeklyKg = linearRegressionSlopePerDay(entries: regressionWindow).map { $0 * 7.0 }

        // --- Future projections ---
        let pred30 = currentWeight + predictedWeeklyKg * 30.0 / 7.0
        let pred60 = currentWeight + predictedWeeklyKg * 60.0 / 7.0
        let pred90 = currentWeight + predictedWeeklyKg * 90.0 / 7.0

        // --- Goal-reach projection ---
        var daysToGoal: Int? = nil
        var goalReachDate: Date? = nil
        if let goalKg = profile.goalWeightKg, predictedWeeklyKg != 0, profile.goal != .maintain {
            let kgRemaining = goalKg - currentWeight
            let movingCorrectWay = (profile.goal == .lose && predictedWeeklyKg < 0 && kgRemaining < 0)
                                || (profile.goal == .gain && predictedWeeklyKg > 0 && kgRemaining > 0)
            if movingCorrectWay {
                let daysPerKg = 7.0 / abs(predictedWeeklyKg)
                let days = Int((abs(kgRemaining) * daysPerKg).rounded())
                daysToGoal = days
                goalReachDate = calendar.date(byAdding: .day, value: days, to: now)
            }
        }

        // Work with whatever the user has. Even 2 days of food and 2 weights is enough for a rough forecast;
        // the LLM will caveat accordingly.
        let hasEnoughData = daysLogged >= 2 && weights.count >= 2

        // Compare predicted vs observed trends. If both exist and they differ by more than
        // 0.3 kg/week, user is likely under-logging food (or over-eating un-logged snacks).
        let trendsDisagree: Bool
        if let observed = observedWeeklyKg, hasEnoughData {
            trendsDisagree = abs(predictedWeeklyKg - observed) > 0.3
        } else {
            trendsDisagree = false
        }

        return WeightForecast(
            avgDailyCalories: avgDailyCal,
            tdee: tdee,
            dailyEnergyBalance: balance,
            predictedWeeklyChangeKg: predictedWeeklyKg,
            observedWeeklyChangeKg: observedWeeklyKg,
            currentWeightKg: currentWeight,
            predictedWeight30dKg: pred30,
            predictedWeight60dKg: pred60,
            predictedWeight90dKg: pred90,
            daysToGoal: daysToGoal,
            goalReachDate: goalReachDate,
            hasEnoughData: hasEnoughData,
            trendsDisagree: trendsDisagree,
            daysOfFoodData: daysLogged,
            weightEntriesUsed: regressionWindow.count
        )
    }

    /// Slope of a simple linear regression (y = mx + b) over weight entries, returning m in
    /// kg per day. Returns nil if fewer than 2 entries.
    private static func linearRegressionSlopePerDay(entries: [WeightEntry]) -> Double? {
        guard entries.count >= 2 else { return nil }
        // Use seconds-since-epoch as X so slope has real time units, then scale to per-day.
        let xs = entries.map { $0.date.timeIntervalSince1970 }
        let ys = entries.map { $0.weightKg }
        let n = Double(xs.count)
        let meanX = xs.reduce(0, +) / n
        let meanY = ys.reduce(0, +) / n
        var num = 0.0
        var den = 0.0
        for i in 0..<xs.count {
            let dx = xs[i] - meanX
            num += dx * (ys[i] - meanY)
            den += dx * dx
        }
        guard den != 0 else { return nil }
        let kgPerSecond = num / den
        return kgPerSecond * 86_400.0
    }
}

struct AdaptiveGoalResult {
    var profile: UserProfile
    var changed: Bool
    var updatedCalories: Int?
    var message: String
}

enum AdaptiveGoalService {
    private static let minimumFoodDays = 4
    private static let minimumWeightEntries = 3
    private static let minimumDailyAdjustment = 25
    private static let maximumDailyAdjustment = 150
    private static let caloriesPerKg = 7_700.0

    static func apply(profile: UserProfile, weights: [WeightEntry], foods: [FoodEntry]) -> AdaptiveGoalResult {
        let forecast = WeightAnalysisService.compute(weights: weights, foods: foods, profile: profile)

        guard forecast.daysOfFoodData >= minimumFoodDays,
              forecast.weightEntriesUsed >= minimumWeightEntries,
              let observedWeeklyChangeKg = forecast.observedWeeklyChangeKg else {
            return AdaptiveGoalResult(
                profile: profile,
                changed: false,
                updatedCalories: nil,
                message: "Adaptive Goals is on. It needs at least \(minimumFoodDays) logged food days and \(minimumWeightEntries) recent weight entries before making a weekly correction."
            )
        }

        let targetWeeklyChangeKg = targetWeeklyChangeKg(for: profile)
        let rawDailyAdjustment = (targetWeeklyChangeKg - observedWeeklyChangeKg) * caloriesPerKg / 7.0
        let limitedAdjustment = Int(rawDailyAdjustment.rounded())
            .clamped(to: -maximumDailyAdjustment...maximumDailyAdjustment)

        guard abs(limitedAdjustment) >= minimumDailyAdjustment else {
            return AdaptiveGoalResult(
                profile: profile,
                changed: false,
                updatedCalories: nil,
                message: "Your recent weight trend is close to your selected goal pace, so Adaptive Goals did not change calories this week."
            )
        }

        let currentCalories = profile.effectiveCalories
        let safetyFloor = max(Int(profile.bmr.rounded()), 1_200)
        let safetyCeiling = max(safetyFloor, Int((profile.tdee * 1.25).rounded()))

        if limitedAdjustment < 0, currentCalories <= safetyFloor {
            return AdaptiveGoalResult(
                profile: profile,
                changed: false,
                updatedCalories: nil,
                message: "Adaptive Goals did not lower calories because your current target is already at the safety floor."
            )
        }
        if limitedAdjustment > 0, currentCalories >= safetyCeiling {
            return AdaptiveGoalResult(
                profile: profile,
                changed: false,
                updatedCalories: nil,
                message: "Adaptive Goals did not raise calories because your current target is already at the safety ceiling."
            )
        }

        let proposedCalories = currentCalories + limitedAdjustment
        let adjustedCalories = limitedAdjustment < 0
            ? max(proposedCalories, safetyFloor)
            : min(proposedCalories, safetyCeiling)

        guard adjustedCalories != currentCalories else {
            return AdaptiveGoalResult(
                profile: profile,
                changed: false,
                updatedCalories: nil,
                message: "Adaptive Goals checked your trend, but calorie guardrails kept this week's target unchanged."
            )
        }

        var nextProfile = profile
        nextProfile.customCalories = adjustedCalories

        let signedAdjustment = adjustedCalories - currentCalories
        let sign = signedAdjustment > 0 ? "+" : ""
        return AdaptiveGoalResult(
            profile: nextProfile,
            changed: true,
            updatedCalories: adjustedCalories,
            message: "Adaptive Goals adjusted calories by \(sign)\(signedAdjustment) kcal to \(adjustedCalories) kcal based on your recent weight trend. Pinned macros stay pinned; unlocked macros auto-balance."
        )
    }

    private static func targetWeeklyChangeKg(for profile: UserProfile) -> Double {
        switch profile.goal {
        case .lose:
            return -(profile.weeklyChangeKg ?? 0.5)
        case .maintain:
            return 0
        case .gain:
            return profile.weeklyChangeKg ?? 0.5
        }
    }
}

private extension Comparable {
    func clamped(to limits: ClosedRange<Self>) -> Self {
        min(max(self, limits.lowerBound), limits.upperBound)
    }
}
