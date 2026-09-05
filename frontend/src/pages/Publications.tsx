import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { Publication } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Publications() {
  const { data: items, loading } = useFetch<Publication[]>('/publications')
  const [q, setQ] = useState('')

  const subjects = useMemo(() => [...new Set((items ?? []).map((p) => p.subject).filter(Boolean))], [items])
  const [subject, setSubject] = useState('All')

  const filtered = useMemo(() => {
    let list = items ?? []
    if (subject !== 'All') list = list.filter((p) => p.subject === subject)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(s) || (p.author_name || '').toLowerCase().includes(s))
    }
    return list
  }, [items, subject, q])

  return (
    <>
      <PageHead
        title="Publications"
        sub="Books, journals and scholarly works that document India’s cultural landscape."
        crumbs={[{ label: 'Publications' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search titles or authors…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search publications" />
          <select className="filter-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Filter subject">
            <option>All</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="📚" text="Publication data hasn’t been connected yet." />
        ) : (
          <div className="card-grid">
            {filtered.map((p) => (
              <div className="card" key={p.id}>
                <h3>{p.title}</h3>
                <p className="desc">{p.description}</p>
                <div className="meta">
                  <span>{p.author_name || '—'}</span>
                  <span>{p.publisher}</span>
                  <span>{p.year}</span>
                </div>
                {(p.digital_url || p.catalogue_url) && (
                  <div className="hero-strip" style={{ marginTop: 8 }}>
                    {p.digital_url && <a className="btn btn-sm btn-outline" href={p.digital_url} target="_blank" rel="noreferrer">Read ↗</a>}
                    {p.catalogue_url && <a className="btn btn-sm btn-ghost" href={p.catalogue_url} target="_blank" rel="noreferrer">Catalogue</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}