import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageCategory } from '../api/client'
import { PageHead } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'

interface CategoryPayload {
  category: HeritageCategory
  sites: Heritage[]
}

export default function IntangibleArtForm() {
  const { artForm } = useParams()
  const { data, loading, error, reload } = useFetch<CategoryPayload>(artForm ? `/heritage/intangible/${artForm}` : null)

  const title = data?.category?.name || 'Intangible Heritage'
  const sub = data?.category?.description || 'Living traditions of India — dance, music, crafts, rituals and oral knowledge.'

  return (
    <>
      <PageHead
        title={title}
        sub={sub}
        crumbs={[
          { label: 'Heritage', to: '/heritage' },
          { label: 'Intangible Heritage', to: '/heritage/intangible' },
          { label: title },
        ]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading || !data ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error ? (
          <Empty big="🎭" text="This art-form category couldn’t load." error={error} onRetry={reload} />
        ) : data.sites.length === 0 ? (
          <Empty big="🎭" text="No traditions in this category yet." onRetry={reload} />
        ) : (
          <div className="card-grid tight">
            {data.sites.map((h) => (
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
                  <div className="meta">
                    {h.region && <span>{h.region}</span>}
                    {h.unesco_category && <span>{h.unesco_category}</span>}
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