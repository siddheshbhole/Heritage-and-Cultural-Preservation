import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, patch, del } from '../api/client'
import type { AdminStats, AdminAnalytics as AdminAnalyticsData, CommunityPost, ModelMeta, AdminHealth } from '../api/client'
import { getAdminHealth } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import { AdminIcon } from './admin/AdminIcons'
import type { AdminIconName } from './admin/AdminIcons'
import { AdminNotice } from './admin/AdminUI'
import AdminDashboardOverview from './admin/AdminDashboardOverview'
import AdminDataTable from './admin/AdminDataTable'
import AdminAuditLogs from './admin/AdminAuditLogs'
import AdminUsers from './admin/AdminUsers'
import AdminHeritageSites from './admin/AdminHeritageSites'
import AdminAnalytics from './admin/AdminAnalytics'
import AdminPlatformMatrix from './admin/AdminPlatformMatrix'

type TabType = 'overview' | 'matrix' | 'heritage' | 'moderation' | 'analytics' | 'users' | 'audit' | 'crud'

const SIDEBAR_ITEMS: { key: TabType; label: string; icon: AdminIconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'matrix', label: 'Platform Matrix', icon: 'matrix' },
  { key: 'heritage', label: 'Heritage Sites', icon: 'heritage' },
  { key: 'moderation', label: 'Moderation', icon: 'moderation' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'audit', label: 'Audit Logs', icon: 'audit' },
  { key: 'crud', label: 'Data Browser', icon: 'database' },
]

const MODERATION_FILTERS: { key: string; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
]

export default function Admin() {
  const { token, user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null)
  const [models, setModels] = useState<ModelMeta[]>([])
  const [health, setHealth] = useState<AdminHealth | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  /** Quick-action target: model key to open in the data browser, if any. */
  const [crudTarget, setCrudTarget] = useState<{ key: string; create: boolean } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [modFilter, setModFilter] = useState<string>('PENDING')
  const [modLoading, setModLoading] = useState<boolean>(false)
  const [actionMsg, setActionMsg] = useState<string>('')

  const loadInitData = async () => {
    if (!token) {
      setError('No authentication token found. Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [s, m] = await Promise.all([
        get<AdminStats>('/admin/stats', token),
        get<ModelMeta[]>('/admin/crud/models', token),
      ])
      setStats(s)
      setModels(m)
      // Stamped only after a successful load, so "last updated" never claims a
      // freshness the payload did not actually have.
      setLastSync(new Date().toISOString())
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative metadata.')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!token) return
    try {
      const a = await get<AdminAnalyticsData>('/admin/analytics', token)
      setAnalytics(a)
    } catch {
      // Non-critical; the Analytics tab surfaces its own error state.
    }
  }

  const loadHealth = async () => {
    if (!token) return
    try {
      setHealth(await getAdminHealth(token))
    } catch {
      // Leave the panel to report an unreachable probe rather than guessing.
      setHealth(null)
    }
  }

  const loadModerationPosts = async () => {
    if (!token) return
    setModLoading(true)
    try {
      const p = await get<CommunityPost[]>(`/admin/posts?status_filter=${modFilter}`, token)
      setPosts(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load community submissions.')
    } finally {
      setModLoading(false)
    }
  }

  useEffect(() => {
    loadInitData()
  }, [token])

  useEffect(() => {
    if (activeTab === 'moderation') loadModerationPosts()
    if (activeTab === 'analytics' || activeTab === 'overview') loadAnalytics()
    if (activeTab === 'overview') loadHealth()
  }, [activeTab, modFilter, token])

  const handleStatusChange = async (postId: number, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!token) return
    setActionMsg('')
    try {
      await patch(`/admin/posts/${postId}`, { status: newStatus }, token)
      setActionMsg(`Post #${postId} marked as ${newStatus.toLowerCase()}.`)
      loadModerationPosts()
      loadInitData()
    } catch (err: any) {
      setError(err.message || 'Moderation action failed.')
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!token || !window.confirm(`Permanently delete post #${postId}?`)) return
    setActionMsg('')
    try {
      await del(`/admin/posts/${postId}`, token)
      setActionMsg(`Post #${postId} deleted successfully.`)
      loadModerationPosts()
      loadInitData()
    } catch (err: any) {
      setError(err.message || 'Delete post failed.')
    }
  }

  const pendingCount = stats ? stats.pending_posts : 0

  return (
    <>
      <PageHead
        title="Ministry Platform Administration Portal"
        sub="Comprehensive management engine for heritage assets, community stories, user moderation, and audit compliance."
        crumbs={[{ label: 'Admin Dashboard' }]}
      />

      <div className="container admin-shell">
        <nav className="admin-nav" aria-label="Administration sections">
          <div className="admin-nav-head">
            <div className="an-title">
              <AdminIcon name="shield" size={16} />
              <span>Administration</span>
            </div>
            <div className="an-mail">{user?.email || 'Signed in as administrator'}</div>
          </div>

          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`admin-nav-item${activeTab === item.key ? ' active' : ''}`}
              aria-current={activeTab === item.key ? 'page' : undefined}
            >
              <AdminIcon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.key === 'moderation' && pendingCount > 0 && (
                <span className="an-badge">{pendingCount}</span>
              )}
            </button>
          ))}

          <div className="admin-nav-foot">
            <button type="button" onClick={() => signOut()} className="admin-nav-item danger">
              <AdminIcon name="signOut" size={17} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        <div style={{ minWidth: 0 }}>
          {error && <AdminNotice tone="error">{error}</AdminNotice>}

          {activeTab === 'overview' && (
            <AdminDashboardOverview
              stats={stats}
              models={models}
              analytics={analytics}
              health={health}
              lastSync={lastSync}
              loading={loading}
              onNavigateTab={(t) => setActiveTab(t)}
              onQuickAction={(key, create) => {
                setCrudTarget({ key, create })
                setActiveTab('crud')
              }}
            />
          )}

          {activeTab === 'matrix' && <AdminPlatformMatrix stats={stats} loading={loading} />}

          {activeTab === 'heritage' && token && (
            <AdminHeritageSites token={token} models={models} />
          )}

          {activeTab === 'moderation' && (
            <div className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h3 className="admin-panel-title">Community Post Moderation Queue</h3>
                  <span className="admin-panel-sub">
                    Review, approve or reject submissions from citizens and community authors.
                  </span>
                </div>
                <div className="admin-filters">
                  {MODERATION_FILTERS.map((st) => (
                    <button
                      key={st.key}
                      className={`btn btn-sm ${modFilter === st.key ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setModFilter(st.key)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-panel-pad">
                {actionMsg && <AdminNotice tone="success">{actionMsg}</AdminNotice>}

                {modLoading ? (
                  <div className="card-grid">
                    <Skeleton />
                    <Skeleton />
                  </div>
                ) : posts.length === 0 ? (
                  <Empty
                    big={<AdminIcon name="inbox" size={40} strokeWidth={1.3} />}
                    text={`No ${modFilter.toLowerCase()} submissions.`}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {posts.map((p) => (
                      <article key={p.id} className="admin-domain">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                          <div>
                            <span className={statusBadgeClass(p.status)}>{p.status}</span>
                            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--muted)' }}>
                              Category: <strong>{p.kind}</strong>
                            </span>
                            <h3 style={{ margin: '6px 0 0 0', fontSize: 17, color: 'var(--indigo-deep)' }}>
                              {p.title}
                            </h3>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'right' }}>
                            <div>
                              Author: <strong>{p.author_name}</strong>
                            </div>
                            <div>Submitted: {formatDate(p.created_at)}</div>
                          </div>
                        </div>

                        <p style={{ color: 'var(--indigo-deep)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 14px 0', whiteSpace: 'pre-line' }}>
                          {p.content}
                        </p>

                        {(p.related_city || p.related_resource) && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            {p.related_city && <span className="chip chip-green">{p.related_city}</span>}
                            {p.related_resource && <span className="chip chip-green">{p.related_resource}</span>}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                          {p.status !== 'APPROVED' && (
                            <button className="btn btn-sm btn-approve" onClick={() => handleStatusChange(p.id, 'APPROVED')}>
                              <AdminIcon name="check" size={14} /> Approve
                            </button>
                          )}
                          {p.status !== 'REJECTED' && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleStatusChange(p.id, 'REJECTED')}>
                              <AdminIcon name="cross" size={14} /> Reject
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ marginLeft: 'auto', color: 'var(--muted)' }}
                            onClick={() => handleDeletePost(p.id)}
                          >
                            <AdminIcon name="trash" size={14} /> Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && token && <AdminAnalytics token={token} />}

          {activeTab === 'users' && token && <AdminUsers token={token} />}

          {activeTab === 'audit' && token && <AdminAuditLogs token={token} />}

          {activeTab === 'crud' && token && (
            <>
              {loading ? (
                <Skeleton />
              ) : models.length === 0 ? (
                <div className="admin-panel admin-panel-pad">
                  <Empty big={<AdminIcon name="database" size={40} strokeWidth={1.3} />} text="No database models available for management." />
                </div>
              ) : (
                <AdminDataTable
                  models={models}
                  token={token}
                  initialModelKey={crudTarget?.key ?? null}
                  openCreateOnMount={crudTarget?.create ?? false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'admin-badge admin-badge-approved'
    case 'REJECTED':
      return 'admin-badge admin-badge-rejected'
    default:
      return 'admin-badge admin-badge-pending'
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}
