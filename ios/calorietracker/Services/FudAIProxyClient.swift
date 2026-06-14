import Foundation

enum FudAIProxyClient {
    enum ProxyTask: String {
        case food
        case coach
        case speech
        // Goal calculation (onboarding / Recalculate / Adaptive). Counts only against the
        // global daily cap server-side, not the food bucket — so it never eats meal-logging quota.
        case goals
    }

    enum ProxyError: LocalizedError {
        case subscriptionRequired
        case quotaExceeded(String)
        case apiError(String)
        case invalidResponse
        case networkError(Error)

        var errorDescription: String? {
            switch self {
            case .subscriptionRequired:
                return "Fud AI Premium is not active. Subscribe or switch back to Bring Your Own Key in Settings."
            case .quotaExceeded(let message):
                return message
            case .apiError(let message):
                return message
            case .invalidResponse:
                return "Unexpected response from Fud AI Premium."
            case .networkError(let error):
                return "Network error: \(error.localizedDescription)"
            }
        }
    }

    static func quotaSnapshot() async throws -> AIAccessQuotaSnapshot {
        guard AIAccessSettings.hasActivePremiumEntitlement else {
            throw ProxyError.subscriptionRequired
        }

        var request = URLRequest(url: AIAccessSettings.proxyEndpoint)
        request.httpMethod = "GET"
        request.setValue("ios", forHTTPHeaderField: "X-FudAI-Platform")
        request.setValue(AIAccessSettings.installID, forHTTPHeaderField: "X-FudAI-Install-ID")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw ProxyError.invalidResponse }
            guard (200..<300).contains(http.statusCode) else {
                let message = parseProxyMessage(from: data) ?? "Fud AI Premium usage failed with HTTP \(http.statusCode)."
                throw ProxyError.apiError(message)
            }
            return try JSONDecoder().decode(AIAccessQuotaSnapshot.self, from: data)
        } catch let error as ProxyError {
            throw error
        } catch let error as DecodingError {
            throw ProxyError.apiError(error.localizedDescription)
        } catch {
            throw ProxyError.networkError(error)
        }
    }

    static func generateContent(task: ProxyTask, body: [String: Any]) async throws -> Data {
        guard AIAccessSettings.hasActivePremiumEntitlement else {
            throw ProxyError.subscriptionRequired
        }

        let payload: [String: Any] = [
            "task": task.rawValue,
            "body": body,
        ]

        var request = URLRequest(url: AIAccessSettings.proxyEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "X-FudAI-Platform")
        request.setValue(AIAccessSettings.installID, forHTTPHeaderField: "X-FudAI-Install-ID")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw ProxyError.invalidResponse }
            guard (200..<300).contains(http.statusCode) else {
                let message = parseProxyMessage(from: data) ?? "Fud AI Premium request failed with HTTP \(http.statusCode)."
                if http.statusCode == 402 || http.statusCode == 429 {
                    throw ProxyError.quotaExceeded(message)
                }
                throw ProxyError.apiError(message)
            }
            return data
        } catch let error as ProxyError {
            throw error
        } catch {
            throw ProxyError.networkError(error)
        }
    }

    static func transcribeSpeech(audioData: Data, languageCode: String?) async throws -> String {
        guard AIAccessSettings.hasActivePremiumEntitlement else {
            throw ProxyError.subscriptionRequired
        }

        var body: [String: Any] = [
            "audioBase64": audioData.base64EncodedString(),
            "mimeType": "audio/m4a",
        ]
        if let languageCode {
            body["language"] = languageCode
        }

        let data = try await generateContent(task: .speech, body: body)
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let text = json["text"] as? String
        else {
            throw ProxyError.invalidResponse
        }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw ProxyError.invalidResponse }
        return trimmed
    }

    private static func parseProxyMessage(from data: Data) -> String? {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        if let error = json["error"] as? String {
            return error
        }
        if let error = json["error"] as? [String: Any],
           let message = error["message"] as? String {
            return message
        }
        return nil
    }
}
