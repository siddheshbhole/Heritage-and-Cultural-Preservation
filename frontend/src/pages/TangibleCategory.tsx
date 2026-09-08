import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageCategory } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'
import { KIND_CHIP, KIND_META } from './Tangible'

interface CategoryPayload {
  category: HeritageCategory
  sites: Heritage[]
}

export default function TangibleCategory() {
  const { category } = useParams()
  const { data, loading, error, reload } = useFetch<CategoryPayload>(category ? `/heritage/tangible/${category}` : null)

  const meta = category ? KIND_META[category] : undefined
  const title = data?.category?.name || meta?.title || 'Tangible Heritage'
  const sub = meta?.desc || data?.category?.description || 'Tangible heritage sites in this category.'

  return (
    <>
      <PageHead
        title={title}
        sub={sub}
        crumbs={[
          { label: 'Heritage', to: '/heritage' },
          { label: 'Tangible Heritage', to: '/heritage/tangible' },
          { label: title },
        ]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading || !data ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error ? (
          <Empty big="🏛️" text="This tangible heritage category couldn’t load." error={error} onRetry={reload} />
        ) : data.sites.length === 0 ? (
          <Empty big="🏛️" text="No sites in this category yet." onRetry={reload} />
        ) : (
          <div className="card-grid tight">
            {data.sites.map((h) => (
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
      </div>
    </>
  )
}