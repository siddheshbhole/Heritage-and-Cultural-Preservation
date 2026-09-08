import { Link, useLocation } from 'react-router-dom'

export interface HeritageNavItem {
  to: string
  label: string
  desc: string
  icon: string
}

export const HERITAGE_NAV: HeritageNavItem[] = [
  { to: '/heritage/tangible', label: 'Tangible Cultural Heritage', desc: 'Monuments, temples, forts and natural wonders', icon: '🏛️' },
  { to: '/heritage/intangible', label: 'Intangible Cultural Heritage', desc: 'Dance, music, crafts and living traditions', icon: '🎭' },
  { to: '/heritage/world', label: 'World Heritage', desc: 'UNESCO-listed heritage of national pride', icon: '🌍' },
]

export const HERITAGE_ROUTE_RE = /^\/heritage(\/|$)/

export default function HeritageNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  const isActive = (to: string) => {
    if (to === '/heritage/tangible') {
      return ['/heritage/tangible', '/heritage/tangible/man-made', '/heritage/tangible/natural', '/heritage/tangible/mixed'].includes(pathname)
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <div className="heritage-mega">
      <div className="heritage-mega-items">
        {HERITAGE_NAV.map((n) => {
          const active = isActive(n.to)
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`heritage-mega-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              <span className="heritage-mega-icon" aria-hidden>{n.icon}</span>
              <span className="heritage-mega-label">{n.label}</span>
              <span className="heritage-mega-desc">{n.desc}</span>
            </Link>
          )
        })}
      </div>
      <div className="heritage-mega-footer">
        <span className="heritage-mega-caption">Curated from the Ministry of Culture and trusted heritage institutions.</span>
        <Link to="/heritage" className="heritage-mega-all" onClick={onNavigate}>All heritage of Bharat →</Link>
      </div>
    </div>
  )
}