import { useCallback, useEffect, useRef, useState } from 'react'
import type { CultureApp } from '../api/client'
import { gradientFor } from './ui'

export default function Carousel({ items }: { items: CultureApp[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const next = useCallback(() => {
    if (items.length > 1) setIndex((i) => (i + 1) % items.length)
  }, [items.length])

  useEffect(() => {
    if (paused) return
    timer.current = window.setInterval(next, 5000)
    return () => window.clearInterval(timer.current)
  }, [next, paused])

  if (items.length === 0) return null
  const it = items[index]

  const body = (
    <>
      <div className="card-thumb" style={{ background: gradientFor(it.title), height: '100%', minHeight: 130, borderRadius: 10 }}>
        <span>{initials(it.title)}</span>
      </div>
      <div style={{ textAlign: 'left' }}>
        <span className="chip">{it.category}</span>
        <h3>{it.title}</h3>
        <p className="desc">{it.description}</p>
        <span className="btn btn-sm btn-primary" style={{ marginTop: 6 }}>{it.action} →</span>
      </div>
    </>
  )

  return (
    <div
      className="card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {it.official_url ? (
        <a
          href={it.official_url}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 240px) 1fr', gap: 18, alignItems: 'stretch', color: 'inherit' }}
        >
          {body}
        </a>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 240px) 1fr', gap: 18, alignItems: 'stretch' }}>
          {body}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              border: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              cursor: 'pointer',
              padding: 0,
              background: i === index ? 'var(--orange)' : 'var(--line)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function initials(s: string) {
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}