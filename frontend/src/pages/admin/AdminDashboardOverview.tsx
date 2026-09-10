import type { AdminStats, ModelMeta, AdminAnalytics } from '../../api/client'

interface AdminDashboardOverviewProps {
  stats: AdminStats | null
  models: ModelMeta[]
  analytics: AdminAnalytics | null
  onNavigateTab: (tab: 'moderation' | 'crud' | 'audit' | 'heritage' | 'users' | 'analytics') => void
}

export default function AdminDashboardOverview({
  stats,
  models,
  analytics,
  onNavigateTab,
}: AdminDashboardOverviewProps) {
  const domainCounts: Record<string, number> = {}
  models.forEach((m) => {
    const d = m.domain || 'General'
    domainCounts[d] = (domainCounts[d] || 0) + m.count
  })

  const metricCards = [
    { label: 'Pending Moderation', value: stats?.pending_posts, color: '#d97706', bg: '#fffbeb', border: '#fde68a', tab: 'moderation' as const, sub: 'Requires review' },
    { label: 'Approved Submissions', value: stats?.approved_posts, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', tab: 'moderation' as const, sub: 'Live community stories' },
    { label: 'Heritage Sites', value: stats?.heritage_sites, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', tab: 'heritage' as const, sub: 'Tangible & Intangible' },
    { label: 'States & UTs', value: stats?.states_count, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', tab: 'crud' as const, sub: 'Geographic coverage' },
    { label: 'Documents', value: stats?.documents_count, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', tab: 'crud' as const, sub: 'Ministry archives' },
    { label: 'Media Assets', value: stats?.media_count, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', tab: 'analytics' as const, sub: 'News, videos, albums' },
    { label: 'Community Contributors', value: stats ? stats.total_posts : null, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', tab: 'users' as const, sub: 'Post submissions' },
    { label: 'Audit Trail', value: stats?.audit_logs_count, color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', tab: 'audit' as const, sub: 'Logged admin actions' },
  ]

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
        Platform Metrics
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {metricCards.map((card) => (
          <div
            key={card.label}
            onClick={() => onNavigateTab(card.tab)}
            style={{ backgroundColor: card.bg, padding: '18px', borderRadius: '12px', border: `1px solid ${card.border}`, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {card.label}
            </span>
            <div style={{ fontSize: '30px', fontWeight: 800, color: card.color, marginTop: '4px' }}>
              {card.value !== null && card.value !== undefined ? card.value : '...'}
            </div>
            <span style={{ fontSize: '12px', color: card.color, fontWeight: 500, opacity: 0.8 }}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Domain Breakdown */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
        Content Database Domains ({models.length} Entities)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {Object.entries(domainCounts).map(([domain, count]) => {
          const domainModels = models.filter((m) => m.domain === domain)
          return (
            <div key={domain} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>{domain}</h4>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                  {count} Records
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                {domainModels.length} managed entities
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {domainModels.map((m) => (
                  <span key={m.key} style={{ fontSize: '11.5px', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#334155' }}>
                    {m.class_name} ({m.count})
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Audit Activity Feed */}
      {analytics && analytics.recent_activity.length > 0 && (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Recent Activity
          </h3>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analytics.recent_activity.slice(0, 8).map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, minWidth: '60px', textAlign: 'center',
                    backgroundColor: log.action === 'CREATE' ? '#dcfce7' : log.action === 'UPDATE' ? '#dbeafe' : log.action === 'DELETE' ? '#fee2e2' : log.action === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                    color: log.action === 'CREATE' ? '#15803d' : log.action === 'UPDATE' ? '#1d4ed8' : log.action === 'DELETE' ? '#b91c1c' : log.action === 'APPROVED' ? '#15803d' : '#b45309',
                  }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#475569', flex: 1 }}>
                    {log.user_email || 'System'} &middot; {log.model_name} #{log.record_id}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button className="btn btn-sm btn-outline" onClick={() => onNavigateTab('audit')} style={{ fontSize: '12px' }}>
                View Full Audit Trail
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
