import { useState, useEffect } from 'react'
import { get, put } from '../../api/client'
import type { ModelMeta, PaginatedList, Heritage } from '../../api/client'
import { Empty, Skeleton } from '../../components/ui'
import AdminRecordModal from './AdminRecordModal'

interface AdminHeritageSitesProps {
  token: string
  models: ModelMeta[]
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
      let path = `/admin/crud/heritage_sites?page=${page}&per_page=20&sort_by=${sortBy}&order=${sortOrder}`
      if (search) path += `&search=${encodeURIComponent(search)}`
      const res = await get<PaginatedList<Record<string, any>>>(path, token)
      setData(res)
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
    if (!heritageModel) return
    setSaving(true)
    try {
      if (editingRecord) {
        await put(`/admin/crud/heritage_sites/${editingRecord.id}`, formData, token)
        setActionMsg(`Heritage site #${editingRecord.id} updated successfully.`)
      }
      setModalOpen(false)
      loadSites()
    } catch (err: any) {
      setError(err.message || 'Failed to save record.')
    } finally {
      setSaving(false)
    }
  }

  // Client-side filter for UNESCO status (applied on current page data)
  const filteredItems = data?.items.filter((item) => {
    if (filterUnesco && item.unesco_status !== filterUnesco) return false
    if (filterCategory && item.category !== filterCategory) return false
    return true
  }) || []

  // Extract unique categories from data
  const categories = [...new Set(data?.items.map((i) => i.category).filter(Boolean) || [])]

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
            Heritage Site Management
          </h3>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Quick search, filter, and manage heritage site records.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '180px' }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterUnesco}
            onChange={(e) => setFilterUnesco(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
          >
            <option value="">All UNESCO Status</option>
            <option value="WORLD">World Heritage</option>
            <option value="TENTATIVE">Tentative List</option>
            <option value="NOMINATED">Nominated</option>
            <option value="INTANGIBLE">Intangible</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
          >
            <option value="id">Sort by ID</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            style={{ fontSize: '12px' }}
          >
            {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '24px' }}><Skeleton /></div>
        ) : filteredItems.length === 0 ? (
          <Empty big="🏛️" text="No heritage sites found matching criteria." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Heritage Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>UNESCO</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Region</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((site, idx) => (
                  <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>#{site.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {site.name || '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }}>
                        {site.category || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{site.heritage_type || '-'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {site.unesco_status ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: site.unesco_status === 'WORLD' ? '#dcfce7' : '#dbeafe',
                          color: site.unesco_status === 'WORLD' ? '#15803d' : '#1d4ed8',
                        }}>
                          {site.unesco_status}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{site.region || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => { setEditingRecord(site); setModalOpen(true); }}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
            <div>Page <strong>{data.page}</strong> of <strong>{data.pages}</strong> ({data.total} sites)</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="btn btn-sm btn-outline" disabled={page >= data.pages} onClick={() => setPage((p) => Math.min(data.pages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>

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
