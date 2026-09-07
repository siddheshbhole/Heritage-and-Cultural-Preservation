import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/heritage', label: 'Heritage', end: false },
  { to: '/museums', label: 'Museums', end: false },
  { to: '/culture', label: 'Culture', end: false },
  { to: '/papers', label: 'Papers', end: false },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [mq, setMq] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

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

  return (
    <header className="navbar">
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
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
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
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/assistant">Ask Culture AI</Link>
        </div>
      </nav>
    </header>
  )
}