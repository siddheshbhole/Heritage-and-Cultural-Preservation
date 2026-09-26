import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AuditLogItem, PaginatedList } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'
import { AdminIcon } from './AdminIcons'
import { AdminNotice, AdminPager, AdminPanelHead, adminStatusClass } from './AdminUI'

interface AdminAuditLogsProps {
  token: string
}

const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'APPROVED', 'REJECTED']

export default function AdminAuditLogs({ token }: AdminAuditLogsProps) {
  const [data, setData] = useState<PaginatedList<AuditLogItem> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [actionFilter, setActionFilter] = useState<string>('')

  const loadLogs = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const filter = actionFilter ? `&action=${actionFilter}` : ''
      setData(
        await get<PaginatedList<AuditLogItem>>(
          `/admin/audit/?page=${page}&per_page=20${filter}`,
          token,
        ),
      )
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [page, actionFilter, token])

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="System Audit Trail"
        sub="Immutable record of administrative actions, resource modifications, and security events."
        actions={
          data && (
            <div className="admin-counts">
              <span>
                <b>{data.total.toLocaleString('en-IN')}</b> entries
              </span>
            </div>
          )
        }
      />

      <div className="admin-toolbar">
        <div className="admin-field">
          <label>Filter Action</label>
          <div className="admin-filters">
            {ACTIONS.map((act) => (
              <button
                key={act || 'all'}
                className={`btn btn-sm ${actionFilter === act ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setActionFilter(act)
                  setPage(1)
                }}
              >
                {act === '' ? 'All Actions' : act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-panel-pad">
          <AdminNotice tone="error">{error}</AdminNotice>
        </div>
      )}

      {loading ? (
        <div className="admin-panel-pad">
          <Skeleton style={{ height: 240 }} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty
          big={<AdminIcon name="audit" size={40} strokeWidth={1.3} />}
          text="No audit logs recorded matching criteria."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Model / Entity</th>
                <th>Record ID</th>
                <th>Details / Payload</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Not available'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.user_email || log.user_id || 'System Admin'}</td>
                  <td>
                    <span className={adminStatusClass(log.action)}>{log.action}</span>
                  </td>
                  <td>
                    <code>{log.model_name}</code>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>#{log.record_id}</td>
                  <td>
                    <pre>{log.details || '{}'}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <AdminPager
          page={data.page}
          pages={data.pages}
          total={data.total}
          unit="audit entries"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data.pages, p + 1))}
        />
      )}
    </div>
  )
}
