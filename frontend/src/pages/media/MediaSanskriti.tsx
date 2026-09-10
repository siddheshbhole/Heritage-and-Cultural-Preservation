import { useFetch } from '../../api/hooks'
import type { MediaSanskritiItem } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

interface SanskritiRes { items: MediaSanskritiItem[]; source: { source_name: string; source_url: string } }

export default function MediaSanskriti() {
  const { data, loading, error, reload } = useFetch<SanskritiRes>('/media/sanskriti')

  return (
    <>
      <PageHead
        title="Sanskriti"
        sub="Curated cultural collections and heritage stories from the Ministry of Culture."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Sanskriti' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : data && data.items.length > 0 ? (
          <div className="card-grid">
            {data.items.map((s) => (
              <div key={s.id} className="feature-card">
                <CoverImg src={s.image_url} alt={s.title} seed={s.title} style={{ height: 200 }} />
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{s.title}</h3>
                  <p className="desc" style={{ fontSize: 13.5, maxHeight: 80, overflow: 'hidden' }}>{s.description}</p>
                  <div className="meta">
                    {s.source_label && <span style={{ fontSize: 12 }}>{s.source_label}</span>}
                    {s.official_url && (
                      <a href={s.official_url} target="_blank" rel="noreferrer">Explore &rarr;</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty big="📚" text="Sanskriti collections will appear here." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
