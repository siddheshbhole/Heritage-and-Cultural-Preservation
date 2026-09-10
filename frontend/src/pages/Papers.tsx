import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { DocumentItem, PaginatedList } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import { DOCUMENT_ICONS, formatDate } from './documents/DocumentsHome'

export default function Papers() {
  const { data, loading, error, reload } = useFetch<PaginatedList<DocumentItem>>('/documents?per_page=500')
  const [q, setQ] = useState('')

  const items = data?.items ?? []

  const filtered = useMemo(() => {
    let list = items
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) ||
          d.category.toLowerCase().includes(needle)
      )
    }
    return list
  }, [items, q])

  return (
    <>
      <PageHead
        title="Archival Documents"
        sub="Digitised records, treaties, manuscripts and official papers of the Ministry of Culture in the public domain."
        crumbs={[{ label: 'Documents', to: '/documents' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="📜" text="Document data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="feed">
            {filtered.map((d) => (
              <div className="feed-item" key={d.id}>
                <div className="feed-head">
                  <span className="chip">{DOCUMENT_ICONS[d.category] || '📄'} {d.category}</span>
                  <span className="muted small">{formatDate(d.published_date)}</span>
                </div>
                <b>{d.title}</b>
                <div className="feed-actions">
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer">Full text 📄</a>}
                  <span className="trust trust-official">PUBLIC DOMAIN</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}