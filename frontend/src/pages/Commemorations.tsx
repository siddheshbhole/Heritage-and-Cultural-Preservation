import { useMemo, useState } from 'react'
import { useFetch } from '../api/hooks'
import type { Commemoration } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Commemorations() {
  const { data: items, loading } = useFetch<Commemoration[]>('/commemorations')
  const [field, setField] = useState('All')

  const fields = useMemo(() => [...new Set((items ?? []).map((c) => c.field).filter(Boolean))], [items])
  const filtered = useMemo(() => (field === 'All' ? (items ?? []) : (items ?? []).filter((c) => c.field === field)), [items, field])

  return (
    <>
      <PageHead
        title="Commemorations"
        sub="Anniversaries, jubilees and national celebrations honouring the people and moments that define Bharat."
        crumbs={[{ label: 'Commemorations' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <button className={`filter-pill${field === 'All' ? ' active' : ''}`} onClick={() => setField('All')}>All</button>
          {fields.map((f) => (
            <button key={f} className={`filter-pill${field === f ? ' active' : ''}`} onClick={() => setField(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <Skeleton style={{ height: 320 }} />
        ) : filtered.length === 0 ? (
          <Empty big="🏅" text="Commemoration data hasn’t been connected yet." />
        ) : (
          <div className="timeline">
            {filtered.map((c) => (
              <div className="tl-item" key={c.id}>
                <b>{c.name}</b>
                <span className="chip chip-green">{c.field}</span> <span className="muted">{c.period}</span>
                <p className="desc" style={{ marginTop: 6 }}>{c.contribution}</p>
                {c.locations && <p className="muted small">📍 {c.locations}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}