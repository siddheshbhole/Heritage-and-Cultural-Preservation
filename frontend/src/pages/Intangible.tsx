import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageCategory } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Section, Skeleton, StatCard } from '../components/ui'

export default function Intangible() {
  const { data: cats, loading: loadingCats, error: errorCats, reload: reloadCats } = useFetch<HeritageCategory[]>('/heritage/categories?kind=intangible')
  const { data: items, loading, error, reload } = useFetch<Heritage[]>('/heritage/intangible')

  const ichCount = (items ?? []).filter((h) => h.unesco_status === 'INTANGIBLE').length
  const visibleCats = (cats ?? []).filter((c) => c.count > 0).sort((a, b) => b.count - a.count)

  return (
    <>
      <PageHead
        title="Intangible Cultural Heritage"
        sub="Living expressions passed from generation to generation — classical and folk arts, music and dance, crafts, rituals, oral traditions and traditional knowledge that keep India’s culture alive."
        crumbs={[{ label: 'Heritage', to: '/heritage' }, { label: 'Intangible' }]}
      />

      <div className="container">
        <div className="heritage-stats">
          <StatCard value={(items ?? []).length} label="Living Art Forms" />
          <StatCard value={ichCount} label="On UNESCO ICH List" />
          <StatCard value={visibleCats.length} label="Art Categories" />
        </div>

        {loadingCats || loading ? (
          <Skeleton style={{ height: 320, marginBottom: 34 }} />
        ) : (
          <div className="card-grid tight" style={{ marginBottom: 34 }}>
            {visibleCats.map((c) => (
              <Link key={c.id} to={`/heritage/intangible/${c.slug}`} className="feature-card">
                <div className="card-thumb">
                  <CoverImg src={c.image_url} alt={c.name} seed={c.name} />
                </div>
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-blue">{c.count} forms</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p className="desc">{c.description || 'Living traditions of India.'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Section
        kicker="The living arts"
        title="Every art form, practice and tradition"
        action={
          <span className="see-all" style={{ color: 'var(--muted)', fontWeight: 600 }}>
            {loading ? '…' : `${(items ?? []).length} traditions`}
          </span>
        }
      >
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error || !items || items.length === 0 ? (
          <Empty big="🎭" text="Intangible heritage data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid tight">
            {items.map((h) => (
              <Link key={h.id} to={`/heritage/${h.slug ?? h.id}`} className="feature-card">
                <div className="card-thumb">
                  <CoverImg src={h.main_image || h.image_url} alt={h.name} seed={h.name} />
                </div>
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-blue">{h.category}</span>
                    {h.unesco_status === 'INTANGIBLE' && (
                      <span className="chip chip-blue">UNESCO ICH {h.unesco_year ? `· ${h.unesco_year}` : ''}</span>
                    )}
                  </div>
                  <h3>{h.name}</h3>
                  <p className="desc">{h.description || h.significance}</p>
                  <div className="meta">{h.region}</div>
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