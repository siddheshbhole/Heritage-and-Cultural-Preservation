import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import ExploreNav, { EXPLORE_ROUTE_RE } from './ExploreNav'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/heritage', label: 'Heritage', end: false },
  { to: '/culture', label: 'Culture', end: false },
  { to: '/papers', label: 'Documents', end: false },
]

const DESKTOP_BREAKPOINT = 960

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [mq, setMq] = useState('')
  const [open, setOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const closeTimer = useRef<number | null>(null)
  const isDesktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

  const onExploreRoute = EXPLORE_ROUTE_RE.test(location.pathname)

  const closeExplore = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setExploreOpen(false)
    setExpanded(false)
  }

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setExploreOpen(false), 180)
  }

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  useEffect(() => {
    setOpen(false)
    closeExplore()
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!exploreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeExplore()
        const el = headerRef.current?.querySelector<HTMLAnchorElement>('[data-explore-link]')
        el?.focus()
      }
    }
    const onClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        closeExplore()
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [exploreOpen])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      setQ('')
      navigate('/search?q=' + encodeURIComponent(q.trim()))
    }
  }

  const submitMobile = (e: React.FormEvent) => {
    e.preventDefault()
    if (mq.trim()) {
      setMq('')
      setOpen(false)
      navigate('/search?q=' + encodeURIComponent(mq.trim()))
    }
  }

  const handleExploreClick = (e: React.MouseEvent) => {
    if (isDesktop && !exploreOpen) {
      e.preventDefault()
      setExploreOpen(true)
    } else if (isDesktop && exploreOpen) {
      closeExplore()
    }
  }

  const renderSubnav = (onNavigate?: () => void) => <ExploreNav onNavigate={onNavigate} />

  return (
    <header className="navbar" ref={headerRef}>
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Sanskriti Setu — Home">
          <img
            className="brand-logo"
            src="/images/branding/sanskriti-setu-logo.png"
            alt="Sanskriti Setu"
            width={216}
            height={54}
          />
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => {
            if (l.to === '/explore') {
              return (
                <div
                  className={`nav-item-wrap${onExploreRoute ? ' has-active' : ''}${exploreOpen ? ' open' : ''}`}
                  key={l.to}
                  onMouseEnter={() => isDesktop && (cancelClose(), setExploreOpen(true))}
                  onMouseLeave={() => isDesktop && scheduleClose()}
                >
                  <NavLink
                    to={l.to}
                    end={l.end}
                    data-explore-link
                    aria-haspopup="true"
                    aria-expanded={exploreOpen}
                    aria-controls="explore-subnav"
                    onClick={handleExploreClick}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setExploreOpen(true)
                      } else if (e.key === 'Enter' || e.key === ' ') {
                        setExploreOpen(false)
                      }
                    }}
                  >
                    {l.label} <span className="caret" aria-hidden>▾</span>
                  </NavLink>
                </div>
              )
            }
            return (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            )
          })}
        </nav>

        <form className="nav-search" onSubmit={submit} role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search culture…"
            aria-label="Search"
          />
          <button>Search</button>
        </form>

        <div className="nav-actions">
          <select className="langs" aria-label="Language" defaultValue="en">
            <option value="en">EN</option>
            <option value="hi">हिं</option>
          </select>
          <Link to="/assistant" className="btn btn-sm btn-primary nav-ai">Ask Culture AI</Link>
          <button
            className="hamburger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Desktop Explore sub-navigation */}
      <div
        id="explore-subnav"
        className="explore-subnav"
        aria-label="Explore sub-navigation"
        style={{ display: exploreOpen ? 'block' : 'none' }}
        onMouseEnter={() => isDesktop && cancelClose()}
        onMouseLeave={() => isDesktop && scheduleClose()}
      >
        <div className="container">{renderSubnav()}</div>
      </div>

      <nav
        id="mobile-menu"
        className="mobile-menu"
        aria-label="Mobile"
        style={{ display: open ? 'block' : 'none' }}
      >
        <div className="container" style={{ marginBottom: 12 }}>
          <form className="mobile-search" onSubmit={submitMobile} role="search">
            <input
              value={mq}
              onChange={(e) => setMq(e.target.value)}
              placeholder="Search culture…"
              aria-label="Search"
            />
            <button>Search</button>
          </form>
          {LINKS.map((l) => {
            if (l.to === '/explore') {
              return (
                <div key={l.to} className="mobile-explore">
                  <div className="mobile-explore-head">
                    <NavLink
                      to={l.to}
                      end={l.end}
                      onClick={() => {
                        setOpen(false)
                        setExpanded(false)
                      }}
                    >
                      {l.label}
                    </NavLink>
                    <button
                      className="mobile-explore-toggle"
                      aria-expanded={expanded}
                      aria-controls="mobile-explore-panel"
                      onClick={(e) => {
                        e.preventDefault()
                        setExpanded((v) => !v)
                      }}
                    >
                      {expanded ? '−' : '+'}
                    </button>
                  </div>
                  <div
                    id="mobile-explore-panel"
                    style={{ display: expanded ? 'block' : 'none' }}
                  >
                    {renderSubnav(() => setOpen(false))}
                  </div>
                </div>
              )
            }
            return (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            )
          })}
          <Link to="/assistant">Ask Culture AI</Link>
        </div>
      </nav>
    </header>
  )
}
