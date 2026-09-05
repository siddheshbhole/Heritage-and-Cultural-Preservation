import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Museum } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Museums() {
  const { data: items, loading } = useFetch<Museum[]>('/museums')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    let list = items ?? []
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((m) => m.name.toLowerCase().includes(s) || (m.description || '').toLowerCase().includes(s))
    }
    return list
  }, [items, q])

  return (
    <>
      <PageHead
        title="Museums of India"
        sub="Centres of the Museums of India system — preserving art, history, science and living heritage."
        crumbs={[{ label: 'Museums' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 320 }} placeholder="Search museums…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search museums" />
          <span className="muted" style={{ fontSize: 13 }}>{filtered.length} museums</span>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="🖼️" text="Museum data hasn’t been connected yet." />
        ) : (
          <div className="card-grid">
            {filtered.map((m) => (
              <Link key={m.id} to={`/museums/${m.id}`} className="feature-card">
                <div className="card-thumb" style={{ background: '#0e5729' }}>{m.name.slice(0, 1)}</div>
                <div className="fc-body">
                  <h3>{m.name}</h3>
                  <p className="desc">{m.description}</p>
                  <div className="meta">
                    {m.location && <span>{m.location}</span>}
                    {m.official_url && <a href={m.official_url} target="_blank" rel="noreferrer">Official site ↗</a>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}