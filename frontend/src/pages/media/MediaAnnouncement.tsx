import { useFetch } from '../../api/hooks'
import type { AnnouncementItem } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton } from '../../components/ui'

export default function MediaAnnouncement() {
  const { data: items, loading, error, reload } = useFetch<AnnouncementItem[]>('/announcements')

  return (
    <>
      <PageHead
        title="Announcements"
        sub="Official announcements, tenders and notices from the Ministry of Culture."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Announcement' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : items && items.length > 0 ? (
          <div className="card-grid">
            {items.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="feature-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{a.title}</h3>
                  <div className="meta">
                    <span>{a.date}</span>
                    {a.source && <span>{a.source}</span>}
                  </div>
                  {a.summary && <p className="desc" style={{ fontSize: 13 }}>{a.summary}</p>}
                  <div className="meta" style={{ marginTop: 4 }}>
                    <span className="btn btn-sm btn-primary">View &rarr;</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <Empty big="📢" text="No announcements available." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
