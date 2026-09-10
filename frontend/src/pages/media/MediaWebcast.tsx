import { useFetch } from '../../api/hooks'
import type { MediaWebcastResponse } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton } from '../../components/ui'

export default function MediaWebcast() {
  const { data, loading, error, reload } = useFetch<MediaWebcastResponse>('/media/webcast')

  return (
    <>
      <PageHead
        title="Webcast"
        sub="Live and archived webcasts from the Ministry of Culture, Government of India."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Webcast' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /></div>
        ) : data ? (
          <>
            {data.note && (
              <div className="info-banner" style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>{data.note}</p>
              </div>
            )}

            {data.live.length > 0 && (
              <>
                <h3 style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e53e3e', marginRight: 8 }} />
                  Live Now
                </h3>
                <div className="card-grid" style={{ marginBottom: 28 }}>
                  {data.live.map((w) => (
                    <div key={w.id} className="feature-card">
                      <div className="fc-body">
                        <h3 style={{ fontSize: 15 }}>{w.title}</h3>
                        <div className="meta">
                          <span style={{ color: '#e53e3e', fontWeight: 600 }}>LIVE</span>
                          <span>{w.date}</span>
                        </div>
                        {w.youtube_url && (
                          <div className="meta" style={{ marginTop: 6 }}>
                            <a href={w.youtube_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                              Watch live &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.archived.length > 0 && (
              <>
                <h3 style={{ marginBottom: 12 }}>Archived</h3>
                <div className="card-grid">
                  {data.archived.map((w) => (
                    <div key={w.id} className="feature-card">
                      <div className="fc-body">
                        <h3 style={{ fontSize: 15 }}>{w.title}</h3>
                        <div className="meta">
                          <span>{w.date}</span>
                        </div>
                        <div className="meta" style={{ marginTop: 6, gap: 8 }}>
                          {w.youtube_url && (
                            <a href={w.youtube_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                              Watch &rarr;
                            </a>
                          )}
                          {w.source_url && (
                            <a href={w.source_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                              Source &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.live.length === 0 && data.archived.length === 0 && (
              <Empty big="📺" text="No webcasts available at this time." />
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {data.official_page && (
                <a href={data.official_page} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                  Ministry Webcast Page &rarr;
                </a>
              )}
              {data.youtube_channel && (
                <a href={data.youtube_channel} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                  YouTube Channel &rarr;
                </a>
              )}
            </div>
          </>
        ) : (
          <Empty big="📺" text="Webcast data is loading." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
