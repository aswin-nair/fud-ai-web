export const AVAILABILITY_CLAIMS = [
  /or use Premium\b/i,
  /or use optional Fud AI Premium/i,
  /optional Fud AI Premium/i,
  /optional iOS Premium/i,
  /Premium provides no-key/i,
  /choose Fud AI Premium/i,
  /Fud AI Premium \(optional/i,
  /Subscribe or switch/i,
  /Works with Fud AI Premium/i,
  /Premium, or bring your own/i,
  /Premium or your own provider/i,
  /optional Premium proxy/i,
  /In optional Fud AI Premium/i,
  /use optional Fud AI Premium/i,
  /two AI Access modes/i,
  /Premium mode hides/i,
  /Premium keeps BYOK/i,
  /Fud AI's Premium proxy/i,
  /when Premium is selected/i,
  /or use Premium\./i,
]

export const PRODUCT_SURFACES = [
  'README.md',
  'CONTRIBUTING.md',
  'APPSTORE.md',
  'PLAYSTORE.md',
  'SECURITY.md',
  'web/privacy.html',
  'web/terms.html',
  'web/index.html',
  'web/app/README.md',
  'ios/calorietracker/Views/PaywallView.swift',
  'ios/calorietracker/Views/OnboardingView.swift',
  'ios/calorietracker/Views/VoiceInputView.swift',
  'ios/calorietracker/Services/FudAIProxyClient.swift',
  'ios/calorietracker/Services/GeminiService.swift',
  'ios/calorietracker/Services/ChatService.swift',
  'ios/calorietracker/Services/SpeechService.swift',
]

export function availabilityClaimHits(text) {
  return AVAILABILITY_CLAIMS
    .filter(pattern => pattern.test(text))
    .map(pattern => pattern.source)
}
