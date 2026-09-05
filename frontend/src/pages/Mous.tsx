import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { MoU } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Mous() {
  const { data: items, loading } = useFetch<MoU[]>('/mous')
  const [cat, setCat] = useState('All')

  const cats = useMemo(() => [...new Set((items ?? []).map((m) => m.category).filter(Boolean))], [items])
  const filtered = useMemo(() => (cat === 'All' ? (items ?? []) : (items ?? []).filter((m) => m.category === cat)), [items, cat])

  return (
    <>
      <PageHead
        title="MoUs & Partnerships"
        sub="Institutional collaborations that exchange, preserve and share cultural heritage across borders."
        crumbs={[{ label: 'MoUs' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <button className={`filter-pill${cat === 'All' ? ' active' : ''}`} onClick={() => setCat('All')}>All</button>
          {cats.map((c) => (
            <button key={c} className={`filter-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <Empty big="🤝" text="MoU data hasn’t been connected yet." />
        ) : (
          <div className="feed">
            {filtered.map((m) => (
              <div className="feed-item" key={m.id}>
                <div className="feed-head">
                  <span className="chip chip-green">{m.category || 'Partnership'}</span>
                  <span className="muted small">{m.date}</span>
                  <span className="muted small">{m.institution}</span>
                </div>
                <b style={{ fontSize: 16 }}>{m.title}</b>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{m.description}</p>
                <div className="feed-actions">
                  <span className="muted">Parties: {m.parties}</span>
                  {m.document_url && <a href={m.document_url} target="_blank" rel="noreferrer">Document 📄</a>}
                  {m.source_url && <a href={m.source_url} target="_blank" rel="noreferrer">Source ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}