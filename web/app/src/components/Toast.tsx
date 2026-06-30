import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  msg: string
  type: ToastType
  action?: { label: string; fn: () => void }
}

interface ToastCtxValue {
  toast: (msg: string, opts?: { type?: ToastType; action?: { label: string; fn: () => void } }) => void
}

const ToastCtx = createContext<ToastCtxValue>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setItems(p => p.filter(t => t.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const toast = useCallback((
    msg: string,
    opts?: { type?: ToastType; action?: { label: string; fn: () => void } }
  ) => {
    const id = ++seq
    setItems(p => [...p.slice(-2), { id, msg, type: opts?.type ?? 'success', action: opts?.action }])
    timers.current.set(id, setTimeout(() => dismiss(id), opts?.action ? 4500 : 2500))
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map(item => (
          <div key={item.id} className={`toast toast-${item.type}`} role="status">
            <span className="toast-msg">{item.msg}</span>
            {item.action && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => { item.action!.fn(); dismiss(item.id) }}
              >
                {item.action.label}
              </button>
            )}
            <button type="button" className="toast-x" onClick={() => dismiss(item.id)} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
