import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Section, Skeleton, StatCard } from '../components/ui'

export default function WorldHeritage() {
  const { data: items, loading, error, reload } = useFetch<Heritage[]>('/heritage/world')

  const stats = useMemo(() => {
    const list = items ?? []
    const by = (cat: string) => list.filter((h) => h.unesco_category === cat).length
    return {
      Cultural: by('Cultural'),
      Natural: by('Natural'),
      Mixed: by('Mixed'),
      Total: list.length,
    }
  }, [items])

  return (
    <>
      <PageHead
        title="World Heritage"
        sub="Properties of outstanding universal value inscribed on the UNESCO World Heritage List — India’s cultural, natural and mixed wonders."
        crumbs={[{ label: 'Heritage', to: '/heritage' }, { label: 'World Heritage' }]}
      />

      <div className="container">
        <div className="heritage-stats">
          <StatCard value={stats.Total} label="Inscribed Sites" />
          <StatCard value={stats.Cultural} label="Cultural" />
          <StatCard value={stats.Natural} label="Natural" />
          <StatCard value={stats.Mixed} label="Mixed" />
        </div>
      </div>

      <Section kicker="The UNESCO list" title="India’s World Heritage Sites">
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error || !items || items.length === 0 ? (
          <Empty big="🌍" text="World Heritage data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid tight">
            {items.map((h) => (
              <Link key={h.id} to={`/heritage/${h.slug ?? h.id}`} className="feature-card">
                <div className="card-thumb">
                  <CoverImg src={h.main_image || h.image_url} alt={h.name} seed={h.name} />
                </div>
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-world">UNESCO</span>
                    {h.unesco_year && <span className="chip chip-world">Inscribed {h.unesco_year}</span>}
                    <span className="chip chip-outline">{h.unesco_category || h.category}</span>
                  </div>
                  <h3>{h.name}</h3>
                  <p className="desc">{h.description || h.significance}</p>
                  <div className="meta">
                    {h.region && <span>{h.region}</span>}
                    {h.location && <span>{h.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}