import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { Commemoration, Personality } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'

function asPersonality(c: Commemoration): Personality {
  return {
    id: c.id,
    name: c.name,
    period: c.period,
    field: c.field,
    biography: c.contribution || c.significance,
    achievements: c.contribution,
    legacy: c.significance,
    locations: c.locations,
    image_url: null,
  }
}

export default function Greats() {
  const { data: items, loading } = useFetch<Commemoration[]>('/commemorations')
  const [q, setQ] = useState('')

  const people = useMemo(() => (items ?? []).map(asPersonality), [items])
  const fields = useMemo(() => [...new Set(people.map((p) => p.field).filter(Boolean))], [people])
  const [field, setField] = useState<string>('All')

  const filtered = useMemo(() => {
    let list = people
    if (field !== 'All') list = list.filter((p) => p.field === field)
    if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    return list
  }, [people, field, q])

  return (
    <>
      <PageHead
        title="Eminent Personalities"
        sub="Freedom fighters, rulers, artists and thinkers who shaped Bharat and its civilisation."
        crumbs={[{ label: 'Personalities' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input className="input" style={{ maxWidth: 260 }} placeholder="Search names…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search personalities" />
          <select className="filter-select" value={field} onChange={(e) => setField(e.target.value)} aria-label="Filter field">
            <option>All</option>
            {fields.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : filtered.length === 0 ? (
          <Empty big="🪔" text="Personality data hasn’t been connected yet." />
        ) : (
          <div className="card-grid">
            {filtered.map((p) => (
              <div className="card" key={p.id}>
                <div className="thumb-x" style={{ background: gradientFor(p.name), minHeight: 84 }}>
                  {p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
                </div>
                <span className="chip chip-green">{p.field}</span>
                <h3>{p.name}</h3>
                <p className="desc">{p.biography}</p>
                <div className="meta"><span>{p.period}</span>{p.locations && <span>{p.locations}</span>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}