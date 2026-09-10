import { useEffect } from 'react'
import type { DocumentItem } from '../api/client'

interface Props {
  item: DocumentItem
  title: string
  onClose: () => void
}

export default function DocumentViewerModal({ item, title, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="doc-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — viewer`}
      onClick={onClose}
    >
      <div className="doc-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="doc-viewer-bar">
          <div className="doc-viewer-meta" title={title}>
            <b>{title}</b>
            <span className="muted small">{item.category}</span>
          </div>
          <div className="doc-viewer-actions">
            {item.file_url && (
              <>
                <a className="btn btn-sm btn-outline" href={item.file_url} target="_blank" rel="noreferrer">
                  Open in new tab
                </a>
                <a className="btn btn-sm btn-primary" href={item.file_url} download>
                  Download
                </a>
              </>
            )}
            <button type="button" className="btn btn-sm btn-outline" onClick={onClose} aria-label="Close viewer">
              ✕
            </button>
          </div>
        </div>
        <div className="doc-viewer-body">
          {item.file_url ? (
            <iframe src={item.file_url} title={title} />
          ) : (
            <div className="doc-viewer-empty">No preview available for this document.</div>
          )}
        </div>
      </div>
    </div>
  )
}