import { useMemo, useState } from 'react'
import { useFetch } from '../../api/hooks'
import type { MediaNewsItem } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton } from '../../components/ui'

export default function MediaNews() {
  const { data: items, loading, error, reload } = useFetch<MediaNewsItem[]>('/media/news')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    let list = items ?? []
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((n) => n.title.toLowerCase().includes(s))
    }
    return list
  }, [items, q])

  return (
    <>
      <PageHead
        title="Latest News"
        sub="Press releases and news from the Ministry of Culture, Government of India."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Latest News' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search news..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search news"
          />
          <span className="muted" style={{ fontSize: 13 }}>{filtered.length} articles</span>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length > 0 ? (
          <div className="card-grid">
            {filtered.map((n) => (
              <a
                key={n.id}
                href={n.source_url}
                target="_blank"
                rel="noreferrer"
                className="feature-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {n.image_url && (
                  <div style={{ background: '#111', borderRadius: '12px 12px 0 0', overflow: 'hidden', height: 180 }}>
                    <img
                      src={n.image_url}
                      alt={n.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{n.title}</h3>
                  <div className="meta">
                    <span>{n.date}</span>
                    <span>Ministry of Culture</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <Empty big="📰" text="News articles will appear here." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
