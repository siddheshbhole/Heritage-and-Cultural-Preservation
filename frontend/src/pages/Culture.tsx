import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { CultureApp, Event } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'
import BookingModal from '../components/BookingModal'

const STATUS_CHIP: Record<string, unknown> = {
  UPCOMING: 'chip chip-green',
  ONGOING: 'chip',
  COMPLETED: 'chip chip-outline',
}

function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Culture() {
  const eventsQ = useFetch<Event[]>('/events')
  const apps = useFetch<CultureApp[]>('/apps')

  const events = eventsQ.data ?? []
  const loading = eventsQ.loading || apps.loading
  const error = eventsQ.error || apps.error
  const retry = () => {
    eventsQ.reload()
    apps.reload()
  }

  const [tab, setTab] = useState<'culture' | 'rituals'>('culture')
  const [filter, setFilter] = useState('All')
  const [booking, setBooking] = useState<Event | null>(null)

  const cultureEvents = useMemo(() => events.filter((e) => e.event_type !== 'ritual'), [events])
  const ritualEvents = useMemo(() => events.filter((e) => e.event_type === 'ritual'), [events])

  const statuses = useMemo(() => [...new Set(cultureEvents.map((e) => e.status).filter(Boolean))], [cultureEvents])

  const shown = useMemo(
    () => (filter === 'All' ? cultureEvents : cultureEvents.filter((e) => e.status === filter)),
    [cultureEvents, filter],
  )

  const cards = tab === 'culture' ? shown : ritualEvents
  const isRituals = tab === 'rituals'

  return (
    <>
      <PageHead
        title="Culture & Rituals"
        sub="Festivals, rituals, arts and living heritage across the states — plus the official digital services that bring culture to your doorstep."
        crumbs={[{ label: 'Culture' }]}
      />

      <div className="container">
        <div className="culture-selector" role="tablist" aria-label="Culture sections">
          <button
            className={`culture-selector-option${tab === 'culture' ? ' active' : ''}`}
            onClick={() => setTab('culture')}
            role="tab"
            aria-selected={tab === 'culture'}
          >
            <span className="culture-selector-title">Culture</span>
            <span className="culture-selector-sub">"Explore India's living traditions, festivals, arts and cultural expressions."</span>
          </button>
          <button
            className={`culture-selector-option${tab === 'rituals' ? ' active' : ''}`}
            onClick={() => setTab('rituals')}
            role="tab"
            aria-selected={tab === 'rituals'}
          >
            <span className="culture-selector-title">Rituals</span>
            <span className="culture-selector-sub">"Discover the ceremonies, customs and sacred observances of every state."</span>
          </button>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 8 }}>
        {!loading && !isRituals && cultureEvents.length > 0 && (
          <div className="filters">
            <button className={`filter-pill${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>All</button>
            {statuses.map((s) => (
              <button key={s} className={`filter-pill${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s.toLowerCase()}</button>
            ))}
          </div>
        )}
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        <div className="culture-content" key={tab === 'culture' ? 'culture' : 'rituals'}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : cards.length === 0 ? (
          <Empty
            big={isRituals ? '🕉️' : '🎭'}
            text={isRituals ? 'Ritual & practice data hasn’t been connected yet.' : 'Festival & event data hasn’t been connected yet.'}
            error={error}
            onRetry={retry}
          />
        ) : (
          <div className="card-grid">
            {cards.map((e) => (
              <div className="card has-bg" key={e.id}>
                {e.image_url && <img className="card-bg-img" src={e.image_url} alt="" aria-hidden="true" loading="lazy" />}
                <div className="meta">
                  <span className={(STATUS_CHIP[e.status] as string) ?? 'chip chip-outline'}>{e.status.toLowerCase()}</span>
                  <span>{e.category}</span>
                </div>
                <h3>{e.name}</h3>
                <p className="desc">{e.description}</p>
                <div className="meta">
                  <span>📅 {fmtDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` – ${fmtDate(e.end_date)}` : ''}</span>
                  <span>{e.location}</span>
                </div>
                <div className="hero-strip" style={{ marginTop: 8 }}>
                  {isRituals && e.bookable && (
                    <button className="btn btn-sm btn-primary" onClick={() => setBooking(e)}>Book Ticket</button>
                  )}
                  {e.registration_url && <a className="btn btn-sm btn-primary" href={e.registration_url} target="_blank" rel="noreferrer">Register →</a>}
                  <Link className="btn btn-sm btn-outline" to={`/culture/${e.id}`}>Details</Link>
                  {e.official_url && <a className="btn btn-sm btn-ghost" href={e.official_url} target="_blank" rel="noreferrer">Official ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {!isRituals && (
        <div className="container">
          <h3 style={{ marginBottom: 18 }}>Official culture services</h3>
          <div className="card-grid">
            {(apps.data ?? []).map((a) => (
              <a key={a.id} className="feature-card" href={a.official_url} target="_blank" rel="noreferrer">
                <div className="card-thumb service-thumb" style={{ background: gradientFor(a.title) }}>
                  {a.image_url ? (
                    <img className="thumb-img" src={a.image_url} alt={a.title} loading="lazy" />
                  ) : (
                    <span>{a.title.split(/\s+/)[0]?.[0]}</span>
                  )}
                </div>
                <div className="fc-body">
                  <span className="chip chip-green">{a.category}</span>
                  <h3>{a.title}</h3>
                  <p className="desc">{a.description}</p>
                  <div className="meta"><span>{a.action} ↗</span></div>
                </div>
              </a>
            ))}
          </div>
          {(apps.data ?? []).length === 0 && !apps.loading && <p className="muted">Official app links will appear once connected.</p>}
        </div>
      )}

      <div className="container" style={{ margin: '34px 0 44px' }}>
        <div className="banner-cta">
          <div>
            <h3>Explore culture by state</h3>
            <p>Every state carries its own festivals, rituals and crafts. Start from the map.</p>
          </div>
          <Link to="/explore" className="btn btn-primary" style={{ background: '#e8630a' }}>Explore →</Link>
        </div>
      </div>

      {booking && <BookingModal event={booking} onClose={() => setBooking(null)} />}
    </>
  )
}