import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShowcaseItem } from '../api/client'
import { gradientFor, initials } from './ui'

interface Props {
  items: ShowcaseItem[]
  variant?: 'split' | 'hero'
  interval?: number
}

export default function Carousel({ items, variant = 'split', interval = 5500 }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const touchX = useRef<number | null>(null)
  const count = items.length

  const next = useCallback(() => {
    if (count > 1) setIndex((i) => (i + 1) % count)
  }, [count])

  const prev = useCallback(() => {
    if (count > 1) setIndex((i) => (i - 1 + count) % count)
  }, [count])

  useEffect(() => {
    if (paused || count <= 1) return
    timer.current = window.setInterval(next, interval)
    return () => window.clearInterval(timer.current)
  }, [next, paused, interval, count])

  if (count === 0) return null
  const hero = variant === 'hero'
  const it = items[index]

  const media = it.image_url ? (
    <img className="car-img" src={it.image_url} alt={it.title} loading="lazy" />
  ) : (
    <div className={hero ? 'car-tile' : 'card-thumb'} style={{ background: gradientFor(it.title) }}>
      <span>{initials(it.title)}</span>
    </div>
  )

  return (
    <div
      className={`carousel${hero ? ' carousel-hero' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={hero ? 'Government cultural showcase' : 'Culture showcase'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 40) prev()
        else if (dx < -40) next()
        touchX.current = null
      }}
    >
      {hero ? (
        <div key={it.id} className="car-campaign-slide">
          <div className="car-campaign-art" style={it.bgColor ? { background: it.bgColor } : undefined}>
            {it.image_url ? (
              <img
                className="car-campaign-img"
                style={{
                  objectFit: it.imageFit ?? 'contain',
                  objectPosition: it.imagePosition ?? 'center',
                }}
                src={it.image_url}
                alt={it.title}
                loading="lazy"
              />
            ) : (
              <div className="car-tile" style={{ background: gradientFor(it.title) }}>
                <span>{initials(it.title)}</span>
              </div>
            )}
          </div>
          <div className="car-campaign-info">
            <h3 className="car-title">
              <a href={it.official_url} target="_blank" rel="noreferrer">{it.title}</a>
            </h3>
            <p className="desc">{it.description}</p>
            <div className="car-campaign-actions">
              <a href={it.official_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                Know More →
              </a>
              {it.playStoreUrl && (
                <a href={it.playStoreUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-store">
                  Google Play
                </a>
              )}
              {it.appStoreUrl && (
                <a href={it.appStoreUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-store">
                  App Store
                </a>
              )}
            </div>
            {it.qrUrl && (
              <div className="car-campaign-qr">
                <img src={it.qrUrl} alt={`QR code to ${it.title}`} />
                <span>{it.qrLabel ?? 'Scan to Visit'}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div key={it.id} className="car-slide-split">
          <div className="car-media">{media}</div>
          <div className="car-copy">
            <div className="car-meta">
              <span className="chip">{it.category}</span>
              {it.source_label && <span className="muted">{it.source_label}</span>}
            </div>
            <h3 className="car-title">
              <a href={it.official_url} target="_blank" rel="noreferrer">{it.title}</a>
            </h3>
            <p className="desc">{it.description}</p>
            <div className="car-actions">
              <a href={it.official_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                {it.action} →
              </a>
              {it.source_url && (
                <a href={it.source_url} target="_blank" rel="noreferrer" className="car-src">
                  Official source
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {count > 1 && (
        <div className="car-controls">
          <button type="button" className="car-btn" aria-label="Previous slide" onClick={prev}>‹</button>
          <div className="car-dots" role="group" aria-label="Choose slide">
            {items.map((x, i) => (
              <button
                key={x.id}
                type="button"
                aria-label={`Go to slide ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`car-dot${i === index ? ' active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button type="button" className="car-btn" aria-label="Next slide" onClick={next}>›</button>
          <button
            type="button"
            className="car-btn car-pause"
            aria-label={paused ? 'Play carousel' : 'Pause carousel'}
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? '▶' : '❚❚'}
          </button>
        </div>
      )}
    </div>
  )
}