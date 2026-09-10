import { Link, useLocation } from 'react-router-dom'

export interface DocumentsNavItem {
  to: string
  label: string
  desc: string
}

// EXACT Ministry of Culture document categories, in strict order.
export const DOCUMENTS_NAV: DocumentsNavItem[] = [
  { to: '/documents/reports', label: 'Reports', desc: 'Annual reports and official reviews' },
  { to: '/documents/act-and-policies', label: 'Act and Policies', desc: 'Acts, rules and policy documents' },
  { to: '/documents/circular-orders-notices', label: 'Circular, Orders and Notices', desc: 'Government circulars and orders' },
  { to: '/documents/publications', label: 'Publications', desc: 'Official publications and compilations' },
  { to: '/documents/mou-others', label: 'MoU / Others', desc: 'MoUs with partner organisations' },
  { to: '/documents/press-release', label: 'Press Release', desc: 'Official press releases' },
  { to: '/documents/gazettes-notifications', label: 'Gazettes Notifications', desc: 'Gazette and statutory notifications' },
  { to: '/documents/guidelines', label: 'Guidelines', desc: 'Scheme and programme guidelines' },
  { to: '/documents/e-sanskriti', label: 'E-Sanskriti', desc: 'Sanskriti Patrika and e-publications' },
  { to: '/documents/schemes', label: 'Schemes', desc: 'Ministry schemes and programmes' },
]

export const DOCUMENTS_ROUTE_RE = /^\/documents(\/|$)/

export default function DocumentsNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <div className="documents-mega">
      <div className="documents-mega-items">
        {DOCUMENTS_NAV.map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + '/')
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`mega-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              <span className="mega-label">{n.label}</span>
              <span className="mega-desc">{n.desc}</span>
            </Link>
          )
        })}
      </div>
      <div className="documents-mega-footer">
        <span className="documents-mega-caption">Official documents of the Ministry of Culture, Government of India.</span>
        <Link to="/documents" className="documents-mega-all" onClick={onNavigate}>All documents →</Link>
      </div>
    </div>
  )
}