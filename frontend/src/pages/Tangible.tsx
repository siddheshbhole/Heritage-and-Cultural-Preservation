import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageCategory } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Section, Skeleton, StatCard } from '../components/ui'

export const KIND_META: Record<string, { title: string; desc: string; img: string; alt: string }> = {
  'man-made': {
    title: 'Man-Made Masterpieces',
    desc: 'Forts, temples, palaces and monuments built by human hands across the ages.',
    img: '/images/heritage/amber-fort.jpg',
    alt: 'Amber Fort, Jaipur',
  },
  'natural': {
    title: 'Natural Wonders',
    desc: 'National parks, wetlands, mountains and landscapes preserved for their natural value.',
    img: '/images/heritage/ellora.jpg',
    alt: 'Ellora Caves',
  },
  'mixed': {
    title: 'Mixed & Cultural Landscapes',
    desc: 'Sites where natural and human values share the same sacred landscape.',
    img: '/images/heritage/ajanta.jpg',
    alt: 'Ajanta Caves',
  },
}

export const KIND_CHIP: Record<string, string> = {
  'man-made': 'Man-Made',
  'natural': 'Natural',
  'mixed': 'Mixed',
}

export default function Tangible() {
  const { data: cats, loading: loadingCats, error: errorCats, reload: reloadCats } = useFetch<HeritageCategory[]>('/heritage/categories?kind=tangible')
  const { data: items, loading, error, reload } = useFetch<Heritage[]>('/heritage/tangible')

  const kindCount = (slot: string) =>
    (cats ?? []).find((c) => c.slug === slot)?.count ?? 0

  return (
    <>
      <PageHead
        title="Tangible Cultural Heritage"
        sub="The physical heritage of India — monuments in stone and marble, temples and forts, along with the natural wonders protected for their value to humanity."
        crumbs={[{ label: 'Heritage', to: '/heritage' }, { label: 'Tangible' }]}
      />

      <div className="container">
        {loadingCats ? (
          <Skeleton style={{ height: 120, marginBottom: 30 }} />
        ) : (
          <div className="heritage-stats">
            <StatCard value={kindCount('man-made')} label="Man-Made Sites" />
            <StatCard value={kindCount('natural')} label="Natural Sites" />
            <StatCard value={kindCount('mixed')} label="Mixed Sites" />
            <StatCard value={(items ?? []).length} label="Total Tangible" />
          </div>
        )}

        <div className="heritage-hero-cards" style={{ marginBottom: 34 }}>
          {Object.entries(KIND_META).map(([slug, meta]) => (
            <Link key={slug} to={`/heritage/tangible/${slug}`} className="hh-card" aria-label={meta.title}>
              <CoverImg src={meta.img} alt={meta.alt} seed={meta.title} style={{ position: 'absolute', inset: 0 }} />
              <div className="hh-veil" aria-hidden />
              <span className="hh-count">{kindCount(slug)} sites</span>
              <div className="hh-body">
                <h3>{meta.title}</h3>
                <p>{meta.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Section
        kicker="All tangible heritage"
        title="Browse every monument, temple and natural site"
        action={
          <span className="see-all" style={{ color: 'var(--muted)', fontWeight: 600 }}>
            {loading ? '…' : `${(items ?? []).length} entries`}
          </span>
        }
      >
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error || !items || items.length === 0 ? (
          <Empty big="🏛️" text="Tangible heritage data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid tight">
            {items.map((h) => (
              <Link key={h.id} to={`/heritage/${h.slug ?? h.id}`} className="feature-card">
                <div className="card-thumb">
                  <CoverImg src={h.main_image || h.image_url} alt={h.name} seed={h.name} />
                </div>
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-blue">{KIND_CHIP[h.category] || h.category}</span>
                    {h.unesco_status === 'WORLD' && (
                      <span className="chip chip-world">UNESCO {h.unesco_year ? `· ${h.unesco_year}` : ''}</span>
                    )}
                  </div>
                  <h3>{h.name}</h3>
                  <p className="desc">{h.description || h.significance}</p>
                  <div className="meta">
                    {h.region && <span>{h.region}</span>}
                    {h.historical_period && <span>{h.historical_period}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {(errorCats || loadingCats) && (
          <Empty big="⚠️" text="Category counts couldn’t load." error={errorCats} onRetry={reloadCats} />
        )}
      </Section>
    </>
  )
}