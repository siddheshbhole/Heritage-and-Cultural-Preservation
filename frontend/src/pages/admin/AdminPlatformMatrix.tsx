import type { AdminStats } from '../../api/client'
import { AdminIcon } from './AdminIcons'
import type { AdminIconName } from './AdminIcons'
import { AdminPanelHead } from './AdminUI'
import { Skeleton } from '../../components/ui'

type ModuleStatus = 'active' | 'partial' | 'stateless'

interface MatrixModule {
  key: string
  name: string
  summary: string
  icon: AdminIconName
  routes: string[]
  endpoints: string[]
  sources: string
  /** Exact row count from /admin/stats, or null when the module keeps no rows. */
  records: (stats: AdminStats) => number | null
  status: ModuleStatus
}

const MODULES: MatrixModule[] = [
  {
    key: 'heritage',
    name: 'Heritage Sites Registry',
    summary: 'National inventory across tangible, intangible and World listings',
    icon: 'heritage',
    routes: ['/heritage', '/heritage/tangible', '/heritage/intangible', '/heritage/world'],
    endpoints: [
      'GET /api/heritage',
      'GET /api/heritage/{id}',
      'GET /api/heritage/categories',
      'GET /api/heritage/tangible',
      'GET /api/heritage/intangible',
      'GET /api/heritage/world',
    ],
    sources: 'heritage_sites, heritage_categories',
    records: (s) => s.heritage_sites,
    status: 'active',
  },
  {
    key: 'tours',
    name: '360 Virtual Tours',
    summary: 'Embedded Street View panoramas on the heritage detail page',
    icon: 'heritage',
    routes: ['/heritage/:id'],
    endpoints: ['GET /api/heritage/{id}'],
    sources: 'heritage_sites.google_360_url',
    records: (s) => s.virtual_tours_count,
    status: 'partial',
  },
  {
    key: 'guides',
    name: 'Guide Directory & Vacancies',
    summary: 'Self-registered guides with live availability for site staffing',
    icon: 'guide',
    routes: ['/vacancies'],
    endpoints: [
      'POST /api/guide/auth/register',
      'POST /api/guide/auth/login',
      'GET /api/guide/me',
      'PATCH /api/guide/me/availability',
    ],
    sources: 'guide_profiles',
    records: (s) => s.guide_profiles_count,
    status: 'active',
  },
  {
    key: 'assignments',
    name: 'Tour Assignments & Reviews',
    summary: 'Per-site guide assignment, attendance, reviews and misconduct reports',
    icon: 'guide',
    routes: [],
    endpoints: [
      'GET /api/guide/site/{site_id}',
      'POST /api/guide/tour/start',
      'POST /api/guide/tour/end',
      'POST /api/guide/tour/{tour_id}/review',
      'POST /api/guide/guide/{guide_id}/report',
    ],
    sources: 'tour_assignments, guide_reviews, guide_reports',
    records: (s) => s.tour_assignments_count,
    status: 'active',
  },
  {
    key: 'geo',
    name: 'Geographic Coverage',
    summary: 'State and city index used by every state, city and heritage view',
    icon: 'map',
    routes: ['/states', '/states/:id', '/cities/:id'],
    endpoints: [
      'GET /api/states',
      'GET /api/states/{id}',
      'GET /api/states/{id}/cities',
      'GET /api/cities/{id}',
      'GET /api/cities/{id}/heritage',
    ],
    sources: 'states, cities',
    records: (s) => s.states_count + s.cities_count,
    status: 'active',
  },
  {
    key: 'documents',
    name: 'Ministry Archives',
    summary: 'Publications, circulars and reports with downloadable source files',
    icon: 'documents',
    routes: ['/documents', '/documents/:categorySlug', '/publications'],
    endpoints: [
      'GET /api/documents',
      'GET /api/documents/categories',
      'GET /api/documents/{id}',
      'GET /api/documents/file/{id}',
      'GET /api/publications',
    ],
    sources: 'documents, document_categories, document_items',
    records: (s) => s.documents_count,
    status: 'active',
  },
  {
    key: 'museums',
    name: 'Museum Network',
    summary: 'Museum directory with location, timings and collection notes',
    icon: 'museum',
    routes: ['/museums', '/museums/:id'],
    endpoints: ['GET /api/museums', 'GET /api/museums/{id}'],
    sources: 'museums',
    records: (s) => s.museums_count,
    status: 'active',
  },
  {
    key: 'events',
    name: 'Events & Programmes',
    summary: 'Festival, exhibition and programme calendar with ticket bookings',
    icon: 'events',
    routes: ['/', '/extended'],
    endpoints: ['GET /api/events', 'GET /api/events/{id}', 'POST /api/bookings'],
    sources: 'events',
    records: (s) => s.events_count,
    status: 'active',
  },
  {
    key: 'community',
    name: 'Community Stories',
    summary: 'Citizen submissions moderated before publication',
    icon: 'community',
    routes: ['/community'],
    endpoints: ['GET /api/community/posts', 'POST /api/community/posts', 'GET /api/profiles'],
    sources: 'community_posts, community_profiles',
    records: (s) => s.total_posts,
    status: 'active',
  },
  {
    key: 'media',
    name: 'Media Portal',
    summary: 'News, photo albums, video, brochure, artist and webcast libraries',
    icon: 'media',
    routes: ['/media', '/media/photos', '/media/videos', '/media/brochure', '/media/sanskriti', '/media/webcast'],
    endpoints: [
      'GET /api/media/summary',
      'GET /api/media/photos',
      'GET /api/media/videos',
      'GET /api/media/brochures',
      'GET /api/media/news',
      'GET /api/media/sanskriti',
      'GET /api/media/artists',
      'GET /api/media/events',
      'GET /api/media/webcast',
    ],
    sources: 'media_news, media_albums, media_videos, media_brochures, media_sanskriti, media_webcasts',
    records: (s) => s.media_count,
    status: 'active',
  },
  {
    key: 'trending',
    name: 'Trending Rail',
    summary: 'Scored discovery rail surfaced on the public home page',
    icon: 'analytics',
    routes: ['/'],
    endpoints: ['GET /api/trending'],
    sources: 'trending_items',
    records: (s) => s.trending_count,
    status: 'active',
  },
  {
    key: 'search',
    name: 'Search Engine',
    summary: 'Cross-module search with title and suggestion autocomplete',
    icon: 'search',
    routes: ['/search'],
    endpoints: ['GET /api/search', 'GET /api/search/suggest'],
    sources: 'heritage_sites, states, cities, museums, events, publications, authors, documents, commemorations',
    records: () => null,
    status: 'stateless',
  },
  {
    key: 'assistant',
    name: 'AI Heritage Assistant',
    summary: 'Conversational guide answering from the curated heritage corpus',
    icon: 'assistant',
    routes: ['/assistant'],
    endpoints: ['POST /api/assistant/query'],
    sources: 'Read-only corpus, no stored rows',
    records: () => null,
    status: 'stateless',
  },
]

const STATUS_META: Record<ModuleStatus, { label: string; badge: string; note: string }> = {
  active: { label: 'Active', badge: 'admin-badge-approved', note: 'Serving live data' },
  partial: { label: 'Partial', badge: 'admin-badge-pending', note: 'Only records carrying a 360 link are shown' },
  stateless: { label: 'Stateless', badge: 'admin-badge-info', note: 'No database rows, so no record count' },
}

export default function AdminPlatformMatrix({
  stats,
  loading,
}: {
  stats: AdminStats | null
  loading: boolean
}) {
  const coverage = MODULES.filter((m) => m.status === 'active').length
  const partial = MODULES.filter((m) => m.status === 'partial').length

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="Platform Coverage Matrix"
        sub={`Every public module, the routes it serves, the API behind it and its live record count from /admin/stats.`}
        actions={
          <div className="admin-counts">
            <span>
              <b>{MODULES.length}</b> modules
            </span>
            <span>
              <b>{coverage}</b> fully active
            </span>
            <span>
              <b>{partial}</b> partial
            </span>
          </div>
        }
      />

      {loading && !stats ? (
        <div className="admin-panel-pad">
          <div className="admin-bars">
            <Skeleton style={{ height: 26 }} />
            <Skeleton style={{ height: 26 }} />
            <Skeleton style={{ height: 26 }} />
            <Skeleton style={{ height: 26 }} />
          </div>
        </div>
      ) : (
        <div className="admin-matrix-wrap">
          <table className="admin-matrix">
            <thead>
              <tr>
                <th>Module</th>
                <th>Frontend Route</th>
                <th>Backend Endpoints</th>
                <th>Data Source</th>
                <th className="am-col-num">Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => {
                const meta = STATUS_META[mod.status]
                const value = stats ? mod.records(stats) : null
                return (
                  <tr key={mod.key}>
                    <td>
                      <div className="am-module">
                        <span className="amm-icon">
                          <AdminIcon name={mod.icon} size={17} />
                        </span>
                        <span>
                          <b>{mod.name}</b>
                          <span>{mod.summary}</span>
                        </span>
                      </div>
                    </td>
                    <td className="am-route">
                      {mod.routes.length === 0 ? (
                        <span className="admin-badge admin-badge-neutral">Backend only</span>
                      ) : (
                        mod.routes.map((r) => (
                          <code key={r} style={{ margin: '0 4px 4px 0', display: 'inline-block' }}>
                            {r}
                          </code>
                        ))
                      )}
                    </td>
                    <td className="am-api">
                      {mod.endpoints.map((e) => (
                        <code key={e}>{e}</code>
                      ))}
                    </td>
                    <td>
                      <span className="admin-tag" style={{ margin: 0 }}>
                        {mod.sources}
                      </span>
                    </td>
                    <td className="am-num">
                      {value === null ? <span style={{ color: 'var(--muted)', fontWeight: 500 }}>N/A</span> : value.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={meta.badge}>{meta.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-legend">
        {(Object.keys(STATUS_META) as ModuleStatus[]).map((key) => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span className={STATUS_META[key].badge}>{STATUS_META[key].label}</span>
            {STATUS_META[key].note}
          </span>
        ))}
      </div>

      <p className="am-footnote">
        Record counts are exact row totals from the live database, not estimates. Modules marked
        N/A answer queries without persisting rows, so no figure is reported rather than reporting zero.
      </p>
    </div>
  )
}
