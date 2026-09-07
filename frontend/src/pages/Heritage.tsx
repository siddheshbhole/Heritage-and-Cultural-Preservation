import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'

const CATEGORIES = ['Temple', 'Fort', 'Monument', 'Archaeological', 'Palace', 'Cave Temple', 'World Heritage', 'Natural']

export default function Heritage() {
  const { data: items, loading, error, reload } = useFetch<Heritage[]>('/heritage')
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')

  const cats = useMemo(() => [...new Set((items ?? []).map((h) => h.category).filter(Boolean))], [items])

  const filtered = useMemo(() => {
    let list = items ?? []
    if (cat !== 'All') list = list.filter((h) => (h.category || '') === cat)
    if (q.trim()) list = list.filter((h) => h.name.toLowerCase().includes(q.trim().toLowerCase()) || (h.state_name || '').toLowerCase().includes(q.trim().toLowerCase()))
    return list
  }, [items, cat, q])

  return (
    <>
      <PageHead
        title="Heritage Sites"
        sub="Museums of India, UNESCO sites, forts, temples and monuments that tell the story of Bharat."
        crumbs={[{ label: 'Heritage' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search sites…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search heritage sites" />
          {(cats.length ? cats : CATEGORIES).map((c) => (
            <button key={c} className={`filter-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="🏛️" text="Heritage data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid wide">
            {filtered.map((h) => (
              <Link key={h.id} to={`/heritage/${h.id}`} className="feature-card">
                <div className="card-thumb" style={{ background: gradientFor(h.name) }}>{h.name.split(/\s+/)[0]?.[0]}</div>
                <div className="fc-body">
                  <div className="meta"><span className="chip chip-green">{h.category}</span>{h.featured && <span className="chip">Featured</span>}</div>
                  <h3>{h.name}</h3>
                  <p className="desc">{h.description || h.significance}</p>
                  <div className="meta">
                    <span>{h.state_name || ''}{h.city_name ? ` · ${h.city_name}` : ''}</span>
                    {h.historical_period && <span>{h.historical_period}</span>}
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