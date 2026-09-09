import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, patch, del } from '../api/client'
import type { AdminStats, CommunityPost, ModelMeta } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import AdminDashboardOverview from './admin/AdminDashboardOverview'
import AdminDataTable from './admin/AdminDataTable'
import AdminAuditLogs from './admin/AdminAuditLogs'

type TabType = 'overview' | 'crud' | 'moderation' | 'audit'

export default function Admin() {
  const { token, user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Overall stats & models metadata
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [models, setModels] = useState<ModelMeta[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Moderation state
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
    } catch (err: any) {
      const msg = err.message || 'Failed to load administrative metadata.'
      setError(msg)
    } finally {
      setLoading(false)
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
    if (activeTab === 'moderation') {
      loadModerationPosts()
    }
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

  return (
    <>
      <PageHead
        title="Ministry Platform Administration Portal"
        sub="Comprehensive management engine for heritage assets, community stories, user moderation, and audit compliance."
        crumbs={[{ label: 'Admin Dashboard' }]}
      />

      <div className="container" style={{ marginBottom: 60 }}>
        {/* User bar & Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '16px',
          }}
        >
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview & Analytics
            </button>
            <button
              className={`btn ${activeTab === 'crud' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('crud')}
            >
              📁 Data Management ({models.length} Entities)
            </button>
            <button
              className={`btn ${activeTab === 'moderation' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('moderation')}
              style={{ position: 'relative' }}
            >
              🛡️ Moderation Queue
              {stats && stats.pending_posts > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    backgroundColor: '#d97706',
                    color: '#fff',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {stats.pending_posts}
                </span>
              )}
            </button>
            <button
              className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('audit')}
            >
              📜 Audit Logs
            </button>
          </div>

          <div style={{ fontSize: '13.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>
              Logged in as: <strong>{user?.email || 'Administrator'}</strong>
            </span>
            <button className="btn btn-sm btn-outline" style={{ fontSize: 12 }} onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <AdminDashboardOverview stats={stats} models={models} onNavigateTab={(t) => setActiveTab(t)} />
        )}

        {/* Tab 2: Generic CRUD Data Management */}
        {activeTab === 'crud' && token && (
          <>
            {loading ? (
              <Skeleton />
            ) : models.length === 0 ? (
              <Empty big="📂" text="No database models available for management." />
            ) : (
              <AdminDataTable models={models} token={token} />
            )}
          </>
        )}

        {/* Tab 3: Moderation Queue */}
        {activeTab === 'moderation' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                Community Post Moderation Queue
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                  <button
                    key={st}
                    className={`btn btn-sm ${modFilter === st ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setModFilter(st)}
                  >
                    {st === 'PENDING' ? '⏳ Pending' : st === 'APPROVED' ? '✓ Approved' : st === 'REJECTED' ? '✕ Rejected' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {actionMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                ✓ {actionMsg}
              </div>
            )}

            {modLoading ? (
              <div className="card-grid">
                <Skeleton />
                <Skeleton />
              </div>
            ) : posts.length === 0 ? (
              <Empty big="🎉" text={`No ${modFilter.toLowerCase()} submissions in queue.`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: p.status === 'APPROVED' ? '#dcfce7' : p.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                            color: p.status === 'APPROVED' ? '#15803d' : p.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                            marginBottom: '6px',
                          }}
                        >
                          {p.status}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: '13px', color: '#64748b' }}>
                          Category: <strong>{p.kind}</strong>
                        </span>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#0f172a' }}>{p.title}</h3>
                      </div>

                      <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
                        <div>Author: <strong>{p.author_name}</strong></div>
                        <div>Submitted: {p.created_at}</div>
                      </div>
                    </div>

                    <p style={{ color: '#334155', fontSize: '14.5px', lineHeight: '1.6', margin: '0 0 16px 0', whiteSpace: 'pre-line' }}>
                      {p.content}
                    </p>

                    {(p.related_city || p.related_resource) && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {p.related_city && <span className="chip chip-green">📍 {p.related_city}</span>}
                        {p.related_resource && <span className="chip chip-green">🏷️ {p.related_resource}</span>}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                      {p.status !== 'APPROVED' && (
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                          onClick={() => handleStatusChange(p.id, 'APPROVED')}
                        >
                          ✓ Approve Post
                        </button>
                      )}
                      {p.status !== 'REJECTED' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => handleStatusChange(p.id, 'REJECTED')}
                        >
                          ✕ Reject
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: '#64748b', borderColor: '#cbd5e1', marginLeft: 'auto' }}
                        onClick={() => handleDeletePost(p.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && token && <AdminAuditLogs token={token} />}
      </div>
    </>
  )
}
