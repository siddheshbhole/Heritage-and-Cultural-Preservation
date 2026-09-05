import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { Scheme } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Schemes() {
  const { data: items, loading } = useFetch<Scheme[]>('/schemes')
  const [cat, setCat] = useState('All')

  const cats = useMemo(() => [...new Set((items ?? []).map((s) => s.category).filter(Boolean))], [items])
  const filtered = useMemo(() => (cat === 'All' ? (items ?? []) : (items ?? []).filter((s) => s.category === cat)), [items, cat])

  return (
    <>
      <PageHead
        title="Schemes & Programmes"
        sub="Government initiatives that fund, preserve and promote Indian culture, heritage and the arts."
        crumbs={[{ label: 'Schemes' }]}
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
          <Empty big="🧾" text="Scheme data hasn’t been connected yet." />
        ) : (
          <div className="feed">
            {filtered.map((s) => (
              <div className="feed-item" key={s.id}>
                <div className="feed-head">
                  <span className="chip chip-green">{s.category}</span>
                  <span className="muted small">{s.organization}</span>
                  <span className="muted small">{s.year}</span>
                </div>
                <b style={{ fontSize: 16 }}>{s.name}</b>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{s.description}</p>
                <div className="dl" style={{ margin: '12px 0' }}>
                  <dt>Eligibility</dt><dd>{s.eligibility}</dd>
                  <dt>Benefits</dt><dd>{s.benefits}</dd>
                  <dt>How to apply</dt><dd>{s.application_info}</dd>
                </div>
                {s.official_url && <a className="btn btn-sm btn-green" href={s.official_url} target="_blank" rel="noreferrer">Official portal ↗</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}