import { Link } from 'react-router-dom'
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
  big?: string
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