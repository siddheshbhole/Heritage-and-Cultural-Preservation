import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AdminUsersResponse } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'

interface AdminUsersProps {
  token: string
}

export default function AdminUsers({ token }: AdminUsersProps) {
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const loadUsers = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await get<AdminUsersResponse>('/admin/users', token)
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [token])

  const filteredAuthors = data?.authors.filter(
    (a) =>
      a.author_name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
            User & Contributor Management
          </h3>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Active platform contributors based on community post submissions.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {data && (
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b' }}>
              <span><strong>{data.total_unique_authors}</strong> authors</span>
              <span><strong>{data.supabase_users_with_posts}</strong> linked users</span>
            </div>
          )}
          <input
            type="text"
            placeholder="Search authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              minWidth: '200px',
            }}
          />
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
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: '24px' }}><Skeleton /></div>
        ) : filteredAuthors.length === 0 ? (
          <Empty big="👤" text="No contributors found." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Author</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Total Posts</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Approved</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Pending</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Rejected</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthors.map((author, idx) => (
                  <tr
                    key={author.author_name}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {author.author_name}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#1d4ed8' }}>
                      {author.total_posts}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                        {author.approved_posts}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309' }}>
                        {author.pending_posts}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        {author.rejected_posts}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                      {author.last_active ? new Date(author.last_active).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
