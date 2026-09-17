import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Crumbs, gradientFor, initials } from '../components/ui'

export function PageHead({ title, sub, crumbs }: { title?: string; sub?: string | null; crumbs?: Array<{ label: string; to?: string }> }) {
  return (
    <div className="page-head container">
      {crumbs && <Crumbs items={crumbs} />}
      {title && <h1 className="page-title">{title}</h1>}
      {sub && <p className="page-sub" style={{ color: 'var(--muted)', marginTop: 8, maxWidth: 760 }}>{sub}</p>}
    </div>
  )
}

export function Band({ label }: { label: string }) {
  return (
    <div className="hero-band" style={{ background: gradientFor(label) }}>
      {initials(label)}
    </div>
  )
}

export function Show({
  what,
  text,
}: {
  what?: string | number | ReadonlyArray<unknown> | null
  text?: string
}) {
  let val = ''
  if (Array.isArray(what)) {
    val = what.filter(Boolean).join('; ')
  } else if (typeof what === 'string') {
    val = what
  } else if (what !== null && what !== undefined) {
    val = String(what)
  }
  if (!val.trim()) return null
  return <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>{text ? `${text}: ${val}` : val}</p>
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="content-block">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function Facts({ rows }: { rows: Array<{ k: string; v: string | number | null | undefined; to?: string }> }) {
  const filled = rows.filter((r) => r.v !== null && r.v !== undefined && String(r.v).trim() !== '')
  if (filled.length === 0) return null
  return (
    <div className="fact-box">
      <h4>Quick Facts</h4>
      {filled.map((r) => (
        <div className="fact-row" key={r.k}>
          <b>{r.k}:</b>{' '}
          {r.to ? <Link to={r.to}>{r.v}</Link> : <>{r.v}</>}
        </div>
      ))}
    </div>
  )
}

export function Provenance({ rows }: { rows?: Record<string, string> }) {
  if (!rows) return null
  const filled = Object.entries(rows).filter(([, v]) => v && v.trim())
  if (filled.length === 0) return null
  return (
    <div className="provenance-box">
      <h4>Provenance & Sources</h4>
      {filled.map(([k, v]) => (
        <div key={k} style={{ marginTop: 6 }}>
          <b style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</b> {v}
        </div>
      ))}
    </div>
  )
}

export function Detail({ children }: { children: ReactNode }) {
  return <div className="container"><div className="detail-grid" style={{ margin: '10px 0 40px' }}>{children}</div></div>
}

export function Main({ children }: { children: ReactNode }) {
  return <main style={{ minWidth: 0 }}>{children}</main>
}

export function Aside({ children }: { children: ReactNode }) {
  return <aside className="aside">{children}</aside>
}