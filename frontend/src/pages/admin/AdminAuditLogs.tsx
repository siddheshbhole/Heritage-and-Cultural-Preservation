import { useState, useEffect } from 'react'
import { get } from '../../api/client'
import type { AuditLogItem, PaginatedList } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'

interface AdminAuditLogsProps {
  token: string
}

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
      let path = `/admin/audit/?page=${page}&per_page=20`
      if (actionFilter) path += `&action=${actionFilter}`
      const res = await get<PaginatedList<AuditLogItem>>(path, token)
      setData(res)
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
    <div>
      {/* Header & Action Filters */}
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
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>System Audit Trail</h3>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Immutable record of administrative actions, resource modifications, and security events.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Filter Action:</span>
          {['', 'CREATE', 'UPDATE', 'DELETE', 'APPROVED', 'REJECTED'].map((act) => (
            <button
              key={act}
              className={`btn btn-sm ${actionFilter === act ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setActionFilter(act)
                setPage(1)
              }}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              {act === '' ? 'All Actions' : act}
            </button>
          ))}
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

      {/* Audit Log Table */}
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
          <div style={{ padding: '24px' }}>
            <Skeleton />
          </div>
        ) : !data || data.items.length === 0 ? (
          <Empty big="📜" text="No audit logs recorded matching criteria." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Administrator</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Model / Entity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Record ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Details / Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => {
                  const isCreate = log.action === 'CREATE'
                  const isUpdate = log.action === 'UPDATE'
                  const isDelete = log.action === 'DELETE'
                  const isApprove = log.action === 'APPROVED'

                  const badgeBg = isCreate
                    ? '#dcfce7'
                    : isUpdate
                    ? '#dbeafe'
                    : isDelete
                    ? '#fee2e2'
                    : isApprove
                    ? '#dcfce7'
                    : '#fef3c7'
                  const badgeColor = isCreate
                    ? '#15803d'
                    : isUpdate
                    ? '#1d4ed8'
                    : isDelete
                    ? '#b91c1c'
                    : isApprove
                    ? '#15803d'
                    : '#b45309'

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                        {log.user_email || log.user_id || 'System Admin'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500 }}>
                        <code>{log.model_name}</code>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>#{log.record_id}</td>
                      <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '360px', overflow: 'hidden' }}>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: '11.5px',
                            backgroundColor: '#f8fafc',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '80px',
                            overflowY: 'auto',
                          }}
                        >
                          {log.details || '{}'}
                        </pre>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            <div>
              Page <strong>{data.page}</strong> of <strong>{data.pages}</strong> ({data.total} audit entries)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-sm btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀ Previous
              </button>
              <button
                className="btn btn-sm btn-outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
