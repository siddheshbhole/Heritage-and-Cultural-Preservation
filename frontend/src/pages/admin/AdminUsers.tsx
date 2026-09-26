import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AdminUsersResponse } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'
import { AdminIcon } from './AdminIcons'
import { AdminNotice, AdminPanelHead } from './AdminUI'

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
      setData(await get<AdminUsersResponse>('/admin/users', token))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [token])

  const query = search.trim().toLowerCase()
  const authors = data ? data.authors.filter((a) => a.author_name.toLowerCase().includes(query)) : []

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="User & Contributor Management"
        sub="Active platform contributors based on community post submissions."
        actions={
          data && (
            <div className="admin-counts">
              <span>
                <b>{data.total_unique_authors.toLocaleString('en-IN')}</b> authors
              </span>
              <span>
                <b>{data.supabase_users_with_posts.toLocaleString('en-IN')}</b> linked users
              </span>
            </div>
          )
        }
      />

      <div className="admin-toolbar">
        <div className="admin-field admin-field-grow">
          <label htmlFor="admin-author-search">Search Authors</label>
          <input
            id="admin-author-search"
            className="input"
            type="text"
            placeholder="Filter by author name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>Showing</label>
          <span className="admin-hint">
            {authors.length.toLocaleString('en-IN')} of{' '}
            {(data ? data.authors.length : 0).toLocaleString('en-IN')} contributors
          </span>
        </div>
      </div>

      {error && (
        <div className="admin-panel-pad">
          <AdminNotice tone="error">{error}</AdminNotice>
        </div>
      )}

      {loading ? (
        <div className="admin-panel-pad">
          <Skeleton style={{ height: 220 }} />
        </div>
      ) : authors.length === 0 ? (
        <Empty
          big={<AdminIcon name="users" size={40} strokeWidth={1.3} />}
          text={query ? `No contributors matching "${search}".` : 'No contributors found.'}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th className="cell-num">Total Posts</th>
                <th className="cell-num">Approved</th>
                <th className="cell-num">Pending</th>
                <th className="cell-num">Rejected</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.author_name}>
                  <td style={{ fontWeight: 600 }}>{author.author_name}</td>
                  <td className="cell-num" style={{ color: 'var(--maroon)' }}>
                    {author.total_posts.toLocaleString('en-IN')}
                  </td>
                  <td className="cell-num">
                    <span className="admin-badge admin-badge-approved">
                      {author.approved_posts.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="cell-num">
                    <span className="admin-badge admin-badge-pending">
                      {author.pending_posts.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="cell-num">
                    <span className="admin-badge admin-badge-rejected">
                      {author.rejected_posts.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>
                    {author.last_active ? new Date(author.last_active).toLocaleDateString() : 'Not available'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
