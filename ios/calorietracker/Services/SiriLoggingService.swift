import Foundation

@MainActor
enum SiriLoggingService {
    struct NutritionSummary {
        let calories: Int
        let protein: Double
        let calorieGoal: Int
    }

    static func analyzeAndLogFood(description: String) async throws -> FoodEntry {
        let analysis = try await GeminiService.analyzeTextInput(description: description)
        let entry = foodEntry(from: analysis)

        let foodStore = FoodStore(observesExternalChanges: false)
        foodStore.addEntry(entry)

        HealthKitManager().writeNutrition(for: entry)
        publishAfterFoodChange(foodStore: foodStore)
        FoodStore.postExternalChangeNotification()

        return entry
    }

    static func todayNutritionSummary() -> NutritionSummary {
        let store = FoodStore(observesExternalChanges: false)
        let goal = UserProfile.load()?.effectiveCalories ?? 0
        return NutritionSummary(
            calories: store.todayCalories,
            protein: store.todayProtein,
            calorieGoal: goal
        )
    }

    static func logWeight(kg: Double) -> WeightEntry {
        let entry = WeightEntry(date: .now, weightKg: kg)
        let weightStore = WeightStore(observesExternalChanges: false)
        weightStore.addEntry(entry)

        HealthKitManager().writeWeight(for: entry)
        rescheduleNotificationsIfNeeded(foodStore: FoodStore(observesExternalChanges: false), weightStore: weightStore)
        WeightStore.postExternalChangeNotification()

        return entry
    }

    private static func foodEntry(from analysis: GeminiService.FoodAnalysis) -> FoodEntry {
        FoodEntry(
            name: analysis.name,
            calories: analysis.calories,
            protein: analysis.protein,
            carbs: analysis.carbs,
            fat: analysis.fat,
            timestamp: .now,
            emoji: analysis.emoji,
            source: .textInput,
            mealType: .currentMeal,
            sugar: analysis.sugar,
            addedSugar: analysis.addedSugar,
            fiber: analysis.fiber,
            saturatedFat: analysis.saturatedFat,
            monounsaturatedFat: analysis.monounsaturatedFat,
            polyunsaturatedFat: analysis.polyunsaturatedFat,
            cholesterol: analysis.cholesterol,
            sodium: analysis.sodium,
            potassium: analysis.potassium,
            transFat: analysis.transFat,
            calcium: analysis.calcium,
            iron: analysis.iron,
            magnesium: analysis.magnesium,
            zinc: analysis.zinc,
            vitaminA: analysis.vitaminA,
            vitaminC: analysis.vitaminC,
            vitaminD: analysis.vitaminD,
            vitaminB12: analysis.vitaminB12,
            vitaminE: analysis.vitaminE,
            vitaminK: analysis.vitaminK,
            folate: analysis.folate,
            omega3: analysis.omega3,
            servingSizeGrams: analysis.servingSizeGrams,
            servingUnitOptions: analysis.servingUnitOptions,
            selectedServingUnit: analysis.selectedServingUnit,
            selectedServingQuantity: analysis.selectedServingQuantity
        )
    }

    private static func publishAfterFoodChange(foodStore: FoodStore) {
        guard let profile = UserProfile.load() else { return }
        WidgetSnapshotWriter.publish(foods: foodStore.entries, profile: profile)
        rescheduleNotificationsIfNeeded(foodStore: foodStore, weightStore: WeightStore(observesExternalChanges: false))
    }

    private static func rescheduleNotificationsIfNeeded(foodStore: FoodStore, weightStore: WeightStore) {
        guard UserDefaults.standard.bool(forKey: "notificationsEnabled"),
              let profile = UserProfile.load()
        else { return }

        NotificationManager().rescheduleDataDependentNotifications(
            foodStore: foodStore,
            weightStore: weightStore,
            bodyFatStore: BodyFatStore(),
            profile: profile
        )
    }
}
