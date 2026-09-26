import type { AdminStats, ModelMeta, AdminAnalytics, AdminHealth } from '../../api/client'
import { AdminIcon } from './AdminIcons'
import type { AdminIconName } from './AdminIcons'
import { Skeleton } from '../../components/ui'

type MetricTab = 'moderation' | 'crud' | 'audit' | 'heritage' | 'users' | 'analytics' | 'matrix'

interface AdminDashboardOverviewProps {
  stats: AdminStats | null
  models: ModelMeta[]
  analytics: AdminAnalytics | null
  health: AdminHealth | null
  lastSync: string | null
  loading: boolean
  onNavigateTab: (tab: MetricTab) => void
  /** Open a model in the data browser, optionally straight into the create form. */
  onQuickAction: (modelKey: string, create: boolean) => void
}

interface MetricCard {
  label: string
  value: number | null
  icon: AdminIconName
  sub: string
  tab: MetricTab
  attention?: boolean
}

interface QuickAction {
  label: string
  description: string
  icon: AdminIconName
  /** Present for data-browser targets, absent for plain tab navigation. */
  modelKey?: string
  create?: boolean
  tab?: MetricTab
}

export default function AdminDashboardOverview({
  stats,
  models,
  analytics,
  health,
  lastSync,
  loading,
  onNavigateTab,
  onQuickAction,
}: AdminDashboardOverviewProps) {
  const metricCards: MetricCard[] = [
    {
      label: 'Pending Moderation',
      value: stats ? stats.pending_posts : null,
      icon: 'moderation',
      sub: stats ? `${stats.total_posts} submissions received` : 'Awaiting statistics',
      tab: 'moderation',
      attention: true,
    },
    {
      label: 'Approved Submissions',
      value: stats ? stats.approved_posts : null,
      icon: 'check',
      sub: 'Live community stories',
      tab: 'moderation',
    },
    {
      label: 'Heritage Sites',
      value: stats ? stats.heritage_sites : null,
      icon: 'heritage',
      sub: stats
        ? `${stats.tangible_sites} tangible / ${stats.intangible_sites} intangible`
        : 'Awaiting statistics',
      tab: 'heritage',
    },
    {
      label: 'States & UTs',
      value: stats ? stats.states_count : null,
      icon: 'map',
      sub: stats ? `${stats.cities_count} cities mapped` : 'Awaiting statistics',
      tab: 'matrix',
    },
    {
      label: 'Ministry Documents',
      value: stats ? stats.documents_count : null,
      icon: 'documents',
      sub: stats ? `${stats.doc_categories_count} archive categories` : 'Awaiting statistics',
      tab: 'crud',
    },
    {
      label: 'Media Assets',
      value: stats ? stats.media_count : null,
      icon: 'media',
      sub: 'News, videos, albums, brochures',
      tab: 'analytics',
    },
    {
      label: 'Registered Guides',
      value: stats ? stats.guide_profiles_count : null,
      icon: 'guide',
      sub: stats ? `${stats.guides_available_count} currently available` : 'Awaiting statistics',
      tab: 'matrix',
    },
    {
      label: 'Audit Trail',
      value: stats ? stats.audit_logs_count : null,
      icon: 'audit',
      sub: 'Logged administrative actions',
      tab: 'audit',
    },
    {
      label: 'Cultural Records',
      value: stats ? stats.culture_events_count : null,
      icon: 'events',
      sub: stats
        ? `Events classified cultural, of ${stats.events_count} total`
        : 'Awaiting statistics',
      tab: 'crud',
    },
    {
      label: 'Ritual Events',
      value: stats ? stats.ritual_events_count : null,
      icon: 'events',
      sub: stats
        ? `Events classified ritual`
        : 'Awaiting statistics',
      tab: 'crud',
    },
    {
      label: 'Ritual Heritage',
      value: stats ? stats.ritual_heritage_count : null,
      icon: 'heritage',
      sub: 'Catalogue entries in ritual and oral-tradition categories',
      tab: 'heritage',
    },
  ]

  // Only advertise a quick action whose target actually exists in the registry,
  // so the panel can never present a control that dead-ends.
  const availableKeys = new Set(models.map((m) => m.key))
  const allQuickActions: QuickAction[] = [
    {
      label: 'Review Submissions',
      description:
        stats && stats.pending_posts > 0
          ? `${stats.pending_posts} awaiting decision`
          : 'Moderation queue',
      icon: 'moderation',
      tab: 'moderation',
    },
    {
      label: 'Add Heritage Site',
      description: 'Create a new catalogue record',
      icon: 'heritage',
      modelKey: 'heritage_sites',
      create: true,
    },
    {
      label: 'Add Cultural Record',
      description: 'Register a cultural event',
      icon: 'events',
      modelKey: 'events',
      create: true,
    },
    {
      label: 'Upload Document',
      description: 'Add an archive document',
      icon: 'documents',
      modelKey: 'document_items',
      create: true,
    },
    {
      label: 'Platform Matrix',
      description: 'Audit every module and route',
      icon: 'matrix',
      tab: 'matrix',
    },
  ]
  const quickActions = allQuickActions.filter(
    (action) => !action.modelKey || availableKeys.has(action.modelKey),
  )

  const totalRecords = models.reduce((sum, m) => sum + m.count, 0)
  const recentActivity = analytics ? analytics.recent_activity.slice(0, 8) : []

  return (
    <div>
      <div className="admin-syncbar">
        <span className="admin-syncbar-label">
          <AdminIcon name="clock" size={14} />
          Last updated
        </span>
        <span className="admin-syncbar-value">
          {lastSync ? formatSyncTime(lastSync) : loading ? 'Loading platform data' : 'Not available'}
        </span>
        <span className="admin-syncbar-source">
          {health ? `Status probe ${formatSyncTime(health.generated_at)}` : 'Status probe unavailable'}
        </span>
      </div>

      {quickActions.length > 0 && (
        <>
          <h3 className="admin-section-title">Quick Actions</h3>
          <div className="admin-quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="admin-quick-action"
                onClick={() => {
                  if (action.modelKey) onQuickAction(action.modelKey, Boolean(action.create))
                  else if (action.tab) onNavigateTab(action.tab)
                }}
              >
                <span className="admin-quick-action-icon">
                  <AdminIcon name={action.icon} size={17} />
                </span>
                <span className="admin-quick-action-body">
                  <span className="admin-quick-action-label">{action.label}</span>
                  <span className="admin-quick-action-desc">{action.description}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="admin-section-title">
        Platform Metrics <span className="ast-count">&mdash; live from /admin/stats</span>
      </h3>

      {loading && !stats ? (
        <div className="card-grid" style={{ marginBottom: 32 }}>
          <Skeleton style={{ height: 110 }} />
          <Skeleton style={{ height: 110 }} />
          <Skeleton style={{ height: 110 }} />
          <Skeleton style={{ height: 110 }} />
        </div>
      ) : (
        <div className="admin-metrics" style={{ marginBottom: 32 }}>
          {metricCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className={`admin-metric${card.attention ? ' accent-attention' : ''}`}
              onClick={() => onNavigateTab(card.tab)}
            >
              <span className="am-top">
                <AdminIcon name={card.icon} size={16} />
                <span className="am-label">{card.label}</span>
              </span>
              <span className={`am-value${card.value === null ? ' is-empty' : ''}`}>
                {formatMetric(card.value)}
              </span>
              <span className="am-sub">{card.sub}</span>
            </button>
          ))}
        </div>
      )}

      <h3 className="admin-section-title">
        Content Database{' '}
        <span className="ast-count">
          ({models.length} managed entities, {totalRecords.toLocaleString('en-IN')} records)
        </span>
      </h3>

      {models.length === 0 ? (
        <p className="admin-panel-sub" style={{ marginBottom: 32 }}>
          No managed entities are registered in the schema registry.
        </p>
      ) : (
        <div className="admin-panel" style={{ marginBottom: 32 }}>
          <div className="admin-table-scroll">
            <table className="admin-content-table">
              <thead>
                <tr>
                  <th scope="col">Entity</th>
                  <th scope="col">Domain</th>
                  <th scope="col" className="num">Records</th>
                  <th scope="col" className="num">Share</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...models]
                  .sort((a, b) => b.count - a.count)
                  .map((m) => (
                    <tr key={m.key}>
                      <td>
                        <span className="admin-content-name">{m.class_name}</span>
                        <code className="admin-content-table-key">{m.key}</code>
                      </td>
                      <td>
                        <span className="admin-tag">{m.domain || 'General'}</span>
                      </td>
                      <td className="num">{m.count.toLocaleString('en-IN')}</td>
                      <td className="num">
                        {totalRecords > 0
                          ? `${((m.count / totalRecords) * 100).toFixed(1)}%`
                          : '0.0%'}
                      </td>
                      <td>
                        <span className={m.count > 0 ? 'admin-badge admin-badge-approved' : 'admin-badge admin-badge-pending'}>
                          {m.count > 0 ? 'In use' : 'Empty'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="admin-section-title">System Status</h3>
      {health ? (
        <div className="admin-panel" style={{ marginBottom: 32 }}>
          <div className="admin-panel-pad">
            <div className="admin-status-summary">
              <span className={statusBadgeClass(health.status)}>
                {statusLabel(health.status)}
              </span>
              <span className="admin-syncbar-source">
                Measured {formatSyncTime(health.generated_at)}
              </span>
            </div>
            <div className="admin-status-list">
              {health.checks.map((check) => (
                <div key={check.name} className="admin-status-row">
                  <span className={statusDotClass(check.status)} aria-hidden="true" />
                  <span className="admin-status-label">{check.label}</span>
                  <span className={statusBadgeClass(check.status)}>
                    {statusLabel(check.status)}
                  </span>
                  <span className="admin-status-detail">{check.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-panel" style={{ marginBottom: 32 }}>
          <div className="admin-panel-pad">
            <p className="admin-panel-sub">
              The measured status probe did not respond. Sign in again or reload to retry.
            </p>
          </div>
        </div>
      )}

      {recentActivity.length > 0 && (
        <>
          <h3 className="admin-section-title">Recent Activity</h3>
          <div className="admin-panel" style={{ marginBottom: 32 }}>
            <div className="admin-panel-pad">
              <div className="admin-bars">
                {recentActivity.map((log) => (
                  <div key={log.id} className="admin-bar-row" style={{ gridTemplateColumns: '80px minmax(0, 1fr) 170px', alignItems: 'center' }}>
                    <span className={actionBadgeClass(log.action)} style={{ justifySelf: 'start' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--indigo-deep)' }}>
                      {log.user_email || 'System'} &middot; <code>{log.model_name}</code> #{log.record_id}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'right' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Not available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-legend" style={{ justifyContent: 'center' }}>
              <button className="btn btn-sm btn-outline" onClick={() => onNavigateTab('audit')}>
                View Full Audit Trail
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * A metric renders a real number whenever the statistics payload supplied one.
 * A genuine zero must display as "0"; only a missing value falls back to the
 * placeholder, so the dashboard never shows an ellipsis for a known count.
 */
function formatMetric(value: number | null): string {
  if (value === null) return 'Not available'
  return value.toLocaleString('en-IN')
}

/** Render a real timestamp, and say so plainly when one is absent. */
function formatSyncTime(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleString()
}

function statusLabel(status: string): string {
  switch (status) {
    case 'operational':
      return 'Operational'
    case 'unavailable':
      return 'Not configured'
    case 'down':
      return 'Unavailable'
    case 'partial':
      return 'Partially operational'
    case 'degraded':
      return 'Degraded'
    default:
      return status
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'operational':
      return 'admin-badge admin-badge-approved'
    case 'unavailable':
      return 'admin-badge admin-badge-pending'
    case 'down':
    case 'degraded':
      return 'admin-badge admin-badge-rejected'
    default:
      return 'admin-badge admin-badge-info'
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case 'operational':
      return 'admin-status-dot is-ok'
    case 'unavailable':
      return 'admin-status-dot is-unset'
    default:
      return 'admin-status-dot is-bad'
  }
}

function actionBadgeClass(action: string): string {
  switch (action.toUpperCase()) {
    case 'CREATE':
    case 'APPROVED':
      return 'admin-badge admin-badge-approved'
    case 'UPDATE':
      return 'admin-badge admin-badge-info'
    case 'DELETE':
    case 'REJECTED':
      return 'admin-badge admin-badge-rejected'
    default:
      return 'admin-badge admin-badge-pending'
  }
}
