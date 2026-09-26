import { useState, useEffect } from 'react'
import { get, put } from '../../api/client'
import type { ModelMeta, PaginatedList } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'
import { AdminIcon } from './AdminIcons'
import { AdminNotice, AdminPager, AdminPanelHead } from './AdminUI'
import AdminRecordModal from './AdminRecordModal'

interface AdminHeritageSitesProps {
  token: string
  models: ModelMeta[]
}

const UNESCO_OPTIONS = ['WORLD', 'TENTATIVE', 'NOMINATED', 'INTANGIBLE']

function unescoClass(status: string): string {
  return status === 'WORLD' ? 'admin-badge admin-badge-approved' : 'admin-badge admin-badge-info'
}

export default function AdminHeritageSites({ token, models }: AdminHeritageSitesProps) {
  const [data, setData] = useState<PaginatedList<Record<string, any>> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [sortBy, setSortBy] = useState<string>('id')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterUnesco, setFilterUnesco] = useState<string>('')
  const [actionMsg, setActionMsg] = useState<string>('')

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  const heritageModel = models.find((m) => m.key === 'heritage_sites')

  const loadSites = async () => {
    if (!token || !heritageModel) return
    setLoading(true)
    setError('')
    try {
      const query = search ? `&search=${encodeURIComponent(search)}` : ''
      setData(
        await get<PaginatedList<Record<string, any>>>(
          `/admin/crud/heritage_sites?page=${page}&per_page=20&sort_by=${sortBy}&order=${sortOrder}${query}`,
          token,
        ),
      )
    } catch (err: any) {
      setError(err.message || 'Failed to load heritage sites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, filterCategory, filterUnesco, sortBy, sortOrder])

  useEffect(() => {
    loadSites()
  }, [page, search, sortBy, sortOrder, token])

  const handleSave = async (formData: Record<string, any>) => {
    if (!editingRecord) return
    setSaving(true)
    try {
      await put(`/admin/crud/heritage_sites/${editingRecord.id}`, formData, token)
      setActionMsg(`Heritage site #${editingRecord.id} updated successfully.`)
      setModalOpen(false)
      loadSites()
    } catch (err: any) {
      setError(err.message || 'Failed to save record.')
    } finally {
      setSaving(false)
    }
  }

  // Client-side filters apply to the rows on the current page only.
  const filteredItems =
    data?.items.filter((item) => {
      if (filterUnesco && item.unesco_status !== filterUnesco) return false
      if (filterCategory && item.category !== filterCategory) return false
      return true
    }) || []

  const categories = [...new Set(data?.items.map((i) => i.category).filter(Boolean) || [])].sort()

  return (
    <div className="admin-panel">
      <AdminPanelHead
        title="Heritage Site Management"
        sub="Quick search, filter, and manage heritage site records."
        actions={
          data && (
            <div className="admin-counts">
              <span>
                <b>{data.total.toLocaleString('en-IN')}</b> sites
              </span>
            </div>
          )
        }
      />

      <div className="admin-toolbar">
        <div className="admin-field admin-field-grow">
          <label htmlFor="heritage-search">Search</label>
          <input
            id="heritage-search"
            className="input"
            type="text"
            placeholder="Search sites by name or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="heritage-category">Category</label>
          <select
            id="heritage-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="heritage-unesco">UNESCO Status</label>
          <select
            id="heritage-unesco"
            value={filterUnesco}
            onChange={(e) => setFilterUnesco(e.target.value)}
          >
            <option value="">All UNESCO Status</option>
            {UNESCO_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="heritage-sort">Sort</label>
          <div className="admin-filters">
            <select id="heritage-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="id">Sort by ID</option>
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
            </select>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              title={`Currently sorted ${sortOrder === 'desc' ? 'descending' : 'ascending'}`}
            >
              <AdminIcon name="sort" size={14} />
              {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-panel-pad">
        {actionMsg && <AdminNotice tone="success">{actionMsg}</AdminNotice>}
        {error && <AdminNotice tone="error">{error}</AdminNotice>}
      </div>

      {loading ? (
        <div className="admin-panel-pad">
          <Skeleton style={{ height: 240 }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <Empty
          big={<AdminIcon name="heritage" size={40} strokeWidth={1.3} />}
          text="No heritage sites found matching criteria."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Heritage Type</th>
                <th>UNESCO</th>
                <th>Region</th>
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((site) => (
                <tr key={site.id}>
                  <td style={{ color: 'var(--muted)' }}>#{site.id}</td>
                  <td className="cell-clip" style={{ fontWeight: 600 }} title={site.name || ''}>
                    {site.name || 'Not available'}
                  </td>
                  <td>
                    {site.category ? (
                      <span className="admin-tag" style={{ margin: 0 }}>
                        {site.category}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>Not available</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{site.heritage_type || 'Not available'}</td>
                  <td>
                    {site.unesco_status ? (
                      <span className={unescoClass(site.unesco_status)}>{site.unesco_status}</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>Not available</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{site.region || 'Not available'}</td>
                  <td className="cell-actions">
                    <button
                      className="admin-icon-btn"
                      title={`Edit ${site.name || `site #${site.id}`}`}
                      onClick={() => {
                        setEditingRecord(site)
                        setModalOpen(true)
                      }}
                    >
                      <AdminIcon name="pencil" size={15} />
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
          unit="sites"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data.pages, p + 1))}
        />
      )}

      {heritageModel && (
        <AdminRecordModal
          model={heritageModel}
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
