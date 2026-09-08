import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { State } from '../api/client'
import { PageHead } from './_shared'
import { gradientFor, initials, Empty, Skeleton } from '../components/ui'

export default function States() {
  const { data: states, loading } = useFetch<State[]>('/states')
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('')

  const regions = useMemo(() => [...new Set((states ?? []).map((s) => s.region).filter(Boolean))], [states])

  const filtered = useMemo(() => {
    let list = states ?? []
    if (q.trim()) list = list.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
    if (region) list = list.filter((s) => s.region === region)
    return list
  }, [states, q, region])

  return (
    <>
      <PageHead
        title="States of India"
        sub="From the Himalayas to the Indian Ocean — dive into each region’s history, culture, heritage and living traditions."
        crumbs={[{ label: 'States' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 300 }} placeholder="Search states…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search states" />
          <select className="filter-select" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: 13 }}>{filtered.length} states</span>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="🏛️" text="No states match your filters." />
        ) : (
          <div className="card-grid">
            {filtered.map((s) => (
              <Link key={s.id} to={`/states/${s.id}`} className="feature-card">
                <div className="card-thumb" style={{ background: gradientFor(s.name) }}>{initials(s.name)}</div>
                <div className="fc-body">
                  <span className="chip chip-green">{s.region || 'State'}</span>
                  <h3>{s.name}</h3>
                  <p className="desc">
                    {s.capital && `Capital: ${s.capital}`}
                    {s.heritage_count ? ` · ${s.heritage_count} heritage sites` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}