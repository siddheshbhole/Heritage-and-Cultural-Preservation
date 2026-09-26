import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'

export function hashSeed(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function gradientFor(seed: string) {
  const palettes = [
    ['#e8630a', '#c34f06'],
    ['#167a3b', '#0e5729'],
    ['#e8630a', '#8a3a05'],
    ['#c34f06', '#0e5729'],
  ]
  const p = palettes[hashSeed(seed) % palettes.length]
  return `linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 100%)`
}

export function initials(s: string) {
  const parts = s.trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w))
  if (parts.length === 0) return s.slice(0, 2).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Section({
  kicker,
  title,
  children,
  action,
  alt,
}: {
  kicker?: string
  title: string
  children: ReactNode
  action?: ReactNode
  alt?: 'alt' | 'altgreen'
}) {
  return (
    <section className={`section${alt ? ` ${alt}` : ''}`}>
      <div className="container">
        <div className="section-head">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            <h2 className="section-title">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  )
}

export function TrustBadge({ level }: { level?: string }) {
  if (!level) return null
  const cls =
    level.toLowerCase().includes('official')
      ? 'trust-official'
      : level.toLowerCase().includes('verified')
        ? 'trust-verified'
        : level.toLowerCase().includes('community')
          ? 'trust-community'
          : 'trust-ai'
  return <span className={`trust ${cls}`}>{level.toUpperCase()}</span>
}

/* ---------- Icons ----------
   Lightweight inline SVG so the navbar can use real icon components
   without pulling in an icon-library dependency. All icons inherit
   `currentColor` and are hidden from assistive technology. */
type IconProps = { size?: number; className?: string; strokeWidth?: number }

function iconBase(size: number, className?: string) {
  return {
    className,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  }
}

export function IconSearch({ size = 17, className, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.2 20.2-3.9-3.9" />
    </svg>
  )
}

export function IconChevronDown({ size = 12, className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <path d="m5.5 8.75 6.5 6.5 6.5-6.5" />
    </svg>
  )
}

export function IconGlobe({ size = 15, className, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" />
    </svg>
  )
}

export function IconMenu({ size = 19, className, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <path d="M3.75 6.5h16.5" />
      <path d="M3.75 12h16.5" />
      <path d="M3.75 17.5h16.5" />
    </svg>
  )
}

export function IconClose({ size = 17, className, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

export function IconUser({ size = 15, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...iconBase(size, className)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="8.25" r="3.75" />
      <path d="M4.75 20c0-3.6 3.25-5.75 7.25-5.75s7.25 2.15 7.25 5.75" />
    </svg>
  )
}

export function Crumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((it, i) => (
        <span key={i}>
          <span className="sep">/</span>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function Empty({
  big = '🌿',
  text = 'Nothing here yet.',
  error,
  onRetry,
}: {
  /** Decorative glyph. Accepts a ReactNode so admin surfaces can pass an SVG icon. */
  big?: ReactNode
  text?: string
  error?: string | null
  onRetry?: () => void
}) {
  return (
    <div className="empty">
      <div className="big">{big}</div>
      <div>{text}</div>
      {error && (
        <>
          <p className="empty-error">Not loading: {error}</p>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline empty-retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height: 180, ...style }} />
}

export function CardGrid({ children, tight }: { children: ReactNode; tight?: boolean }) {
  return <div className={`card-grid${tight ? ' tight' : ''}`}>{children}</div>
}

export function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

export function CoverImg({
  src,
  alt,
  seed,
  style,
}: {
  src?: string | null
  alt: string
  seed: string
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div
        className="cover-fallback"
        style={{ background: gradientFor(seed), ...style }}
        aria-label={alt}
        role="img"
      >
        <span>{initials(seed)}</span>
      </div>
    )
  }
  return (
    <img
      className="cover-img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
    />
  )
}