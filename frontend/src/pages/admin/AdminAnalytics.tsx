import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AdminAnalytics as AdminAnalyticsType } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'
import { AdminIcon } from './AdminIcons'
import { AdminNotice, AdminPanelHead, adminStatusClass } from './AdminUI'

interface AdminAnalyticsProps {
  token: string
}

const CHART_GROUPS: { title: string; icon: 'heritage' | 'map' | 'moderation' | 'documents' | 'media' | 'analytics' }[] = [
  { title: 'Heritage Sites by Category', icon: 'heritage' },
  { title: 'Sites by State', icon: 'map' },
  { title: 'UNESCO Status Distribution', icon: 'heritage' },
  { title: 'Heritage Type Distribution', icon: 'analytics' },
  { title: 'Community Moderation', icon: 'moderation' },
  { title: 'Document Categories', icon: 'documents' },
  { title: 'Media Assets by Type', icon: 'media' },
  { title: 'Tangible vs Intangible', icon: 'analytics' },
]

function BarChart({ data, emptyText }: { data: Record<string, number>; emptyText: string }) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)

  if (entries.length === 0) {
    return (
      <Empty
        big={<AdminIcon name="analytics" size={34} strokeWidth={1.3} />}
        text={emptyText}
      />
    )
  }

  return (
    <div className="admin-bars">
      {entries.map(([label, value]) => (
        <div key={label} className="admin-bar-row">
          <span className="ab-label" title={label}>
            {label}
          </span>
          <span className="ab-track">
            <span className="ab-fill" style={{ width: `${(value / maxVal) * 100}%` }} />
          </span>
          <span className="ab-value">{value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminAnalytics({ token }: AdminAnalyticsProps) {
  const [data, setData] = useState<AdminAnalyticsType | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const loadAnalytics = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      setData(await get<AdminAnalyticsType>('/admin/analytics', token))
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [token])

  const charts: Record<string, Record<string, number>> = data
    ? {
        'Heritage Sites by Category': data.sites_by_category,
        'Sites by State': data.sites_by_state,
        'UNESCO Status Distribution': data.sites_by_unesco,
        'Heritage Type Distribution': data.sites_by_type,
        'Community Moderation': {
          Approved: data.moderation_breakdown.approved,
          Pending: data.moderation_breakdown.pending,
          Rejected: data.moderation_breakdown.rejected,
        },
        'Document Categories': data.doc_categories,
        'Media Assets by Type': data.media_breakdown,
        'Tangible vs Intangible': data.categories_breakdown,
      }
    : {}

  const topStates = data
    ? Object.entries(data.sites_by_state)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .reduce<Record<string, number>>((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    : {}

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="Analytics & Activity Insights"
        sub="Data-driven breakdown of platform coverage, heritage distribution, and community activity."
        actions={
          <button className="btn btn-sm btn-outline" onClick={loadAnalytics} disabled={loading}>
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        }
      />

      <div className="admin-panel-pad">
        {error && <AdminNotice tone="error">{error}</AdminNotice>}

        {loading ? (
          <div className="admin-chart-grid">
            <Skeleton style={{ height: 220 }} />
            <Skeleton style={{ height: 220 }} />
          </div>
        ) : !data ? (
          <Empty
            big={<AdminIcon name="analytics" size={40} strokeWidth={1.3} />}
            text="No analytics data available."
          />
        ) : (
          <>
            <div className="admin-chart-grid">
              {CHART_GROUPS.map((group) => (
                <section key={group.title} className="admin-chart-card">
                  <h4 className="admin-chart-title">
                    <AdminIcon name={group.icon} size={15} />
                    {group.title}
                  </h4>
                  <BarChart
                    data={group.title === 'Sites by State' ? topStates : charts[group.title]}
                    emptyText={`No ${group.title.toLowerCase()} recorded yet.`}
                  />
                </section>
              ))}

              <section className="admin-chart-card wide">
                <h4 className="admin-chart-title">
                  <AdminIcon name="audit" size={15} />
                  Recent Audit Activity
                </h4>
                {data.recent_activity.length === 0 ? (
                  <Empty
                    big={<AdminIcon name="audit" size={34} strokeWidth={1.3} />}
                    text="No recent audit activity."
                  />
                ) : (
                  <div className="admin-feed">
                    {data.recent_activity.map((log) => (
                      <div key={log.id} className="admin-feed-row">
                        <span className={adminStatusClass(log.action)}>{log.action}</span>
                        <span className="afr-body">
                          <strong>{log.user_email || 'System'}</strong> modified{' '}
                          <code>{log.model_name}</code> #{log.record_id}
                        </span>
                        <span className="afr-time">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Not available'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
