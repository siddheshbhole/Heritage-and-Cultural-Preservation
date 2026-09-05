import { Link } from 'react-router-dom'
import type { Announcement } from '../api/client'
import { useFetch } from '../api/hooks'

export default function Ticker() {
  const { data, loading } = useFetch<Announcement[]>('/announcements')
  if (loading || !data || data.length === 0) return null
  const doubled = [...data, ...data]
  return (
    <div className="ticker" aria-label="Latest announcements">
      <div className="ticker-track">
        {doubled.map((a, i) => (
          <span key={i} className="ticker-item">
            <span aria-hidden>◆</span>
            <b>{a.date}</b> <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
          </span>
        ))}
      </div>
    </div>
  )
}