import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../../api/hooks'
import type { DocumentCategory, DocumentItem, PaginatedList } from '../../api/client'
import { Crumbs } from '../../components/ui'
import { Empty, Skeleton } from '../../components/ui'
import DocumentViewerModal from '../../components/DocumentViewerModal'
import DocumentSearchBar, { findDocumentMatches } from '../../components/DocumentSearchBar'

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

/* ------------------------------------------------------------------ */
/* Thin, monochrome line icons — one per document category.            */
/* Inherits currentColor; no emoji, no colour fills.                   */
/* ------------------------------------------------------------------ */
function IconPaths({ slug }: { slug: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (slug) {
    case 'reports':
      return (
        <g {...common}>
          <path d="M6 3.5h7l4 4v13H6z" />
          <path d="M13 3.5v4h4" />
          <path d="M8.8 13.5h6.4M8.8 16.5h6.4M8.8 10.5h2.4" />
        </g>
      )
    case 'act-and-policies':
      return (
        <g {...common}>
          <path d="M12 4v16" />
          <path d="M5 7h14" />
          <path d="M5 7l-2.2 5.2a2.4 2.4 0 0 0 4.4 0L5 7z" />
          <path d="M19 7l-2.2 5.2a2.4 2.4 0 0 0 4.4 0L19 7z" />
          <path d="M8.5 20.5h7" />
        </g>
      )
    case 'circular-orders-notices':
      return (
        <g {...common}>
          <path d="M4 10.5v4l3 .5V10z" />
          <path d="M7 10.5 19 6v11.5L7 14.5z" />
          <path d="M9.5 14.7V19a1.5 1.5 0 0 0 3 0v-3.6" />
        </g>
      )
    case 'publications':
      return (
        <g {...common}>
          <path d="M12 6.5C10 5 8 4.5 4.5 4.5v14c3.5 0 5.5.5 7.5 2 2-1.5 4-2 7.5-2v-14c-3.5 0-5.5.5-7.5 2z" />
          <path d="M12 6.5v14" />
        </g>
      )
    case 'mou-others':
      return (
        <g {...common}>
          <path d="M6 3.5h7l4 4v9.5H6z" />
          <path d="M13 3.5v4h4" />
          <path d="M9 17l6.5-6.5" />
          <path d="M14.5 13.5l2 2 3-3" />
        </g>
      )
    case 'press-release':
      return (
        <g {...common}>
          <path d="M4 5.5h16v12H4z" />
          <path d="M4 5.5 12 12l8-6.5" />
          <path d="M4 17.5h4M4 14.5h2.5" />
        </g>
      )
    case 'gazettes-notifications':
      return (
        <g {...common}>
          <path d="M7 4.5h11a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7z" />
          <path d="M7 4.5a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 7 19.5" />
          <path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h9.5" />
          <path d="M10 9.5h6M10 12.5h6M10 15.5h4" />
        </g>
      )
    case 'guidelines':
      return (
        <g {...common}>
          <rect x="5" y="4.5" width="14" height="16" rx="1.5" />
          <path d="M8.5 4.5V3h7v1.5" />
          <path d="m9 13 2 2 4-4.5" />
        </g>
      )
    case 'e-sanskriti':
      return (
        <g {...common}>
          <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
          <path d="M9 20.5h6" />
          <path d="M12 16.5v4" />
          <path d="M7 8.5c1.2-1 2.8-1 4 0 1.2-1 2.8-1 4 0" />
          <path d="M7 8.5v4c1.2-1 2.8-1 4 0 1.2-1 2.8-1 4 0v-4" />
        </g>
      )
    case 'schemes':
    default:
      return (
        <g {...common}>
          <path d="M3.5 9.5 12 4.5l8.5 5z" />
          <path d="M5.5 9.5V18M10 9.5V18M14 9.5V18M18.5 9.5V18" />
          <path d="M4 18.5h16" />
        </g>
      )
  }
}

export function DocumentCategoryIcon({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <IconPaths slug={slug} />
    </svg>
  )
}

/** Ledger-style document count: "09 DOCUMENTS", secondary to the name. */
function ledgerLabel(count: number): string {
  if (count === 0) return 'No documents yet'
  const n = String(count).padStart(2, '0')
  return `${n} ${count === 1 ? 'Document' : 'Documents'}`
}

export function DocEmptyIcon({ slug }: { slug?: string }) {
  return (
    <span className="doc-empty-icon" aria-hidden="true">
      <DocumentCategoryIcon slug={slug ?? 'reports'} />
    </span>
  )
}

export default function DocumentsHome() {
  const [q, setQ] = useState('')
  const [viewer, setViewer] = useState<DocumentItem | null>(null)

  const categories = useFetch<DocumentCategory[]>('/documents/categories')
  const recent = useFetch<PaginatedList<DocumentItem>>('/documents?sort_by=newest&per_page=6')
  const allDocs = useFetch<PaginatedList<DocumentItem>>('/documents?per_page=500')

  const totalFiles = categories.data?.reduce((sum, c) => sum + (c.count ?? 0), 0) ?? 0

  const openFirstMatch = () => {
    const top = findDocumentMatches(allDocs.data?.items ?? [], q, 1)[0]
    if (top) setViewer(top)
  }

  return (
    <>
      <div className="container doc-archive-head">
        <Crumbs items={[{ label: 'Documents' }]} />
        <div className="doc-archive-eyebrow">Document Archive</div>
        <h1 className="doc-archive-title">Explore the Ministry&rsquo;s Documents</h1>
        <p className="doc-archive-sub">
          Official reports, publications, policies, gazettes and cultural records
          of the Ministry of Culture, Government of India.
        </p>
        {categories.data && (
          <div className="doc-archive-meta">
            <span className="doc-archive-count">
              <span className="dot" aria-hidden="true" />
              {categories.data.length} categories &middot; {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </span>
          </div>
        )}
      </div>

      {viewer && (
        <DocumentViewerModal
          item={viewer}
          title={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}

      <div className="container" style={{ marginBottom: 18, marginTop: 18 }}>
        <div className="filters doc-archive-search">
          <DocumentSearchBar
            documents={allDocs.data?.items ?? []}
            text={q}
            onTextChange={setQ}
            onPick={setViewer}
          />
          <button
            className="btn btn-primary"
            onClick={openFirstMatch}
          >
            Search
          </button>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        <div className="doc-archive-section-head">
          <div>
            <div className="doc-archive-kicker">Collections</div>
            <h2>Browse by Category</h2>
          </div>
        </div>
        {categories.loading ? (
          <div className="doc-archive-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : !categories.data || categories.data.length === 0 ? (
          <Empty big={<DocEmptyIcon />} text="Document categories aren’t available yet." error={categories.error} onRetry={categories.reload} />
        ) : (
          <div className="doc-archive-grid">
            {categories.data.map((c) => (
              <Link to={`/documents/${c.slug}`} className="doc-archive-card" key={c.slug}>
                <span className="doc-archive-tab" aria-hidden="true" />
                <div className="doc-archive-body">
                  <span className="doc-archive-icon" aria-hidden="true">
                    <DocumentCategoryIcon slug={c.slug} />
                  </span>
                  <h3 className="doc-archive-name">{c.name}</h3>
                  <p className={`doc-archive-ledger${c.count === 0 ? ' is-empty' : ''}`}>
                    {ledgerLabel(c.count)}
                  </p>
                  <span className="doc-archive-rule" aria-hidden="true"><i /></span>
                  {c.description && <p className="doc-archive-desc">{c.description}</p>}
                  <span className="doc-archive-action">
                    Explore documents <span className="arrow" aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="container" style={{ marginBottom: 52 }}>
        <div className="doc-archive-section-head">
          <div>
            <div className="doc-archive-kicker">Recently added</div>
            <h2>Recent Documents</h2>
          </div>
          <Link to="/documents" className="doc-archive-link">View all →</Link>
        </div>
        {recent.loading ? (
          <div className="doc-archive-grid"><Skeleton /><Skeleton /></div>
        ) : !recent.data || recent.data.items.length === 0 ? (
          <Empty big={<DocEmptyIcon />} text="Documents haven’t been published yet." error={recent.error} onRetry={recent.reload} />
        ) : (
          <div className="doc-archive-feed">
            {recent.data.items.map((d) => (
              <article className="doc-archive-item" key={d.id}>
                <div className="doc-archive-item-head">
                  <span className="doc-archive-cat">{d.category}</span>
                  <span className="muted small">{formatDate(d.published_date)}</span>
                  <span className="muted small">{formatBytes(d.file_size)}</span>
                </div>
                <h3 className="doc-archive-item-title">{d.title}</h3>
                <div className="doc-archive-item-actions">
                  <button type="button" className="doc-archive-read" onClick={() => setViewer(d)}>
                    Read document <span className="arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
