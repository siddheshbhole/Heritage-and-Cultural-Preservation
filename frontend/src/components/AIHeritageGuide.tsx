import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { post } from '../api/client'

import type {
  AssistantItineraryDay,
  AssistantMessageHistory,
  AssistantPageContext,
  AssistantProfile,
  AssistantQueryRequest,
  AssistantRecommendation,
  AssistantResponse,
} from '../api/client'

interface Source {
  type: string
  label: string
  url: string | null
}

interface Msg {
  role: 'user' | 'ai'
  text: string
  trust?: string
  sources?: Source[]
  note?: string
  recommendations?: AssistantRecommendation[]
  itinerary?: AssistantItineraryDay[]
  profile?: AssistantProfile | null
}

const INTRO: Msg = {
  role: 'ai',
  text: 'Namaste! I am your heritage guide to Bharat’s living culture. Ask about monuments, festivals, museums, crafts or plan a journey — grounded in the Ministry of Culture dataset.',
}

const DEFAULT_PROMPTS = [
  'Heritage near me',
  'Buddhist sites in Maharashtra',
  'Plan a trip around Nashik',
  'Tell me about the Chola temples',
]

function CompassIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.5 7.5 13.8 13.8 7.5 16.5 10.2 10.2 16.5 7.5" fill="currentColor" stroke="none" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  )
}

function pageContext(pathname: string, search: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return 'You are on the Home page.'
  if (pathname.startsWith('/heritage/') && parts[1] === 'tangible') return 'You are exploring Tangible Heritage.'
  if (pathname.startsWith('/heritage/') && parts[1] === 'intangible') return 'You are exploring Intangible Heritage.'
  if (pathname.startsWith('/heritage/') && parts[1] === 'world') return 'You are exploring World Heritage sites.'
  if (parts[0] === 'heritage' && parts[1]) {
    return `You are viewing the heritage site “${decodeURIComponent(parts[1]).replace(/-/g, ' ')}”.`
  }
  if (parts[0] === 'states' && parts[1]) return 'You are browsing state heritage profiles.'
  if (parts[0] === 'cities' && parts[1]) return 'You are browsing a city heritage profile.'
  if (parts[0] === 'museums' && parts[1]) return 'You are viewing a museum profile.'
  if (parts[0] === 'search') {
    const m = /[?&]q=([^&]+)/.exec(search)
    const term = m ? decodeURIComponent(m[1]) : null
    return term ? `You are searching for “${term}”.` : 'You are on the Search page.'
  }
  if (parts[0] === 'assistant') return 'You are on the Ask Culture AI page.'
  return null
}

function buildPrompts(pathname: string, search: string): string[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'search') {
    const m = /[?&]q=([^&]+)/.exec(search)
    const term = m ? decodeURIComponent(m[1]) : null
    if (term && term.length > 1) {
      return [
        `Tell me about ${term}`,
        `Show me more heritage like ${term}`,
        'Heritage near me',
        'Plan a heritage trip around this region',
      ]
    }
    return DEFAULT_PROMPTS
  }
  if (parts[0] === 'heritage' && parts[1]) {
    if (parts[1] === 'tangible') {
      return ['Best Tangible heritage in India', 'Heritage near me', 'Plan a one-day heritage circuit', 'What makes a site UNESCO listed?']
    }
    if (parts[1] === 'intangible') {
      return ['Living intangible heritage of India', 'Famous traditional arts and crafts', 'Heritage near me', 'Festivals kept alive by communities']
    }
    if (parts[1] === 'world') {
      return ['UNESCO World Heritage sites in India', 'Why are these sites world-listed?', 'Heritage near me', 'Plan a trip to Ajanta and Ellora']
    }
    const name = decodeURIComponent(parts[1]).replace(/-/g, ' ')
    return [
      `Tell me about ${name}`,
      `What makes ${name} significant?`,
      'Heritage near me',
      'Plan a heritage trip around this region',
    ]
  }
  if (parts[0] === 'states' && parts[1]) {
    return ['Heritage sites in this state', 'Plan a trip across this state', 'Heritage near me', 'Famous festivals here']
  }
  if (parts[0] === 'cities' && parts[1]) {
    return ['Heritage sites in this city', 'Plan a one-day trip here', 'Heritage near me', 'Museums in this city']
  }
  if (parts[0] === 'museums' && parts[1]) {
    return ['Tell me about this museum', 'Museums near me', 'Heritage near me', 'What collections does it hold?']
  }
  if (parts[0] === 'assistant') {
    return DEFAULT_PROMPTS
  }
  return DEFAULT_PROMPTS
}

function buildPageContext(pathname: string): AssistantPageContext {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return { pathname, entity_name: null, entity_type: 'home' }
  if (parts[0] === 'heritage' && parts[1]) {
    if (parts[1] === 'tangible' || parts[1] === 'intangible' || parts[1] === 'world') {
      return { pathname, entity_name: parts[1], entity_type: 'heritage' }
    }
    return { pathname, entity_name: decodeURIComponent(parts[1]).replace(/-/g, ' '), entity_type: 'heritage' }
  }
  if (parts[0] === 'states' && parts[1]) {
    return { pathname, entity_name: decodeURIComponent(parts[1]).replace(/-/g, ' '), entity_type: 'state' }
  }
  if (parts[0] === 'cities' && parts[1]) {
    return { pathname, entity_name: decodeURIComponent(parts[1]).replace(/-/g, ' '), entity_type: 'city' }
  }
  if (parts[0] === 'museums' && parts[1]) {
    return { pathname, entity_name: decodeURIComponent(parts[1]).replace(/-/g, ' '), entity_type: 'museum' }
  }
  if (parts[0] === 'culture' && parts[1]) {
    return { pathname, entity_name: null, entity_type: 'culture' }
  }
  if (parts[0] === 'assistant') return { pathname, entity_name: null, entity_type: 'assistant' }
  if (parts[0] === 'search') return { pathname, entity_name: null, entity_type: 'search' }
  return { pathname, entity_name: null, entity_type: parts[0] }
}

function reasonText(reasons?: string[]): string | null {
  if (!reasons || reasons.length === 0) return null
  return `✓ ${reasons.join(' • ')}`
}

function RecommendationCard({ r }: { r: AssistantRecommendation }) {
  return (
    <article className="ai-guide-card">
      {r.image_url && (
        <div className="ai-guide-card-imgwrap">
          <img className="ai-guide-card-img" src={r.image_url} alt={r.name} loading="lazy" />
        </div>
      )}
      <div className="ai-guide-card-body">
        <div className="ai-guide-card-head">
          <h5>{r.name}</h5>
          {r.category && <span className="ai-guide-card-badge">{r.category}</span>}
        </div>
        {(r.location || r.distance_km != null) && (
          <p className="ai-guide-card-loc">
            {r.location}
            {r.distance_km != null && <span className="ai-guide-card-dist">{r.distance_km} km</span>}
          </p>
        )}
        {reasonText(r.match_reasons) && <p className="ai-guide-card-reasons">{reasonText(r.match_reasons)}</p>}
        {r.description && <p className="ai-guide-card-desc">{r.description}</p>}
        {r.slug && (
          <Link className="ai-guide-card-cta" to={`/heritage/${r.slug}`}>
            View Details <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </article>
  )
}

function ItineraryBlock({ days }: { days: AssistantItineraryDay[] }) {
  return (
    <div className="ai-guide-route">
      {days.map((d) => (
        <div className="ai-guide-route-day" key={d.day}>
          <div className="ai-guide-route-day-head">
            Day {d.day} <span className="ai-guide-route-day-area">{d.area}</span>
          </div>
          <ol className="ai-guide-route-stops">
            {d.stops.map((s) => (
              <li key={s.id} className="ai-guide-route-stop">
                <Link to={s.slug ? `/heritage/${s.slug}` : `/heritage/${s.id}`}>
                  {s.name}
                </Link>
                {s.distance_km != null && <span className="ai-guide-card-dist">{s.distance_km} km</span>}
                {s.location && <span className="ai-guide-route-loc"> — {s.location}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

function ProfileBanner({ p }: { p: AssistantProfile }) {
  return (
    <div className="ai-guide-profile">
      {p.image_url ? (
        <img className="ai-guide-profile-img" src={p.image_url} alt={p.name} loading="lazy" />
      ) : (
        <div className="ai-guide-profile-ico" aria-hidden>
          <CompassIcon size={26} />
        </div>
      )}
      <div className="ai-guide-profile-body">
        <div className="ai-guide-profile-head">
          <h5>{p.name}</h5>
          {p.category && <span className="ai-guide-card-badge">{p.category}</span>}
        </div>
        <p className="ai-guide-profile-line">
          {[p.location, p.city_name, p.state_name].filter(Boolean).join(' · ')}
          {p.period && <span className="ai-guide-card-dist"> {p.period}</span>}
        </p>
        {p.unesco_status && <p className="ai-guide-profile-unesco">UNESCO: {p.unesco_status}{p.unesco_year ? ` (${p.unesco_year})` : ''}</p>}
      </div>
    </div>
  )
}

export default function AIHeritageGuide() {
  const { lang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: t('ai_intro'),
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const location = useLocation()
  const bodyRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const msgsRef = useRef<Msg[]>(msgs)

  const pageContextObj = useMemo(() => buildPageContext(location.pathname), [location.pathname])

  useEffect(() => {
    msgsRef.current = msgs
  }, [msgs])

  const context = pageContext(location.pathname, location.search)
  const prompts = buildPrompts(location.pathname, location.search)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs, open])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = (e.target as HTMLElement).closest('.ai-guide-fab')
        if (!fab) setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      const m = document.querySelector('.ai-guide-fab') as HTMLElement | null
      m?.focus()
    }
  }, [open, location.pathname])

  const doAsk = useCallback(async (question: string, lat?: number, lng?: number) => {
    setBusy(true)
    try {
      const history: AssistantMessageHistory[] = msgsRef.current
        .slice(1)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }))
      const body = {
        question,
        history,
        page_context: pageContextObj,
        lang,
        ...(lat != null && lng != null ? { lat, lng } : {}),
      }
      const res = await post<AssistantResponse>('/assistant/query', body)
      setMsgs((m) => [
        ...m,
        {
          role: 'ai',
          text: res.answer,
          trust: res.trust,
          sources: res.sources,
          note: res.note,
          recommendations: res.recommendations,
          itinerary: res.itinerary,
          profile: res.profile,
        },
      ])
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: 'Sorry, the assistant is unavailable right now. Please try again.' }])
    } finally {
      setBusy(false)
    }
  }, [pageContextObj])

  const ask = useCallback(
    (question: string) => {
      const q = question.trim()
      if (!q || busy) return
      setInput('')
      setMsgs((m) => [...m, { role: 'user', text: q }])
      if (/\bnear me\b/i.test(q)) {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          setMsgs((m) => [...m, { role: 'ai', text: 'Location access is not supported in this browser. Try naming a city instead, e.g. “heritage sites near Pune”.' }])
          return
        }
        setBusy(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => void doAsk(q, pos.coords.latitude, pos.coords.longitude),
          () => {
            setMsgs((m) => [...m, { role: 'ai', text: 'I could not access your location. If you share a city instead, I can list heritage nearby — e.g. “heritage sites near Pune”.', note: 'Location permission was denied or timed out.' }])
            setBusy(false)
          },
          { timeout: 8000, maximumAge: 60000 },
        )
        return
      }
      void doAsk(q)
    },
    [busy, doAsk],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const promptsKey = prompts.join('|')

  return (
    <>
      <button
        type="button"
        className="ai-guide-fab"
        aria-label="Open AI Heritage Guide"
        aria-expanded={open}
        title="Ask the AI Heritage Guide"
        onClick={() => setOpen((o) => !o)}
      >
        <CompassIcon />
      </button>

      {open && (
        <div className="ai-guide-panel" ref={panelRef} role="dialog" aria-label="AI Heritage Guide">
          <div className="ai-guide-head">
            <span className="ai-guide-head-mark">
              <CompassIcon size={22} />
            </span>
            <div>
              <h4>AI Heritage Guide</h4>
              <p>Grounded knowledge from the Ministry of Culture dataset</p>
            </div>
            <button
              type="button"
              className="ai-guide-close"
              aria-label="Close AI Heritage Guide"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {context && (
            <div className="ai-guide-context">
              <span aria-hidden>📍</span>
              <span>{context}</span>
            </div>
          )}

          <div className="ai-guide-prompts" key={promptsKey}>
            <div className="ai-guide-prompts-label">Try asking</div>
            {prompts.map((p) => (
              <button
                key={p}
                type="button"
                className="ai-guide-prompt"
                onClick={() => ask(p)}
                disabled={busy}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="ai-guide-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={`${i}-${m.role}`} className="ai-guide-msg">
                <div className={`msg ${m.role}`}>{m.text}</div>
                {m.profile && <ProfileBanner p={m.profile} />}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="ai-guide-cards">
                    {m.recommendations.map((r) => (
                      <RecommendationCard key={r.id} r={r} />
                    ))}
                  </div>
                )}
                {m.itinerary && m.itinerary.length > 0 && <ItineraryBlock days={m.itinerary} />}
                {m.sources && m.sources.length > 0 && (
                  <div className="ai-guide-src">
                    {m.sources.map((s, j) => (
                      <span key={j} className="ai-guide-src-tag">
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
                {m.note && <div className="ai-guide-note">{m.note}</div>}
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

          <form className="ai-guide-input" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What festivals happen in Tamil Nadu?"
              aria-label="Ask the AI Heritage Guide"
            />
            <button type="submit" className="ai-guide-send" disabled={busy}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}