import type { AISettings } from './aiConfig'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string | unknown[] }

function aiHeaders(settings: AISettings): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (settings.provider === 'openrouter') {
    h.Authorization = `Bearer ${settings.apiKey.trim()}`
    h['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://fud-ai.app'
    h['X-Title'] = 'Fud AI'
  }
  return h
}

export async function completeChat(
  settings: AISettings,
  messages: ChatMsg[],
  maxTokens = 1024,
  temperature?: number,
): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Add your API key in Settings.')

  if (settings.provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: aiHeaders(settings),
      body: JSON.stringify({
        model: settings.model || 'google/gemini-2.0-flash-001',
        messages,
        max_tokens: maxTokens,
        ...(temperature != null ? { temperature } : {}),
      }),
    })
    if (!res.ok) throw new Error(`OpenRouter error (${res.status}): ${(await res.text()).slice(0, 240)}`)
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    if (json.error?.message) throw new Error(json.error.message)
    const text = json.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty response from OpenRouter')
    return text
  }

  const model = settings.model || 'gemini-2.0-flash'
  const system = messages.find(m => m.role === 'system')
  const conv = messages.filter(m => m.role !== 'system')
  const contents = conv.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(temperature != null ? { temperature } : {}),
    },
  }
  if (system && typeof system.content === 'string') {
    body.systemInstruction = { parts: [{ text: system.content }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { ...aiHeaders(settings), 'X-goog-api-key': settings.apiKey.trim() },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${(await res.text()).slice(0, 240)}`)
  const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

export async function completeVision(
  settings: AISettings,
  prompt: string,
  imageBase64: string,
  mimeType = 'image/jpeg',
  maxTokens = 1024,
  temperature?: number,
  systemPrompt?: string,
): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Add your API key in Settings.')

  if (settings.provider === 'openrouter') {
    const content = [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      { type: 'text', text: prompt },
    ]
    const messages: ChatMsg[] = []
    const sys = systemPrompt?.trim() ?? settings.customInstructions?.trim()
    if (sys) {
      messages.push({ role: 'system', content: sys })
    }
    messages.push({ role: 'user', content })
    return completeChat(settings, messages, maxTokens, temperature)
  }

  const model = settings.model || 'gemini-2.0-flash'
  const parts: unknown[] = [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ]
  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(temperature != null ? { temperature } : {}),
    },
  }
  const sys = systemPrompt?.trim() ?? settings.customInstructions?.trim()
  if (sys) {
    body.systemInstruction = { parts: [{ text: sys }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': settings.apiKey.trim() },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${(await res.text()).slice(0, 240)}`)
  const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}
