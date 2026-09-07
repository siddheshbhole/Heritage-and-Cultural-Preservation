import type { Announcement } from '../api/client'
import { useFetch } from '../api/hooks'

export default function Ticker({ items }: { items?: Announcement[] }) {
  const { data, loading } = useFetch<Announcement[]>(items ? null : '/announcements')
  const list = items ?? data
  if (loading || !list || list.length === 0) return null
  const doubled = [...list, ...list]
  return (
    <div className="ticker" aria-label="Latest announcements">
      <div className="ticker-track">
        {doubled.map((a, i) => (
          <span key={`${i}-${a.id}`} className="ticker-item">
            <span aria-hidden>◆</span>
            <b>{a.date}</b> <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
          </span>
        ))}
      </div>
    </div>
  )
}