import { Link, useLocation } from 'react-router-dom'

export interface ExploreNavItem {
  to: string
  label: string
  desc: string
  icon: string
}

export const EXPLORE_NAV: ExploreNavItem[] = [
  { to: '/greats', label: 'Eminent Personalities', desc: 'Freedom fighters, icons & legends of Bharat', icon: '🏛️' },
  { to: '/commemorations', label: 'Commemorations', desc: 'Jubilees, anniversaries & national celebrations', icon: '🏅' },
  { to: '/culture', label: 'Culture & Rituals', desc: 'Festivals, rituals, arts & living heritage', icon: '🎭' },
  { to: '/publications', label: 'Publications', desc: 'Books, journals & scholarly works', icon: '📚' },
  { to: '/papers', label: 'Archival Documents', desc: 'Digitised records, treaties & manuscripts', icon: '📜' },
  { to: '/schemes', label: 'Schemes & Programmes', desc: 'Government initiatives for culture & heritage', icon: '🧾' },
  { to: '/awards', label: 'Awards & Honours', desc: 'Recognitions for cultural contributions', icon: '🎖️' },
  { to: '/eternities', label: 'Scholars & Authors', desc: 'Researchers behind the cultural record', icon: '✒️' },
  { to: '/mous', label: 'MoUs & Partnerships', desc: 'Institutional collaborations & agreements', icon: '🤝' },
  { to: '/institutions', label: 'Institutions', desc: "The bodies preserving Bharat's culture", icon: '🏫' },
]

const ESCAPED_ROUTES = EXPLORE_NAV.map((n) => n.to.replace(/\//g, '\\/')).join('|')
export const EXPLORE_ROUTE_RE = new RegExp(`^(?:${ESCAPED_ROUTES}|\\/explore)$`)

export default function ExploreNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <div className="enav">
      {EXPLORE_NAV.map((n) => {
        const active = pathname === n.to
        return (
          <Link
            key={n.to}
            to={n.to}
            className={`enav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <span className="enav-ico" aria-hidden>{n.icon}</span>
            <span className="enav-text">
              <span className="enav-label">{n.label}</span>
              <span className="enav-desc">{n.desc}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}