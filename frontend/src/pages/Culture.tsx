import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { CultureApp, Event } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'

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

  const [filter, setFilter] = useState('All')

  const statuses = useMemo(() => [...new Set(events.map((e) => e.status).filter(Boolean))], [events])

  const shown = useMemo(() => (filter === 'All' ? events : events.filter((e) => e.status === filter)), [events, filter])

  return (
    <>
      <PageHead
        title="Culture & Rituals"
        sub="Festivals, rituals, arts and living heritage across the states — plus the official digital services that bring culture to your doorstep."
        crumbs={[{ label: 'Culture' }]}
      />

      <div className="container" style={{ marginBottom: 8 }}>
        <h3 style={{ marginBottom: 4 }}>Festivals & cultural events</h3>
        {!loading && events.length > 0 && (
          <div className="filters">
            <button className={`filter-pill${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>All</button>
            {statuses.map((s) => (
              <button key={s} className={`filter-pill${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s.toLowerCase()}</button>
            ))}
          </div>
        )}
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : events.length === 0 ? (
          <Empty big="🎭" text="Festival & event data hasn’t been connected yet." error={error} onRetry={retry} />
        ) : (
          <div className="card-grid">
            {shown.map((e) => (
              <div className="card" key={e.id}>
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
                  {e.registration_url && <a className="btn btn-sm btn-primary" href={e.registration_url} target="_blank" rel="noreferrer">Register →</a>}
                  <Link className="btn btn-sm btn-outline" to={`/culture/${e.id}`}>Details</Link>
                  {e.official_url && <a className="btn btn-sm btn-ghost" href={e.official_url} target="_blank" rel="noreferrer">Official ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <div className="container" style={{ margin: '34px 0 44px' }}>
        <div className="banner-cta">
          <div>
            <h3>Explore culture by state</h3>
            <p>Every state carries its own festivals, rituals and crafts. Start from the map.</p>
          </div>
          <Link to="/explore" className="btn btn-primary" style={{ background: '#e8630a' }}>Explore →</Link>
        </div>
      </div>
    </>
  )
}