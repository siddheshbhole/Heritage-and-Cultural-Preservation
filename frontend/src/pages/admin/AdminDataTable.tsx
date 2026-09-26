import { useState, useEffect } from 'react'
import { get, post, put, del } from '../../api/client'
import type { ModelMeta, PaginatedList } from '../../api/client'
import AdminRecordModal from './AdminRecordModal'
import { Empty, Skeleton } from '../../components/ui'
import { AdminIcon } from './AdminIcons'
import { AdminNotice, AdminPager, AdminPanelHead } from './AdminUI'

interface AdminDataTableProps {
  models: ModelMeta[]
  token: string
  /**
   * When set, the browser jumps to this model key. Dashboard quick actions use
   * it to land on the right entity instead of dropping the admin on the first
   * model in the registry.
   */
  initialModelKey?: string | null
  /** Open the create form immediately, e.g. for an "Add ..." quick action. */
  openCreateOnMount?: boolean
}

const VISIBLE_COLUMNS = 6

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not available'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AdminDataTable({
  models,
  token,
  initialModelKey = null,
  openCreateOnMount = false,
}: AdminDataTableProps) {
  const resolveInitial = () => {
    if (initialModelKey && models.some((m) => m.key === initialModelKey)) {
      return initialModelKey
    }
    return models[0]?.key || ''
  }
  const [selectedModelKey, setSelectedModelKey] = useState<string>(resolveInitial)
  const [data, setData] = useState<PaginatedList<Record<string, any>> | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [actionMsg, setActionMsg] = useState<string>('')

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  const activeModel = models.find((m) => m.key === selectedModelKey) || models[0]
  const columns = activeModel ? activeModel.fields.slice(0, VISIBLE_COLUMNS) : []

  // A quick action re-selects the model while the tab is already mounted, so the
  // request must react to the prop rather than only to the initial state.
  useEffect(() => {
    if (!initialModelKey) return
    if (!models.some((m) => m.key === initialModelKey)) return
    setSelectedModelKey(initialModelKey)
    setPage(1)
    setSearch('')
    if (openCreateOnMount) {
      setEditingRecord(null)
      setModalOpen(true)
    }
  }, [initialModelKey, openCreateOnMount, models])

  const loadRecords = async () => {
    if (!activeModel || !token) return
    setLoading(true)
    setError('')
    try {
      const query = search ? `&search=${encodeURIComponent(search)}` : ''
      setData(
        await get<PaginatedList<Record<string, any>>>(
          `/admin/crud/${activeModel.key}?page=${page}&per_page=15${query}`,
          token,
        ),
      )
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

  const handleDelete = async (id: any) => {
    if (!activeModel) return
    if (!window.confirm(`Delete record #${id} from ${activeModel.class_name}?`)) return
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
    if (!activeModel) return
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
    } catch (err: any) {
      setError(err.message || 'Failed to save record.')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const domainGroups: Record<string, ModelMeta[]> = {}
  models.forEach((m) => {
    const d = m.domain || 'General'
    if (!domainGroups[d]) domainGroups[d] = []
    domainGroups[d].push(m)
  })

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="Data Browser"
        sub="Direct read and write access to every managed database entity."
        actions={
          activeModel && (
            <div className="admin-counts">
              <span>
                <b>{activeModel.count.toLocaleString('en-IN')}</b> rows in {activeModel.class_name}
              </span>
            </div>
          )
        }
      />

      <div className="admin-toolbar">
        <div className="admin-field">
          <label htmlFor="crud-model">Entity / Model</label>
          <select
            id="crud-model"
            value={selectedModelKey}
            onChange={(e) => setSelectedModelKey(e.target.value)}
          >
            {Object.entries(domainGroups).map(([domain, group]) => (
              <optgroup key={domain} label={domain}>
                {group.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.class_name} ({m.count.toLocaleString('en-IN')})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="admin-field admin-field-grow">
          <label htmlFor="crud-search">Search Records</label>
          <input
            id="crud-search"
            className="input"
            type="text"
            placeholder={activeModel ? `Search ${activeModel.class_name}` : 'Search records'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreate}>
          <AdminIcon name="plus" size={15} /> Add New {activeModel?.class_name}
        </button>
      </div>

      <div className="admin-panel-pad">
        {actionMsg && <AdminNotice tone="success">{actionMsg}</AdminNotice>}
        {error && <AdminNotice tone="error">{error}</AdminNotice>}
      </div>

      {loading ? (
        <div className="admin-panel-pad">
          <Skeleton style={{ height: 240 }} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty
          big={<AdminIcon name="inbox" size={40} strokeWidth={1.3} />}
          text={`No records found in ${activeModel?.class_name}.`}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((f) => (
                  <th key={f.name}>{f.name}</th>
                ))}
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {columns.map((f) => {
                    const raw = formatCell(row[f.name])
                    return (
                      <td key={f.name} className="cell-clip" title={raw}>
                        {raw}
                      </td>
                    )
                  })}
                  <td className="cell-actions">
                    <button
                      className="admin-icon-btn"
                      title={`Edit record #${row.id}`}
                      onClick={() => {
                        setEditingRecord(row)
                        setModalOpen(true)
                      }}
                    >
                      <AdminIcon name="pencil" size={15} />
                    </button>{' '}
                    <button
                      className="admin-icon-btn danger"
                      title={`Delete record #${row.id}`}
                      onClick={() => handleDelete(row.id)}
                    >
                      <AdminIcon name="trash" size={15} />
                    </button>
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
          unit="records"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data.pages, p + 1))}
        />
      )}

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
