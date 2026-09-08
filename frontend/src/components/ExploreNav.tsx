import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export interface ExploreNavItem {
  to: string
  label: string
  desc: string
}

export const EXPLORE_NAV: ExploreNavItem[] = [
  { to: '/heritage', label: 'Heritage Sites', desc: 'Monuments, temples, forts and living stones of Bharat' },
  { to: '/heritage', label: 'Monuments & Architecture', desc: 'Iconic forts, palaces and architectural marvels' },
  { to: '/museums', label: 'Museums & Galleries', desc: 'Collections, artefacts and gallery experiences' },
  { to: '/culture', label: 'Festivals & Celebrations', desc: 'Colourful festivals, melas and seasonal celebrations' },
  { to: '/culture', label: 'Music & Performing Arts', desc: 'Classical ragas, folk music and staged arts' },
  { to: '/culture', label: 'Dance Traditions', desc: 'Bharatanatyam, Kathak, Odissi and folk dance forms' },
  { to: '/explore', label: 'Handicrafts & Artisans', desc: 'Weaves, crafts and living artisan traditions' },
  { to: '/explore', label: 'Food & Cuisine', desc: 'Regional cuisines, sweets and culinary heritage' },
  { to: '/papers', label: 'Languages & Literature', desc: 'Scripts, manuscripts and literary traditions' },
  { to: '/heritage', label: 'Spiritual & Religious Heritage', desc: 'Temples, pilgrimages and spiritual centres' },
  { to: '/explore', label: 'States & Regions', desc: '28 states, 8 UTs and their distinct cultures' },
  { to: '/community', label: 'Cultural Stories & Blogs', desc: 'Stories, essays and community voices' },
]

const NAV_ROUTES = Array.from(new Set(EXPLORE_NAV.map((n) => n.to)))
const LEGACY_ROUTES = [
  '/greats',
  '/commemorations',
  '/publications',
  '/schemes',
  '/awards',
  '/eternities',
  '/mous',
  '/institutions',
]
const ESCAPED = [...NAV_ROUTES, ...LEGACY_ROUTES, '/explore'].filter((r) => r !== '/').join('|').replace(/\//g, '\\/')
export const EXPLORE_ROUTE_RE = new RegExp(`^(?:${ESCAPED})$`)

interface FeaturedDest {
  img: string
  kicker: string
  title: string
  desc: string
  to: string
}

const FEATURED: FeaturedDest[] = [
  {
    img: '/images/heritage/hero/amber-fort.webp',
    kicker: 'Rajasthan',
    title: 'Land of Royal Heritage',
    desc: 'Forts, palaces and desert cities where Rajput grandeur still lives in stone and song.',
    to: '/heritage',
  },
  {
    img: '/images/heritage/hero/hampi.webp',
    kicker: 'Hampi · Karnataka',
    title: 'Ancient Wonders',
    desc: 'The boulder-strewn capital of Vijayanagara, an open-air museum of ruins and temples.',
    to: '/heritage',
  },
  {
    img: '/images/heritage/hero/taj-mahal.webp',
    kicker: 'Agra · Uttar Pradesh',
    title: 'Taj Mahal & Mughal Legacy',
    desc: 'Marble poetry on the Yamuna, at the heart of the great Mughal capital.',
    to: '/heritage',
  },
  {
    img: '/images/heritage/hero/konark.webp',
    kicker: 'Odisha',
    title: 'Konark Sun Temple',
    desc: 'The stone chariot of the Sun — Kalinga architecture at its celestial best.',
    to: '/heritage',
  },
]

function FeaturedDestinations() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % FEATURED.length), 4500)
    return () => window.clearInterval(t)
  }, [])

  const f = FEATURED[i]

  return (
    <div className="mega-feat">
      <div className="mega-feat-media">
        <img key={i} src={f.img} alt={f.title} loading="lazy" />
        <div className="mega-feat-overlay" aria-hidden />
        <span className="mega-feat-tag">{f.kicker}</span>
        <div className="mega-feat-title">
          {f.title}
          <small>Curated destination</small>
        </div>
      </div>
      <div className="mega-feat-body">
        <p>{f.desc}</p>
        <div className="mega-feat-actions">
          <div className="mega-dots" role="tablist" aria-label="Featured destinations">
            {FEATURED.map((d, n) => (
              <button
                key={d.title}
                type="button"
                className={`mega-dot${n === i ? ' active' : ''}`}
                aria-label={d.title}
                aria-pressed={n === i}
                onClick={() => setI(n)}
              />
            ))}
          </div>
          <Link to={f.to} className="btn btn-sm btn-primary mega-feat-link">Explore →</Link>
        </div>
      </div>
    </div>
  )
}

export default function ExploreNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <div>
      <div className="mega-grid">
        <div className="mega-items">
          {EXPLORE_NAV.map((n) => {
            const active = pathname === n.to || (n.to === '/explore' && pathname.startsWith('/explore'))
            return (
              <Link
                key={n.label}
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
        <FeaturedDestinations />
      </div>
      <div className="mega-footer">
        <span className="mega-caption">Curated from the Ministry of Culture and trusted institutions.</span>
        <Link to="/explore" className="mega-all" onClick={onNavigate}>Explore all of Bharat →</Link>
      </div>
    </div>
  )
}