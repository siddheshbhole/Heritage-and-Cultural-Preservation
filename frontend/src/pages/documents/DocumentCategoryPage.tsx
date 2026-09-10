import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useFetch, withQuery } from '../../api/hooks'
import type { DocumentCategory, DocumentItem, PaginatedList } from '../../api/client'
import { PageHead } from '../_shared'
import { Empty, Skeleton } from '../../components/ui'
import DocumentViewerModal from '../../components/DocumentViewerModal'
import { DOCUMENT_ICONS, formatDate } from './DocumentsHome'

const PAGE_SIZE = 12

export default function DocumentCategoryPage() {
  const { categorySlug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const q = params.get('search') ?? ''
  const sort = params.get('sort_by') ?? 'newest'
  const page = Number(params.get('page') ?? '1') || 1

  const [qInput, setQInput] = useState(q)
  const [viewer, setViewer] = useState<DocumentItem | null>(null)

  useEffect(() => setQInput(q), [q])

  const cats = useFetch<DocumentCategory[]>('/documents/categories')
  const list = useFetch<PaginatedList<DocumentItem>>(
    withQuery('/documents', { category: categorySlug, search: q, sort_by: sort, page, per_page: PAGE_SIZE })
  )

  const cat = cats.data?.find((c) => c.slug === categorySlug)
  const totalPages = Math.max(1, list.data?.pages ?? 1)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHead
        title={cat ? `${DOCUMENT_ICONS[cat.slug] || '📄'} ${cat.name}` : 'Ministry of Culture Documents'}
        sub={cat?.description}
        crumbs={[{ label: 'Documents', to: '/documents' }, { label: categorySlug }]}
      />

      {viewer && (
        <DocumentViewerModal
          item={viewer}
          title={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search in this category…"
            value={qInput}
            aria-label="Search in category"
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('search', qInput.trim())
            }}
          />
          <button className="btn btn-primary" onClick={() => setParam('search', qInput.trim())}>Search</button>
          <select
            className="filter-select"
            value={sort}
            aria-label="Sort documents"
            onChange={(e) => setParam('sort_by', e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
          {list.data && <span className="muted small">{list.data.total} documents</span>}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {list.loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : !list.data || list.data.items.length === 0 ? (
          <Empty big="📂" text="No documents found in this category." error={list.error} onRetry={list.reload} />
        ) : (
          <div className="feed">
            {list.data.items.map((d) => (
              <div className="feed-item" key={d.id}>
                <div className="feed-head">
                  <span className="chip chip-outline">{d.file_type.toUpperCase()}</span>
                  <span className="muted small">{formatDate(d.published_date)}</span>
                  <span className="muted small">{formatBytes(d.file_size)}</span>
                </div>
                <b>{d.title}</b>
                <div className="feed-actions">
                  <button type="button" className="link-btn" onClick={() => setViewer(d)}>Read document →</button>
                  {d.file_url && (
                    <a href={d.file_url} target="_blank" rel="noreferrer">Open in new tab ↗</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination" aria-label="Document pages">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              ← Prev
            </button>
            <span className="muted small">Page {page} of {totalPages}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={page >= totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}