import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

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
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate('/search?q=' + encodeURIComponent(q.trim()))
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>श्री</span>
          <span>
            <div className="brand-name">Bharat Cultural Odessey</div>
            <div className="brand-sub">Ministry of Culture · Digital Bharat</div>
          </span>
        </Link>

        <nav className="nav-links">
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
          <Link to="/assistant" className="btn btn-sm btn-primary">Ask Culture AI</Link>
          <button className="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-menu" style={{ display: 'block' }}>
          <div className="container" style={{ marginBottom: 12 }}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/assistant" onClick={() => setOpen(false)}>Ask Culture AI</Link>
          </div>
        </nav>
      )}
    </header>
  )
}