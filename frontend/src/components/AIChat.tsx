import { useState } from 'react'
import type { AssistantMessageHistory, AssistantQueryRequest, AssistantResponse } from '../api/client'
import { post } from '../api/client'
import { TrustBadge } from './ui'

interface Source {
  type: string
  id: number
  label: string
  url: string | null
}

interface Msg {
  role: 'user' | 'ai' | 'sys'
  text: string
  trust?: string
  sources?: Source[]
  note?: string
}

const INTRO: Msg = {
  role: 'ai',
  text: 'Namaste! I’m your guide to Bharat’s heritage and culture. Ask me about festivals, rituals, monuments, museums, food or famed people of any state.',
}

export default function AIChat({ compact = false }: { compact?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([INTRO])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const ask = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    try {
      const history: AssistantMessageHistory[] = msgs.slice(1).map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        text: m.text,
      }))
      const body: AssistantQueryRequest = { question: q, history }
      const res = await post<AssistantResponse>('/assistant/query', body)
      setMsgs((m) => [...m, { role: 'ai', text: res.answer, trust: res.trust, sources: res.sources, note: res.note }])
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: 'Sorry, the assistant is unavailable right now. Please try again.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat-embed" style={{ height: compact ? 460 : 640 }}>
      <div className="chat-body">
        {msgs.map((m, i) => (
          <div key={i}>
            <div className={`msg ${m.role}`}>
              {m.text}
              {m.trust && (
                <div style={{ marginTop: 6 }}>
                  <TrustBadge level={m.trust} />
                </div>
              )}
              {m.note && <div style={{ marginTop: 6 }} className="typing">{m.note}</div>}
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="src-list">
                {m.sources.map((s, j) => (
                  <span key={j} className="src-tag">
                    {s.type}:{' '}
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                    ) : (
                      s.label
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg ai">
            <span className="typing-dots" aria-label="Thinking">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={ask}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. What festivals happen in Tamil Nadu?"
          aria-label="Ask Culture AI"
        />
        <button className="chat-send" disabled={busy}>Send</button>
      </form>
    </div>
  )
}