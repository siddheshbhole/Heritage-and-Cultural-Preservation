import { NavLink, Outlet, useLocation } from 'react-router-dom'

const MEDIA_TABS = [
  { to: '/media/photos', label: 'Photos' },
  { to: '/media/videos', label: 'Videos' },
  { to: '/media/brochure', label: 'Brochure' },
  { to: '/media/bharat-beat', label: 'Bharat Beat' },
  { to: '/media/sanskriti', label: 'Sanskriti' },
  { to: '/media/events', label: 'Events' },
  { to: '/media/latest-news', label: 'Latest News' },
  { to: '/media/announcement', label: 'Announcement' },
  { to: '/media/webcast', label: 'Webcast' },
]

export default function MediaLayout() {
  const { pathname } = useLocation()

  return (
    <div className="media-section">
      <div className="container">
        <div className="media-nav-bar">
          <div className="media-nav-items">
            {MEDIA_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `media-tab${isActive || pathname === tab.to ? ' active' : ''}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
