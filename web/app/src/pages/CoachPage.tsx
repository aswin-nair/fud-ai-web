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

function TypingIndicator() {
  return (
    <div className="chat-bubble assistant chat-typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

export function CoachPage() {
  const { state, addChatMessage, clearChat } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      inputRef.current?.focus()
    }
  }

  const hasKey = !!state.aiSettings.apiKey

  return (
    <div className="app-shell coach-shell">
      <header className="coach-header-bar">
        <div className="coach-header-avatar" aria-hidden>🤖</div>
        <div className="coach-header-info">
          <span className="coach-header-title">AI Coach</span>
          <span className="coach-header-sub">Powered by {providerLabel(state.aiSettings.provider)}</span>
        </div>
        {state.chatMessages.length > 0 && (
          <button
            type="button"
            className="coach-clear-btn"
            onClick={() => { if (confirm('Clear chat history?')) clearChat() }}
          >
            Clear
          </button>
        )}
      </header>

      <main className="app-main coach-main">
        {error && <div className="error-banner">{error}</div>}

        {!hasKey && (
          <div className="coach-no-key-card">
            <span className="coach-no-key-icon" aria-hidden>🔑</span>
            <p>Add your <Link to="/settings">{providerLabel(state.aiSettings.provider)}</Link> API key in Settings to start chatting.</p>
          </div>
        )}

        <div className="chat-thread">
          {state.chatMessages.length === 0 && (
            <div className="chat-empty-state">
              <div className="chat-empty-icon" aria-hidden>💬</div>
              <p className="chat-empty-title">Ask me anything</p>
              <p className="chat-empty-sub">About your diet, goals, or progress — I have your full log context.</p>
              <div className="starter-chips">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className="starter-chip"
                    onClick={() => send(s)}
                    disabled={!hasKey}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.chatMessages.map(msg => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="chat-bubble-avatar" aria-hidden>🤖</span>
              )}
              <span className="chat-bubble-text">{msg.content}</span>
            </div>
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="chat-input-bar">
        <form
          className="chat-input-form"
          onSubmit={e => { e.preventDefault(); send(input) }}
        >
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={hasKey ? 'Ask Coach…' : 'Add API key in Settings first'}
            disabled={loading || !hasKey}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !input.trim() || !hasKey}
            aria-label="Send"
          >
            ↑
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
