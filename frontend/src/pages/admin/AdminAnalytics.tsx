import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AdminAnalytics as AdminAnalyticsType } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'

interface AdminAnalyticsProps {
  token: string
}

function BarChart({ data, maxColor = '#1d4ed8' }: { data: Record<string, number>; maxColor?: string }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)

  if (entries.length === 0) return <Empty big="📊" text="No data available." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ minWidth: '120px', fontSize: '13px', color: '#334155', textAlign: 'right', fontWeight: 500 }}>{label}</span>
          <div style={{ flex: 1, height: '22px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(value / maxVal) * 100}%`, height: '100%', backgroundColor: maxColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ minWidth: '40px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{value}</span>
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
      const res = await get<AdminAnalyticsType>('/admin/analytics', token)
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [token])

  return (
    <div>
      <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Analytics & Activity Insights</h3>
        <span style={{ fontSize: '12.5px', color: '#64748b' }}>Data-driven breakdown of platform coverage, heritage distribution, and community activity.</span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px' }}><Skeleton /><Skeleton /></div>
      ) : !data ? (
        <Empty big="📊" text="No analytics data available." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Heritage Sites by Category */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Heritage Sites by Category</h4>
            <BarChart data={data.sites_by_category} maxColor="#1d4ed8" />
          </div>

          {/* Heritage Sites by State (Top 15) */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Sites by State (Top 15)</h4>
            <BarChart data={data.sites_by_state} maxColor="#059669" />
          </div>

          {/* UNESCO Status Distribution */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>UNESCO Status Distribution</h4>
            <BarChart data={data.sites_by_unesco} maxColor="#7e22ce" />
          </div>

          {/* Heritage Type Distribution */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Heritage Type Distribution</h4>
            <BarChart data={data.sites_by_type} maxColor="#d97706" />
          </div>

          {/* Community Moderation Breakdown */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Community Moderation</h4>
            <BarChart
              data={{
                Approved: data.moderation_breakdown.approved,
                Pending: data.moderation_breakdown.pending,
                Rejected: data.moderation_breakdown.rejected,
              }}
              maxColor="#059669"
            />
          </div>

          {/* Document Categories */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Document Categories</h4>
            <BarChart data={data.doc_categories} maxColor="#0369a1" />
          </div>

          {/* Media Assets */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Media Assets by Type</h4>
            <BarChart data={data.media_breakdown} maxColor="#be185d" />
          </div>

          {/* Heritage Categories Breakdown */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Heritage Categories (Tangible vs Intangible)</h4>
            <BarChart data={data.categories_breakdown} maxColor="#4338ca" />
          </div>

          {/* Recent Activity Feed */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Recent Audit Activity</h4>
            {data.recent_activity.length === 0 ? (
              <Empty big="📜" text="No recent audit activity." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {data.recent_activity.map((log) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, minWidth: '70px', textAlign: 'center',
                      backgroundColor: log.action === 'CREATE' ? '#dcfce7' : log.action === 'UPDATE' ? '#dbeafe' : log.action === 'DELETE' ? '#fee2e2' : log.action === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                      color: log.action === 'CREATE' ? '#15803d' : log.action === 'UPDATE' ? '#1d4ed8' : log.action === 'DELETE' ? '#b91c1c' : log.action === 'APPROVED' ? '#15803d' : '#b45309',
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#475569', flex: 1 }}>
                      <strong>{log.user_email || 'System'}</strong> modified <code style={{ fontSize: '11.5px', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>{log.model_name}</code> #{log.record_id}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
