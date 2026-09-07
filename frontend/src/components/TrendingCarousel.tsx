import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TrendingItem } from '../api/client'
import { Skeleton } from './ui'

interface Props {
  items: TrendingItem[]
  loading?: boolean
  error?: string | null
}

const AUTOPLAY_MS = 6000
const TRANSITION_MS = 600

export default function TrendingCarousel({ items, loading = false, error = null }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const touchX = useRef<number | null>(null)
  const touchY = useRef<number | null>(null)
  const resumeTimer = useRef<number | undefined>(undefined)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const count = items.length

  const goTo = useCallback((i: number) => {
    if (count === 0) return
    setIndex(((i % count) + count) % count)
  }, [count])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  const pause = useCallback((resumeAfter = 0) => {
    setPaused(true)
    window.clearTimeout(resumeTimer.current)
    if (resumeAfter > 0) {
      resumeTimer.current = window.setTimeout(() => {
        setPaused(false)
      }, resumeAfter)
    }
  }, [])

  const resume = useCallback(() => {
    setPaused(false)
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || paused || count <= 1) return
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer.current)
  }, [paused, count])

  useEffect(() => {
    const el = stageRef.current
    if (!el || count <= 1) return
    const io = new IntersectionObserver(
      ([entry]) => setPaused(() => !entry.isIntersecting),
      { rootMargin: '140px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [count])

  useEffect(() => () => {
    window.clearTimeout(resumeTimer.current)
  }, [])

  if (loading) {
    return (
      <div className="trending" aria-busy="true" aria-label="Loading heritage highlights">
        <Skeleton style={{ height: 560 }} />
        <Skeleton style={{ height: 90, marginTop: 12 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="trending" role="status">
        <p className="trending-fallback">Heritage highlights are temporarily unavailable.</p>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="trending" role="status">
        <p className="trending-fallback">Heritage highlights are temporarily unavailable.</p>
      </div>
    )
  }

  const it = items[index]
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="trending">
      <div
        ref={stageRef}
        className="trending-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Heritage and trending highlights"
        tabIndex={0}
        onMouseEnter={() => pause(0)}
        onMouseLeave={resume}
        onFocus={() => pause(0)}
        onBlur={resume}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { next(); pause(9000) }
          if (e.key === 'ArrowLeft') { prev(); pause(9000) }
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
          touchY.current = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null || touchY.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          const dy = e.changedTouches[0].clientY - touchY.current
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { prev(); pause(9000) }
            else { next(); pause(9000) }
          }
          touchX.current = null
          touchY.current = null
        }}
      >
        <div className="trending-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {items.map((item) => (
            <figure className="trending-slide" key={item.id}>
              <a
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
                className="trending-img-wrap"
                aria-label={`${item.title} — open authoritative external information`}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  loading={item.id === items[0]?.id ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ objectPosition: item.image_position || 'center' }}
                  onError={(e) => {
                    const img = e.currentTarget
                    img.onerror = null
                    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640"><rect width="100%" height="100%" fill="#e8e4dc"/><text x="50%" y="50%" fill="#5b6472" font-family="sans-serif" font-size="28" text-anchor="middle">${item.title}</text></svg>`
                    )}`
                  }}
                />
                <span className="trending-open" aria-hidden="true">View official source ↗</span>
              </a>
            </figure>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" className="trending-arrow trending-prev" aria-label="Previous highlight" onClick={() => { prev(); pause(9000) }}>
              ‹
            </button>
            <button type="button" className="trending-arrow trending-next" aria-label="Next highlight" onClick={() => { next(); pause(9000) }}>
              ›
            </button>
            <div className="trending-counter" aria-hidden="true">
              {pad(index + 1)} / {pad(count)}
            </div>
          </>
        )}
      </div>

      <div className="trending-body">
        <span className={`chip ${it.kind === 'culture' ? 'chip-green' : ''}`}>{it.category}</span>
        <h3 className="trending-title">{it.title}</h3>
        {it.state && (
          <p className="trending-loc" style={{ color: 'var(--muted)' }}>
            {it.city ? `${it.city} · ` : ''}{it.state}
          </p>
        )}
        <p className="trending-summary">{it.summary}</p>
        <div className="trending-actions">
          <Link to={it.explore_url} className="btn btn-sm btn-primary">Know More →</Link>
          {it.source_name && (
            <a href={it.source_url ?? it.external_url} target="_blank" rel="noreferrer" className="car-src">
              {it.source_name}
            </a>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="trending-dots" role="group" aria-label="Choose highlight">
          {items.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-label={`Go to highlight ${i + 1} of ${count}${i === index ? ' (current)' : ''}`}
              aria-current={i === index}
              className={`trending-dot${i === index ? ' active' : ''}`}
              onClick={() => { goTo(i); pause(9000) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}