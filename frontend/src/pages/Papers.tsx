import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { Document } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Papers() {
  const { data: items, loading, error, reload } = useFetch<Document[]>('/documents')
  const [q, setQ] = useState('')

  const types = useMemo(() => [...new Set((items ?? []).map((d) => d.doc_type).filter(Boolean))], [items])
  const [t, setT] = useState('All')

  const filtered = useMemo(() => {
    let list = items ?? []
    if (t !== 'All') list = list.filter((d) => d.doc_type === t)
    if (q.trim()) list = list.filter((d) => d.title.toLowerCase().includes(q.trim().toLowerCase()))
    return list
  }, [items, t, q])

  return (
    <>
      <PageHead
        title="Archival Documents"
        sub="Digitised records, treaties, manuscripts and official papers in the public domain."
        crumbs={[{ label: 'Documents' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
          <select className="filter-select" value={t} onChange={(e) => setT(e.target.value)} aria-label="Filter type">
            <option>All</option>
            {types.map((x) => <option key={x}>{x}</option>)}
          </select>
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
                  <span className="chip chip-green">{d.doc_type}</span>
                  <span className="muted small">{d.organization}</span>
                  <span className="muted small">{d.year}</span>
                </div>
                <b>{d.title}</b>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{d.description}</p>
                <div className="feed-actions">
                  {d.source_url && <a href={d.source_url} target="_blank" rel="noreferrer">Source ↗</a>}
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer">Full text 📄</a>}
                  <span className="trust trust-official">{d.rights_status || 'PUBLIC DOMAIN'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}