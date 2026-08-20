import Foundation

enum AIAccessMode: String, Codable, Identifiable {
    case bringYourOwnKey = "Bring Your Own Key"
    // Retained only so previously persisted settings decode safely. Managed AI
    // is not selectable or usable until entitlement verification is enforced
    // server-side for every request.
    case fudAIPremium = "Fud AI Premium"

    var id: String { rawValue }

    static var allCases: [AIAccessMode] { [.bringYourOwnKey] }

    var displayName: String {
        switch self {
        case .bringYourOwnKey: LocalizedDisplayText.text("Bring Your Own Key", polish: "Własny klucz")
        case .fudAIPremium: LocalizedDisplayText.text("Fud AI Premium", polish: "Fud AI Premium")
        }
    }

    var shortName: String {
        switch self {
        case .bringYourOwnKey: LocalizedDisplayText.text("BYOK", polish: "Własny klucz")
        case .fudAIPremium: LocalizedDisplayText.text("Premium", polish: "Premium")
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
    static let managedAIUnavailableMessage = "Fud AI managed AI is unavailable while secure subscription verification is being completed. Use Bring Your Own Key in Settings."

    /// This is deliberately source-controlled rather than environment-driven.
    /// Re-enabling managed AI requires a new server-authenticated entitlement
    /// design, not a local flag or cached App Store result.
    static var managedAIAvailable: Bool { false }

    private static let modeKey = "aiAccessMode"
    private static let premiumEntitlementCacheKey = "fudAIPremiumEntitlementCached"
    private static let installIDKey = "fudAIInstallID"
    private static let proxyEndpointKey = "fudAIPremiumProxyEndpoint"

    static var mode: AIAccessMode {
        get {
            if UserDefaults.standard.string(forKey: modeKey) != AIAccessMode.bringYourOwnKey.rawValue {
                UserDefaults.standard.set(AIAccessMode.bringYourOwnKey.rawValue, forKey: modeKey)
            }
            return .bringYourOwnKey
        }
        set {
            // Fail closed even if legacy or future UI tries to write Premium.
            UserDefaults.standard.set(AIAccessMode.bringYourOwnKey.rawValue, forKey: modeKey)
        }
    }

    static var isUsingFudAIPremium: Bool {
        false
    }

    static var hasActivePremiumEntitlement: Bool {
        false
    }

    static func setActivePremiumEntitlement(_ active: Bool) {
        // A client-cached entitlement cannot authorize a server-funded request.
        UserDefaults.standard.removeObject(forKey: premiumEntitlementCacheKey)
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
