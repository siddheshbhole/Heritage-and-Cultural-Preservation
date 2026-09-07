import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { State } from '../api/client'
import IndiaMap from '../components/IndiaMap'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Explore() {
  const { data: states, loading } = useFetch<State[]>('/states')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!states) return []
    const q = query.trim().toLowerCase()
    if (!q) return states
    return states.filter((s) => s.name.toLowerCase().includes(q) || (s.region || '').toLowerCase().includes(q))
  }, [states, query])

  return (
    <>
      <PageHead
        title="Explore Bharat"
        sub="A visual window into 28 states and 8 union territories — their heritage, cities, museums and living culture."
        crumbs={[{ label: 'Explore' }]}
      />

      <div className="container" style={{ marginBottom: 34 }}>
        <div className="map-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <label className="kicker" style={{ margin: 0, flex: '1 1 100%' }}>Map Explorer</label>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search by state or region…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter states"
          />
          <Link to="/states" className="btn btn-sm btn-green">List view</Link>
        </div>

        {loading ? (
          <Skeleton style={{ height: 520, maxWidth: 620, margin: '0 auto' }} />
        ) : states && states.length > 0 ? (
          <IndiaMap states={states} onSelect={(s) => navigate(`/states/${s.id}`)} />
        ) : (
          <Empty big="🗺️" text="The state dataset hasn’t been connected yet." />
        )}

        {!loading && filtered.length > 0 && (
          <div className="card-grid tight" style={{ marginTop: 28 }}>
            {filtered.map((s) => (
              <Link key={s.id} to={`/states/${s.id}`} className="feature-card">
                <div className="fc-body">
                  <div className="meta">
                    <span className="chip chip-green">{s.region || 'State'}</span>
                  </div>
                  <h3>{s.name}</h3>
                  <p className="desc">{s.capital || ''} {s.heritage_count ? `· ${s.heritage_count} heritage sites` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}