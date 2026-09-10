import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFetch, withQuery } from '../../api/hooks'
import type { DocumentCategory, DocumentItem, PaginatedList } from '../../api/client'
import { PageHead } from '../_shared'
import { Empty, Skeleton } from '../../components/ui'
import DocumentViewerModal from '../../components/DocumentViewerModal'

export const DOCUMENT_ICONS: Record<string, string> = {
  reports: '📊',
  'act-and-policies': '⚖️',
  'circular-orders-notices': '📢',
  publications: '📖',
  'mou-others': '🤝',
  'press-release': '📰',
  'gazettes-notifications': '📜',
  guidelines: '📋',
  'e-sanskriti': '🪔',
  schemes: '🏛️',
}

export function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsHome() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [viewer, setViewer] = useState<DocumentItem | null>(null)

  const categories = useFetch<DocumentCategory[]>('/documents/categories')
  const recent = useFetch<PaginatedList<DocumentItem>>('/documents?sort_by=newest&per_page=6')

  return (
    <>
      <PageHead
        title="Ministry of Culture — Official Documents"
        sub="Reports, acts & policies, publications, press releases, gazettes, guidelines and scheme documents of the Ministry of Culture, Government of India."
        crumbs={[{ label: 'Documents' }]}
      />

      {viewer && (
        <DocumentViewerModal
          item={viewer}
          title={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}

      <div className="container" style={{ marginBottom: 16 }}>
        <div className="filters">
          <input
            className="input"
            style={{ maxWidth: 420 }}
            placeholder="Search official documents…"
            value={q}
            aria-label="Search documents"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) {
                navigate(withQuery('/documents', { search: q.trim() }))
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => navigate(withQuery('/documents', { search: q.trim() }))}
          >
            Search
          </button>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        <div className="section-head">
          <h2>Browse by Category</h2>
          <span className="muted small">{categories.data ? `${categories.data.length} categories` : ''}</span>
        </div>
        {categories.loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : !categories.data || categories.data.length === 0 ? (
          <Empty big="📂" text="Document categories aren’t available yet." error={categories.error} onRetry={categories.reload} />
        ) : (
          <div className="card-grid">
            {categories.data.map((c) => (
              <Link to={`/documents/${c.slug}`} className="doc-card" key={c.slug}>
                <div className="doc-card-head">
                  <span className="doc-card-icon" aria-hidden>{DOCUMENT_ICONS[c.slug] || '📄'}</span>
                  <span className="chip chip-outline">{c.count} files</span>
                </div>
                <b className="doc-card-title">{c.name}</b>
                {c.description && <p className="muted doc-card-desc">{c.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="container" style={{ marginBottom: 52 }}>
        <div className="section-head">
          <h2>Recent Documents</h2>
          <Link to="/documents" className="muted small">View all →</Link>
        </div>
        {recent.loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /></div>
        ) : !recent.data || recent.data.items.length === 0 ? (
          <Empty big="📄" text="Documents haven’t been published yet." error={recent.error} onRetry={recent.reload} />
        ) : (
          <div className="feed">
            {recent.data.items.map((d) => (
              <div className="feed-item" key={d.id}>
                <div className="feed-head">
                  <span className="chip">{DOCUMENT_ICONS[d.category] || '📄'} {d.category}</span>
                  <span className="muted small">{formatDate(d.published_date)}</span>
                  <span className="muted small">{formatBytes(d.file_size)}</span>
                </div>
                <b>{d.title}</b>
                <div className="feed-actions">
                  <button type="button" className="link-btn" onClick={() => setViewer(d)}>Read document →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}