import { useState } from 'react'
import { useFetch } from '../../api/hooks'
import type { MediaVideo } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

export default function MediaVideos() {
  const [lang, setLang] = useState('')
  const { data: items, loading, error, reload } = useFetch<MediaVideo[]>(`/media/videos${lang ? `?language=${lang}` : ''}`)
  const [playing, setPlaying] = useState<string | null>(null)

  return (
    <>
      <PageHead
        title="Video Gallery"
        sub="Official videos from the Ministry of Culture — cultural films, event coverage and heritage documentation."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Videos' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <select
            className="input"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Filter by language"
          >
            <option value="">All languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
          <span className="muted" style={{ fontSize: 13 }}>{items?.length ?? 0} videos</span>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : items && items.length > 0 ? (
          <div className="card-grid">
            {items.map((v) => (
              <div key={v.id} className="feature-card">
                {playing === v.youtube_id ? (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${v.youtube_id}?autoplay=1`}
                      title={v.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{ display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
                    onClick={() => setPlaying(v.youtube_id)}
                  >
                    <CoverImg src={v.thumbnail_url} alt={v.title} seed={v.title} style={{ height: 200 }} />
                  </button>
                )}
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{v.title}</h3>
                  <div className="meta">
                    {v.source_name && <span>{v.source_name}</span>}
                    <span>{v.duration}</span>
                    <span>{v.language}</span>
                    <span>{v.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty big="🎬" text="Videos will appear here." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
