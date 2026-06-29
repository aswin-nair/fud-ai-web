export type AIProvider = 'openrouter' | 'gemini'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  model: string
  customInstructions?: string
}

export const OPENROUTER_MODELS = [
  'openrouter/free',
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4',
  'meta-llama/llama-3.3-70b-instruct',
] as const

export const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
] as const

export function defaultAISettings(): AISettings {
  return {
    provider: 'openrouter',
    apiKey: '',
    model: 'openrouter/free',
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
    model: raw.model ?? (provider === 'openrouter' ? 'openrouter/free' : 'gemini-2.0-flash'),
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
