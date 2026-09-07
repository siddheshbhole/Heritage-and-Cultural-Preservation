import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Event, Heritage, Museum, State } from '../api/client'
import IndiaMap from '../components/IndiaMap'
import { EXPLORE_NAV } from '../components/ExploreNav'
import { Empty, Section, Skeleton, gradientFor, initials } from '../components/ui'

const UNESCO_NAMES = [
  'Hampi monuments',
  'Konark Sun Temple',
  'Qutub Minar',
  "Humayun's Tomb",
  'Red Fort',
  'Sanchi Stupa',
  'Chhatrapati Shivaji Maharaj Terminus',
  'Elephanta Caves',
  'Dholavira Harappan city',
  'Bodh Gaya',
  'Amber Fort',
  'Mawsmai living-root bridge',
]

const DESTINATIONS = [
  { img: '/images/heritage/hero/taj-mahal.webp', tag: 'Uttar Pradesh', title: 'Agra', desc: 'The Taj Mahal and the grand Mughal legacy on the Yamuna.', to: '/heritage' },
  { img: '/images/heritage/hero/amber-fort.webp', tag: 'Rajasthan', title: 'Jaipur & the Amber Fort', desc: 'The Pink City of the Rajput kingdoms, crowned by Amber.', to: '/heritage' },
  { img: '/images/heritage/hero/hampi.webp', tag: 'Karnataka', title: 'Hampi', desc: 'Ruins of Vijayanagara spread across a landscape of boulders.', to: '/heritage' },
  { img: '/images/heritage/hero/konark.webp', tag: 'Odisha', title: 'Konark', desc: 'The Sun Temple, a stone chariot of Kalinga architecture.', to: '/heritage' },
  { img: '/images/heritage/hero/ellora.webp', tag: 'Maharashtra', title: 'Ellora', desc: 'Rock-cut caves, temples and monasteries of the Deccan.', to: '/heritage' },
]

const ROUTES = [
  { img: '/images/heritage/hero/taj-mahal.webp', kicker: 'North India', title: 'Golden Triangle', desc: 'Delhi · Agra · Jaipur — forts, tombs and imperial splendour.', to: '/heritage' },
  { img: '/images/heritage/hero/konark.webp', kicker: 'East India', title: 'Sacred Coast', desc: 'Puri · Konark · Bhubaneswar — temples by the sea.', to: '/heritage' },
  { img: '/images/heritage/hero/ellora.webp', kicker: 'Buddhist Trail', title: 'Gaya to Sanchi', desc: 'Bodh Gaya · Sarnath · Sanchi — the Buddha across India.', to: '/heritage' },
  { img: '/images/heritage/hero/hampi.webp', kicker: 'Deccan', title: 'Vijayanagara Trail', desc: 'Hampi · Bidar · Golconda — capitals of the Deccan sultanates.', to: '/heritage' },
]

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDate()
  const mon = d.toLocaleString('en-US', { month: 'short' })
  return { day, mon }
}

const STATUS_CLASS: Record<string, string> = {
  UPCOMING: 'chip',
  ONGOING: 'chip chip-green',
  COMPLETED: 'chip chip-outline',
}

export default function Explore() {
  const regionQ = useFetch<State[]>('/states')
  const heritageQ = useFetch<Heritage[]>('/heritage')
  const eventsQ = useFetch<Event[]>('/events')
  const museumsQ = useFetch<Museum[]>('/museums')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const states = regionQ.data ?? []
  const heritage = heritageQ.data ?? []
  const events = eventsQ.data ?? []
  const museums = museumsQ.data ?? []

  const unesco = useMemo(
    () => heritage.filter((h) => UNESCO_NAMES.some((n) => h.name.toLowerCase().includes(n.toLowerCase()))),
    [heritage],
  )
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.status === 'UPCOMING' || e.status === 'ONGOING')
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 8),
    [events],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return states
    return states.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.region || '').toLowerCase().includes(q),
    )
  }, [states, query])

  const anyError = regionQ.error || heritageQ.error || eventsQ.error || museumsQ.error
  const anyRetry = () => {
    regionQ.reload()
    heritageQ.reload()
    eventsQ.reload()
    museumsQ.reload()
  }

  return (
    <div className="explore-page">
      {/* Cinematic hero */}
      <section className="explore-hero">
        <div className="eh-bg shift" aria-hidden>
          <img src="/images/heritage/hero/taj-mahal.webp" alt="" />
        </div>
        <div className="eh-overlay" aria-hidden />
        <div className="container">
          <div className="eh-inner">
            <span className="eyebrow">Explore Bharat · Ministry of Culture</span>
            <h1>India’s Heritage,<br />Our Shared Pride</h1>
            <p className="eh-sub">
              Discover, experience and preserve the rich cultural heritage of India through monuments,
              festivals, traditions, music, crafts and stories.
            </p>
            <div className="eh-actions">
              <Link to="/heritage" className="btn" style={{ background: 'var(--gold)', color: '#4a3703', fontWeight: 700 }}>
                Explore Heritage
              </Link>
              <a href="#map-explorer" className="btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
                Explore on the Map
              </a>
            </div>
            <div className="eh-strip">
              <div className="eh-stat"><b>28+8</b><span>States & UTs</span></div>
              <div className="eh-stat"><b>{heritage.length || '—'}</b><span>Heritage sites</span></div>
              <div className="eh-stat"><b>{museums.length || '—'}</b><span>Museums</span></div>
              <div className="eh-stat"><b>{events.length || '—'}</b><span>Festivals & events</span></div>
            </div>
          </div>
        </div>
        <div className="eh-scroll" aria-hidden />
      </section>

      {/* Map + quick stats */}
      <Section
        kicker="Map Explorer"
        title="Choose your state, find your story"
        action={<Link to="/states" className="see-all">List view →</Link>}
      >
        <div className="map-shell" id="map-explorer">
          <div className="map-panel">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              <input
                className="input"
                style={{ maxWidth: 320 }}
                placeholder="Search by state or region…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Filter states"
              />
            </div>
            {regionQ.loading ? (
              <Skeleton style={{ height: 400 }} />
            ) : states.length > 0 ? (
              <IndiaMap states={states} onSelect={(s) => navigate(`/states/${s.id}`)} />
            ) : (
              <Empty big="—" text="State dataset not loaded." error={regionQ.error} onRetry={regionQ.reload} />
            )}
            {!regionQ.loading && filtered.length > 0 && (
              <div className="explore-side" style={{ marginTop: 16, alignItems: 'stretch' }}>
                <div className="card-grid tight">
                  {filtered.map((s) => (
                    <Link key={s.id} to={`/states/${s.id}`} className="feature-card">
                      <div className="fc-body">
                        <div className="meta">
                          <span className="chip chip-green">{s.region || 'State'}</span>
                        </div>
                        <h3>{s.name}</h3>
                        <p className="desc">
                          {s.capital || ''}
                          {s.heritage_count ? ` · ${s.heritage_count} heritage sites` : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="explore-side">
            <div className="pm-card">
              <h3>Explore Bharat</h3>
              <p>
                28 states, 8 union territories and a living civilisation. Journey from the Himalayas
                to the seas through the culture portal of the Ministry of Culture.
              </p>
              <Link to="/assistant" className="btn btn-sm btn-gold">Ask Culture AI</Link>
            </div>
            <div className="explore-stat-row">
              {[
                { v: states.length, l: 'States & UTs' },
                { v: heritage.length, l: 'Heritage sites' },
                { v: museums.length, l: 'Museums' },
                { v: upcoming.length, l: 'Upcoming festivals' },
              ].map((s) => (
                <div key={s.l} className="stat">
                  <b>{s.v || '—'}</b>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Discover by category */}
      <Section kicker="Discover" title="Explore Bharat by theme" alt="alt">
        <div className="card-grid tight">
          {EXPLORE_NAV.map((n) => (
            <Link key={n.label} to={n.to} className="mega-item">
              <span className="mega-label">{n.label}</span>
              <span className="mega-desc">{n.desc}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured destinations */}
      <Section
        kicker="Featured Destinations"
        title="Icons of the subcontinent"
        action={<Link to="/heritage" className="see-all">All sites →</Link>}
      >
        <div className="dest-grid">
          {DESTINATIONS.map((d) => (
            <Link key={d.title} to={d.to} className="dest-card">
              <img src={d.img} alt={d.title} loading="lazy" />
              <div className="dc-shade" aria-hidden />
              <div className="dc-body">
                <span className="dc-tag">{d.tag}</span>
                <h3>{d.title}</h3>
                <p>{d.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Heritage routes */}
      <Section kicker="Heritage Routes" title="Journeys through time" alt="alt">
        <div className="route-grid">
          {ROUTES.map((r) => (
            <Link key={r.title} to={r.to} className="route-card">
              <img src={r.img} alt={r.title} loading="lazy" />
              <div className="rc-shade" aria-hidden />
              <div className="rc-body">
                <span className="rc-kicker">{r.kicker}</span>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* UNESCO explorer */}
      <Section
        kicker="World Heritage"
        title="UNESCO heritage explorer"
        action={<Link to="/heritage" className="see-all">More sites →</Link>}
      >
        {heritageQ.loading ? (
          <div className="unesco-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : unesco.length > 0 ? (
          <div className="unesco-grid">
            {unesco.map((h) => (
              <Link key={h.id} to={`/heritage/${h.id}`} className="card hoverable unesco-card">
                <div className="card-thumb gold-thumb">{initials(h.name)}</div>
                <h3>{h.name}</h3>
                <p className="desc">{h.location || h.state_name || h.category}</p>
                <div className="meta">
                  <span className="chip">World Heritage</span>
                  <span>{h.historical_period || h.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty big="—" text="UNESCO dataset not loaded." error={heritageQ.error} onRetry={heritageQ.reload} />
        )}
      </Section>

      {/* Museum explorer */}
      <Section
        kicker="Museum Explorer"
        title="Galleries & archives of memory"
        alt="alt"
        action={<Link to="/museums" className="see-all">All museums →</Link>}
      >
        {museumsQ.loading ? (
          <div className="museum-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : museums.length > 0 ? (
          <div className="museum-grid">
            {museums.slice(0, 8).map((m) => (
              <Link key={m.id} to={`/museums/${m.id}`} className="card hoverable museum-card">
                <div className="card-thumb" style={{ background: gradientFor(m.name) }}>{initials(m.name)}</div>
                <h3>{m.name}</h3>
                <p className="desc">{m.location || m.description || 'A treasury of India’s culture.'}</p>
                <div className="meta">
                  <span className="chip chip-green">{m.collections ? 'Curated collections' : 'Museum'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty big="—" text="Museum dataset not loaded." error={museumsQ.error} onRetry={museumsQ.reload} />
        )}
      </Section>

      {/* Festival calendar */}
      <Section
        kicker="Festival Calendar"
        title="Celebrations coming up"
        action={<Link to="/culture" className="see-all">All celebrations →</Link>}
      >
        {eventsQ.loading ? (
          <div className="card-grid">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : upcoming.length > 0 ? (
          <div className="card-grid tight">
            {upcoming.map((ev) => {
              const s = fmtDate(ev.start_date)
              const e = fmtDate(ev.end_date)
              return (
                <div key={ev.id} className="card fest-card">
                  <div className="fest-dates">
                    <div className="fest-date-block">
                      <b>{s.day}</b>
                      <span>{s.mon}</span>
                    </div>
                    <div className="meta" style={{ margin: 0 }}>
                      <span>{ev.location || 'Across India'}</span>
                      {s.day !== e.day && <span>to {e.day} {e.mon}</span>}
                    </div>
                  </div>
                  <h3>{ev.name}</h3>
                  <p className="desc">{ev.description}</p>
                  <span className={`fest-status ${STATUS_CLASS[ev.status] || 'chip'}`}>{ev.status}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty big="—" text="Festival dataset not loaded." error={eventsQ.error} onRetry={eventsQ.reload} />
        )}
      </Section>

      {/* Closing CTA */}
      <Section title="Begin your cultural journey">
        <div className="explore-cta">
          <p>
            Every monument, ritual and craft carries a story. Ask our culture assistant or start
            exploring the heritage of every state and city in India.
          </p>
          <div className="eh-actions" style={{ justifyContent: 'center' }}>
            <Link to="/assistant" className="btn" style={{ background: 'var(--gold)', color: '#4a3703', fontWeight: 700 }}>
              Ask Culture AI
            </Link>
            <Link to="/explore" className="btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              Browse everything
            </Link>
          </div>
        </div>
        {anyError && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
            Some datasets could not be loaded. <button type="button" className="btn btn-sm btn-outline" onClick={anyRetry}>Retry</button>
          </p>
        )}
      </Section>
    </div>
  )
}