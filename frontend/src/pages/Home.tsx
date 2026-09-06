import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { HomeData } from '../api/client'
import Ticker from '../components/Ticker'
import Carousel from '../components/Carousel'
import ExploreDashboard from '../components/ExploreDashboard'
import GovernmentInitiativesScroller from '../components/GovernmentInitiativesScroller'
import { Section, gradientFor, StatCard, Skeleton } from '../components/ui'
import { MiniIndia } from '../components/IndiaMap'

export default function Home() {
  const { data, loading } = useFetch<HomeData>('/home')

  const stats = data?.stats
  const featured = data?.featured_heritage ?? []
  const apps = data?.apps ?? []
  const announcements = data?.announcements ?? []

  return (
    <>
      <GovernmentInitiativesScroller />

      <Ticker />

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>
              Discover the <em>living soul</em> of Bharat
            </h1>
            <p className="lead">
              One digital gateway to India’s states, cities, heritage sites, museums and living
              traditions — curated from the Ministry of Culture and trusted institutions.
            </p>
            <div className="hero-strip">
              <Link to="/explore" className="btn btn-primary">Explore the map →</Link>
              <Link to="/assistant" className="btn btn-outline">Ask Culture AI</Link>
            </div>
            {stats && (
              <div className="stats" style={{ maxWidth: 620 }}>
                <StatCard value={stats.states} label="States" />
                <StatCard value={stats.heritage_sites} label="Heritage sites" />
                <StatCard value={stats.museums} label="Museums" />
                <StatCard value={stats.events} label="Festivals & events" />
                <StatCard value={stats.publications} label="Publications" />
                <StatCard value={stats.cities} label="Cities" />
              </div>
            )}
          </div>
          <div className="hero-map-card">
            <MiniIndia />
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              Every state tells a story — explore them in the <Link to="/explore">map explorer</Link>.
            </p>
          </div>
        </div>
      </section>

      <Section
        kicker="Curated by MoC"
        title="Heritage & trending"
        action={<Link to="/heritage" className="see-all">See all heritage →</Link>}
      >
        <div className="card-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
            : featured.map((h) => (
                <Link key={h.id} to={`/heritage/${h.id}`} className="feature-card">
                  <div className="card-thumb" style={{ background: gradientFor(h.name) }}>
                    {h.name.split(/\s+/)[0][0]}
                  </div>
                  <div className="fc-body">
                    <span className="chip chip-green">{h.category}</span>
                    <h3>{h.name}</h3>
                    <p className="desc" style={{ color: 'var(--muted)' }}>{h.description}</p>
                    <div className="meta">
                      <span>{h.city_name || h.state_name || ''}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </Section>

      <Section kicker="Official digital services" title="Culture, one app at a time" alt="altgreen">
        {apps.length > 0 ? <Carousel items={apps} /> : <Skeleton />}
      </Section>

      <Section
        kicker="Dashboards"
        title="Explore the knowledge base"
        action={<Link to="/explore" className="see-all">Open explorer →</Link>}
      >
        <ExploreDashboard />
      </Section>

      <Section kicker="Updates" title="Latest announcements">
        {loading ? (
          <Skeleton style={{ height: 90 }} />
        ) : (
          <div className="feed">
            {(announcements.length ? announcements : []).map((a) => (
              <div className="feed-item" key={a.id}>
                <div className="feed-head">
                  <span className="chip">{a.date}</span>
                  <span className="muted">{a.source}</span>
                </div>
                <a href={a.url} target="_blank" rel="noreferrer">
                  <b style={{ fontSize: 15 }}>{a.title}</b>
                </a>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{a.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}