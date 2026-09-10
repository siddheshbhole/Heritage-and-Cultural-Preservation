import { useFetch } from '../../api/hooks'
import type { MediaBrochure } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

export default function MediaBrochure() {
  const { data: items, loading, error, reload } = useFetch<MediaBrochure[]>('/media/brochures')

  return (
    <>
      <PageHead
        title="Brochures"
        sub="Official brochures and publications from the Ministry of Culture, Government of India."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Brochure' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /></div>
        ) : items && items.length > 0 ? (
          <div className="card-grid">
            {items.map((b) => (
              <div key={b.id} className="feature-card">
                <CoverImg src={b.image_url} alt={b.title} seed={b.title} style={{ height: 220 }} />
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{b.title}</h3>
                  <p className="desc" style={{ fontSize: 13.5 }}>{b.description}</p>
                  <div className="meta" style={{ gap: 8 }}>
                    {b.pdf_url && (
                      <a href={b.pdf_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                        Download PDF &rarr;
                      </a>
                    )}
                    {b.source_url && (
                      <a href={b.source_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                        Source &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty big="📄" text="Brochures will appear here." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
