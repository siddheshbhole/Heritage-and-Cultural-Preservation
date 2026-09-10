import { useMemo, useState } from 'react'
import { useFetch } from '../../api/hooks'
import type { MediaEventsResponse } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

export default function MediaEvents() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [state, setState] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [archive, setArchive] = useState<number | undefined>(undefined)

  const params: Record<string, string | number | undefined> = {}
  if (q) params.q = q
  if (category) params.category = category
  if (state) params.state = state
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  if (archive !== undefined) params.archive = archive

  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  const path = `/media/events${qs ? `?${qs}` : ''}`

  const { data, loading, error, reload } = useFetch<MediaEventsResponse>(path)

  const hasFilters = q || category || state || startDate || endDate || archive !== undefined

  function clearFilters() {
    setQ('')
    setCategory('')
    setState('')
    setStartDate('')
    setEndDate('')
    setArchive(undefined)
  }

  return (
    <>
      <PageHead
        title="Events"
        sub="Cultural events, seminars and celebrations from the Ministry of Culture."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Events' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ flexWrap: 'wrap', gap: 8 }}>
          <input
            className="input"
            style={{ maxWidth: 240 }}
            placeholder="Search events..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search events"
          />
          {data?.categories && (
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {data?.states && (
            <select className="input" value={state} onChange={(e) => setState(e.target.value)} aria-label="State">
              <option value="">All states</option>
              {data.states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" />
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date" />
          <select className="input" value={archive ?? ''} onChange={(e) => setArchive(e.target.value === '' ? undefined : Number(e.target.value))} aria-label="Archive filter">
            <option value="">All events</option>
            <option value="0">Current</option>
            <option value="1">Archive</option>
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-sm btn-outline" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              {data.items.length} events &middot; {data.days.current} current, {data.days.past} archived
            </div>
            <div className="card-grid">
              {data.items.map((ev) => (
                <div key={ev.id} className="feature-card">
                  <CoverImg src={ev.image_url} alt={ev.title} seed={ev.title} style={{ height: 180 }} />
                  <div className="fc-body">
                    <h3 style={{ fontSize: 15 }}>{ev.title}</h3>
                    <div className="meta" style={{ flexWrap: 'wrap', gap: 4 }}>
                      <span>{ev.category}</span>
                      <span>{ev.start_date} – {ev.end_date}</span>
                      {ev.city && <span>{ev.city}, {ev.state}</span>}
                      {ev.is_archive && <span style={{ color: 'var(--muted)' }}>Archived</span>}
                    </div>
                    {ev.venue && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>{ev.venue}</p>}
                    {ev.official_url && (
                      <div className="meta" style={{ marginTop: 6 }}>
                        <a href={ev.official_url} target="_blank" rel="noreferrer">View on Ministry site &rarr;</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty big="📅" text="No events match your filters." error={error} onRetry={reload} />
        )}
      </div>
    </>
  )
}
