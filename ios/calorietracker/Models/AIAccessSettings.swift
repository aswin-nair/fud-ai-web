import Foundation

enum AIAccessMode: String, CaseIterable, Codable, Identifiable {
    case bringYourOwnKey = "Bring Your Own Key"
    case fudAIPremium = "Fud AI Premium"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .bringYourOwnKey: "Bring Your Own Key"
        case .fudAIPremium: "Fud AI Premium"
        }
    }

    var shortName: String {
        switch self {
        case .bringYourOwnKey: "BYOK"
        case .fudAIPremium: "Premium"
        }
    }

    var icon: String {
        switch self {
        case .bringYourOwnKey: "key.fill"
        case .fudAIPremium: "sparkles"
        }
    }
}

struct AIAccessQuotaSnapshot: Codable, Equatable {
    struct Bucket: Codable, Equatable {
        var used: Int
        var limit: Int
        var remaining: Int
    }

    var date: String
    var food: Bucket
    var speech: Bucket
    var coach: Bucket
    var global: Bucket

    static var fallback: AIAccessQuotaSnapshot {
        AIAccessQuotaSnapshot(
            date: "",
            food: .init(used: 0, limit: AIAccessSettings.premiumFoodDailyRequestLimit, remaining: AIAccessSettings.premiumFoodDailyRequestLimit),
            speech: .init(used: 0, limit: AIAccessSettings.premiumSpeechDailyRequestLimit, remaining: AIAccessSettings.premiumSpeechDailyRequestLimit),
            coach: .init(used: 0, limit: AIAccessSettings.premiumCoachDailyRequestLimit, remaining: AIAccessSettings.premiumCoachDailyRequestLimit),
            global: .init(used: 0, limit: AIAccessSettings.premiumGlobalDailyRequestLimit, remaining: AIAccessSettings.premiumGlobalDailyRequestLimit)
        )
    }
}

struct AIAccessSettings {
    static let premiumFoodDailyRequestLimit = 30
    static let premiumSpeechDailyRequestLimit = 20
    static let premiumCoachDailyRequestLimit = 25
    static let premiumGlobalDailyRequestLimit = 70
    static let defaultProxyEndpoint = "https://fud-ai.app/api/gemini"

    private static let modeKey = "aiAccessMode"
    private static let premiumEntitlementCacheKey = "fudAIPremiumEntitlementCached"
    private static let installIDKey = "fudAIInstallID"
    private static let proxyEndpointKey = "fudAIPremiumProxyEndpoint"

    static var mode: AIAccessMode {
        get {
            guard let raw = UserDefaults.standard.string(forKey: modeKey),
                  let mode = AIAccessMode(rawValue: raw) else {
                return .bringYourOwnKey
            }
            return mode
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: modeKey)
        }
    }

    static var isUsingFudAIPremium: Bool {
        mode == .fudAIPremium
    }

    static var hasActivePremiumEntitlement: Bool {
        UserDefaults.standard.bool(forKey: premiumEntitlementCacheKey)
    }

    static func setActivePremiumEntitlement(_ active: Bool) {
        UserDefaults.standard.set(active, forKey: premiumEntitlementCacheKey)
    }

    static var installID: String {
        if let existing = UserDefaults.standard.string(forKey: installIDKey), !existing.isEmpty {
            return existing
        }
        let newID = UUID().uuidString
        UserDefaults.standard.set(newID, forKey: installIDKey)
        return newID
    }

    static var proxyEndpoint: URL {
        let raw = UserDefaults.standard.string(forKey: proxyEndpointKey) ?? defaultProxyEndpoint
        return URL(string: raw) ?? URL(string: defaultProxyEndpoint)!
    }

    static func resetForDeleteAllData() {
        UserDefaults.standard.removeObject(forKey: modeKey)
        UserDefaults.standard.removeObject(forKey: premiumEntitlementCacheKey)
        UserDefaults.standard.removeObject(forKey: proxyEndpointKey)
    }
}
