import { useState, useEffect } from 'react'
import { get, post, put, del } from '../../api/client'
import type { ModelMeta, PaginatedList } from '../../api/client'
import AdminRecordModal from './AdminRecordModal'
import { Empty, Skeleton } from '../../components/ui'

interface AdminDataTableProps {
  models: ModelMeta[]
  token: string
}

export default function AdminDataTable({ models, token }: AdminDataTableProps) {
  const [selectedModelKey, setSelectedModelKey] = useState<string>(models[0]?.key || '')
  const [data, setData] = useState<PaginatedList<Record<string, any>> | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [actionMsg, setActionMsg] = useState<string>('')

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  const activeModel = models.find((m) => m.key === selectedModelKey) || models[0]

  const loadRecords = async () => {
    if (!activeModel || !token) return
    setLoading(true)
    setError('')
    try {
      const path = `/admin/crud/${activeModel.key}?page=${page}&per_page=15${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }`
      const res = await get<PaginatedList<Record<string, any>>>(path, token)
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setSearch('')
  }, [selectedModelKey])

  useEffect(() => {
    loadRecords()
  }, [selectedModelKey, page, search, token])

  const handleCreate = () => {
    setEditingRecord(null)
    setModalOpen(true)
  }

  const handleEdit = (record: Record<string, any>) => {
    setEditingRecord(record)
    setModalOpen(true)
  }

  const handleDelete = async (id: any) => {
    if (!window.confirm(`Are you sure you want to delete record #${id} from ${activeModel.class_name}?`)) return
    setActionMsg('')
    try {
      await del(`/admin/crud/${activeModel.key}/${id}`, token)
      setActionMsg(`Record #${id} deleted successfully.`)
      loadRecords()
    } catch (err: any) {
      setError(err.message || 'Failed to delete record.')
    }
  }

  const handleSave = async (formData: Record<string, any>) => {
    setSaving(true)
    try {
      if (editingRecord) {
        await put(`/admin/crud/${activeModel.key}/${editingRecord.id}`, formData, token)
        setActionMsg(`Record #${editingRecord.id} updated successfully.`)
      } else {
        await post(`/admin/crud/${activeModel.key}`, formData, token)
        setActionMsg(`New ${activeModel.class_name} record created successfully.`)
      }
      setModalOpen(false)
      loadRecords()
    } finally {
      setSaving(false)
    }
  }

  // Group models by domain for the select dropdown
  const domainGroups: Record<string, ModelMeta[]> = {}
  models.forEach((m) => {
    const d = m.domain || 'General'
    if (!domainGroups[d]) domainGroups[d] = []
    domainGroups[d].push(m)
  })

  return (
    <div>
      {/* Top Toolbar: Model Selector + Search + Create Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              SELECT ENTITY / MODEL:
            </label>
            <select
              value={selectedModelKey}
              onChange={(e) => setSelectedModelKey(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                minWidth: '220px',
              }}
            >
              {Object.entries(domainGroups).map(([domain, group]) => (
                <optgroup key={domain} label={`--- ${domain.toUpperCase()} ---`}>
                  {group.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.class_name} ({m.count} records)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              SEARCH RECORDS:
            </label>
            <input
              type="text"
              placeholder={`Search ${activeModel?.class_name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>➕</span> Add New {activeModel?.class_name}
        </button>
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

      {/* Data Table */}
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
          <Empty big="📭" text={`No records found in ${activeModel?.class_name}.`} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  {activeModel.fields.slice(0, 6).map((f) => (
                    <th key={f.name} style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {f.name}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    {activeModel.fields.slice(0, 6).map((f) => {
                      const val = row[f.name]
                      return (
                        <td
                          key={f.name}
                          style={{
                            padding: '12px 16px',
                            color: '#1e293b',
                            maxWidth: '240px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {val === null || val === undefined
                            ? '-'
                            : typeof val === 'boolean'
                            ? val
                              ? '✓ True'
                              : '✕ False'
                            : String(val)}
                        </td>
                      )
                    })}
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(row)}
                        style={{ marginRight: '8px', padding: '4px 10px', fontSize: '12px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDelete(row.id)}
                        style={{ padding: '4px 10px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
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
              Showing page <strong>{data.page}</strong> of <strong>{data.pages}</strong> ({data.total} records total)
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

      {activeModel && (
        <AdminRecordModal
          model={activeModel}
          record={editingRecord}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
