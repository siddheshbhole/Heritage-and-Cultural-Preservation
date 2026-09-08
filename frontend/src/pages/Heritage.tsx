import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageCategory } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Section, Skeleton } from '../components/ui'

const HERO_CARDS = [
  {
    to: '/heritage/tangible',
    img: '/images/trending/red-fort.jpg',
    alt: 'Red Fort, Delhi',
    title: 'Tangible Cultural Heritage',
    desc: 'Forts, temples, monuments and natural wonders — the built and living stones of Bharat.',
    countOf: 'count',
  },
  {
    to: '/heritage/intangible',
    img: '/images/trending/garba.jpg',
    alt: 'Garba dancers, Gujarat',
    title: 'Intangible Cultural Heritage',
    desc: 'Dance, music, crafts, rituals and oral traditions passed down through generations.',
    countOf: 'count',
  },
  {
    to: '/heritage/world',
    img: '/images/heritage/taj-mahal.jpg',
    alt: 'Taj Mahal, Agra',
    title: 'World Heritage',
    desc: 'UNESCO-inscribed heritage of outstanding universal value across India.',
    countOf: 'count',
  },
]

export default function Heritage() {
  const { data: cats, loading: catsLoading, error: catsError, reload: reloadCats } = useFetch<HeritageCategory[]>('/heritage/categories')
  const { data: world, loading: worldLoading, error: worldError, reload: reloadWorld } = useFetch<Heritage[]>('/heritage/world')

  const counts = (cats ?? []).reduce(
    (acc, c) => {
      if (c.kind === 'tangible') acc.tangible += c.count
      else if (c.kind === 'intangible') acc.intangible += c.count
      return acc
    },
    { tangible: 0, intangible: 0 },
  )

  return (
    <>
      <PageHead
        title="Heritage & Culture of India"
        sub="Explore the tangible, intangible and UNESCO-listed heritage that tells the story of Bharat — monuments in stone, living traditions in practice, and wonders of universal value."
        crumbs={[{ label: 'Heritage' }]}
      />

      <div className="container">
        <div className="heritage-hero-cards">
          {HERO_CARDS.map((card) => {
            const count =
              card.to === '/heritage/world'
                ? world?.length ?? 0
                : card.to === '/heritage/tangible'
                  ? counts.tangible
                  : counts.intangible
            return (
              <Link key={card.to} to={card.to} className="hh-card" aria-label={card.title}>
                <CoverImg src={card.img} alt={card.alt} seed={card.title} style={{ position: 'absolute', inset: 0 }} />
                <div className="hh-veil" aria-hidden />
                {count > 0 && <span className="hh-count">{count} sites</span>}
                <div className="hh-body">
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Section
        kicker="From the World Heritage List"
        title="Wonders inscribed for all humanity"
        action={<Link className="see-all" to="/heritage/world">Explore World Heritage →</Link>}
      >
        {worldLoading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : worldError || !world || world.length === 0 ? (
          <Empty big="🌍" text="World Heritage entries aren’t available yet." error={worldError} onRetry={reloadWorld} />
        ) : (
          <div className="card-grid tight">
            {world.slice(0, 6).map((h) => (
              <Link key={h.id} to={`/heritage/${h.slug ?? h.id}`} className="feature-card">
                <div className="card-thumb">
                  <CoverImg src={h.main_image || h.image_url} alt={h.name} seed={h.name} />
                </div>
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-world">{h.unesco_status || 'UNESCO'}</span>
                    {h.unesco_year && <span>{h.unesco_year}</span>}
                  </div>
                  <h3>{h.name}</h3>
                  <p className="desc">{h.description || h.significance}</p>
                  <div className="meta">{h.region || h.category}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section alt="alt" kicker="Browse by heritage" title="Choose how you want to discover">
        <div className="card-grid tight">
          <Link to="/heritage/tangible" className="feature-card">
            <div className="card-thumb"><CoverImg src="/images/heritage/red-fort.jpg" alt="Tangible heritage" seed="Tangible" /></div>
            <div className="fc-body"><h3>Tangible Heritage</h3><p className="desc">Monuments, temples, forts and natural wonders — the built and living stones of Bharat.</p></div>
          </Link>
          <Link to="/heritage/intangible" className="feature-card">
            <div className="card-thumb"><CoverImg src="/images/trending/garba.jpg" alt="Intangible heritage" seed="Intangible" /></div>
            <div className="fc-body"><h3>Intangible Heritage</h3><p className="desc">Dance, music, crafts, rituals and oral traditions passed down through generations.</p></div>
          </Link>
          <Link to="/heritage/world" className="feature-card">
            <div className="card-thumb"><CoverImg src="/images/heritage/taj-mahal.jpg" alt="World heritage" seed="World" /></div>
            <div className="fc-body"><h3>World Heritage</h3><p className="desc">UNESCO-inscribed heritage of outstanding universal value across India.</p></div>
          </Link>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 14 }}>
          {catsLoading ? 'Loading entry counts…' : `Touched ${counts.tangible} tangible entries, ${counts.intangible} intangible art forms and ${world?.length ?? 0} World Heritage sites.`}
        </p>
        {catsError && <Empty big="⚠️" text="Entry counts couldn’t load." error={catsError} onRetry={reloadCats} />}
      </Section>
    </>
  )
}