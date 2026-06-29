import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useApp } from '../store/AppContext'
import { sendCoachMessage } from '../lib/coachAI'
import { providerLabel } from '../lib/aiConfig'

const STARTERS = [
  'How am I doing today?',
  'What should I eat to hit my protein goal?',
  'Am I on track for my weight goal?',
]

export function CoachPage() {
  const { state, addChatMessage, clearChat } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatMessages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    if (!state.aiSettings.apiKey) {
      setError(`Add your ${providerLabel(state.aiSettings.provider)} API key in Settings.`)
      return
    }
    setError(null)
    setInput('')
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(userMsg)
    setLoading(true)
    try {
      const reply = await sendCoachMessage(
        { ...state, chatMessages: [...state.chatMessages, userMsg] },
        state.chatMessages,
        trimmed,
      )
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coach request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell coach-shell">
      <main className="app-main coach-main">
        <div className="coach-header">
          <h1 className="page-title">Coach</h1>
          {state.chatMessages.length > 0 && (
            <button type="button" className="btn-copy" onClick={() => { if (confirm('Clear chat history?')) clearChat() }}>Reset</button>
          )}
        </div>
        <p className="page-sub">AI nutrition coach with your profile & log context.</p>

        {error && <div className="error-banner">{error}</div>}

        {!state.aiSettings.apiKey && (
          <div className="card" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              Add your API key in <Link to="/settings">Settings</Link> to chat with Coach.
            </p>
          </div>
        )}

        <div className="chat-thread">
          {state.chatMessages.length === 0 && (
            <div className="chat-empty">
              <p>Ask anything about your diet, goals, or progress.</p>
              <div className="chip-row" style={{ justifyContent: 'center', marginTop: 12 }}>
                {STARTERS.map(s => (
                  <button key={s} type="button" className="chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {state.chatMessages.map(msg => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant loading">Thinking…</div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="chat-input-row"
          onSubmit={e => { e.preventDefault(); send(input) }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Coach…"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>Send</button>
        </form>
      </main>
      <BottomNav />
    </div>
  )
}
