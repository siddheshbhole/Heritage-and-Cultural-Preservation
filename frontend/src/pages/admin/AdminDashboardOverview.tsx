import type { AdminStats, ModelMeta } from '../../api/client'

interface AdminDashboardOverviewProps {
  stats: AdminStats | null
  models: ModelMeta[]
  onNavigateTab: (tab: 'moderation' | 'crud' | 'audit') => void
}

export default function AdminDashboardOverview({
  stats,
  models,
  onNavigateTab,
}: AdminDashboardOverviewProps) {
  // Domain breakdown
  const domainCounts: Record<string, number> = {}
  models.forEach((m) => {
    const d = m.domain || 'General'
    domainCounts[d] = (domainCounts[d] || 0) + m.count
  })

  return (
    <div>
      {/* High-level Platform Metrics */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
        📊 Moderation & System Key Metrics
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          onClick={() => onNavigateTab('moderation')}
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pending Moderation
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {stats ? stats.pending_posts : '...'}
          </div>
          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>Requires review →</span>
        </div>

        <div
          onClick={() => onNavigateTab('moderation')}
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Approved Submissions
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {stats ? stats.approved_posts : '...'}
          </div>
          <span style={{ fontSize: '12px', color: '#047857', fontWeight: 500 }}>Live community stories</span>
        </div>

        <div
          onClick={() => onNavigateTab('crud')}
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Heritage Sites
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#1d4ed8', marginTop: '6px' }}>
            {stats ? stats.heritage_sites : '...'}
          </div>
          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>Tangible & Intangible records</span>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            System Audit Trail
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#6b21a8', marginTop: '6px' }}>
            {stats ? stats.audit_logs_count : '...'}
          </div>
          <span style={{ fontSize: '12px', color: '#7e22ce', fontWeight: 500 }}>Logged security events</span>
        </div>
      </div>

      {/* Database Entity Domain Breakdown */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
        📁 Content Database Managed Domains (36 Entities)
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {Object.entries(domainCounts).map(([domain, count]) => {
          const domainModels = models.filter((m) => m.domain === domain)
          return (
            <div
              key={domain}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>{domain} Domain</h4>
                <span className="chip chip-blue" style={{ fontSize: '12px' }}>
                  {count} Records
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                Contains {domainModels.length} managed entities:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {domainModels.map((m) => (
                  <span
                    key={m.key}
                    style={{
                      fontSize: '11.5px',
                      backgroundColor: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      color: '#334155',
                    }}
                  >
                    {m.class_name} ({m.count})
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
