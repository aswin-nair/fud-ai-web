export type AIProvider = 'openrouter' | 'gemini'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  model: string
  customInstructions?: string
}

// Ordered best-accuracy-first. `openrouter/free` is last: it randomly routes to whichever
// free model is available (often a small ~3B model) and is not suitable for accuracy-sensitive
// nutrition estimation — see the warning surfaced in Settings when it's selected.
export const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4',
  'meta-llama/llama-3.3-70b-instruct',
  'openrouter/free',
] as const

export const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
] as const

const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'

/** Free-tier / randomly-routed models are much less reliable for numeric nutrition estimates. */
export function isLowAccuracyModel(model: string): boolean {
  return /(^|\/)free$|:free$/i.test(model.trim())
}

export function defaultAISettings(): AISettings {
  return {
    provider: 'openrouter',
    apiKey: '',
    model: DEFAULT_OPENROUTER_MODEL,
  }
}

export function normalizeAISettings(raw?: Partial<AISettings>): AISettings {
  const base = defaultAISettings()
  if (!raw) return base

  const provider = raw.provider ?? (
    raw.apiKey?.startsWith('sk-or-') ? 'openrouter'
      : raw.apiKey?.startsWith('AIza') ? 'gemini'
        : 'openrouter'
  )

  return {
    provider,
    apiKey: raw.apiKey ?? '',
    model: raw.model || (provider === 'openrouter' ? DEFAULT_OPENROUTER_MODEL : DEFAULT_GEMINI_MODEL),
    customInstructions: raw.customInstructions,
  }
}

export function apiKeyPlaceholder(provider: AIProvider): string {
  return provider === 'openrouter' ? 'sk-or-...' : 'AIza...'
}

export function apiKeyHelpUrl(provider: AIProvider): string {
  return provider === 'openrouter'
    ? 'https://openrouter.ai/keys'
    : 'https://aistudio.google.com/apikey'
}

export function providerLabel(provider: AIProvider): string {
  return provider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'
}
