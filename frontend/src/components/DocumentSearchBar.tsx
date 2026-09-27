import { useEffect, useMemo, useRef, useState } from 'react'
import type { DocumentItem } from '../api/client'

interface Props {
  documents: DocumentItem[]
  text: string
  onTextChange: (text: string) => void
  placeholder?: string
  ariaLabel?: string
  /** Called when the user picks a suggestion (click / Enter). */
  onPick: (doc: DocumentItem) => void
}

const MAX_SHOWN = 8
const MIN_CHARS = 2

function scoreDoc(d: DocumentItem, needle: string): number {
  const title = d.title.toLowerCase()
  const cat = (d.category || '').toLowerCase()
  if (title.startsWith(needle)) return 0
  if (title.includes(needle)) return 1
  if (cat.startsWith(needle)) return 2
  if (cat.includes(needle)) return 3
  if ((d.description || '').toLowerCase().includes(needle)) return 4
  return 5
}

/** Substring-ranked matches (title → category → description). Shared with the Search button. */
export function findDocumentMatches(documents: DocumentItem[], query: string, limit = MAX_SHOWN): DocumentItem[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < MIN_CHARS) return []
  return documents
    .map((d) => ({ d, s: scoreDoc(d, needle) }))
    .filter((r) => r.s < 5)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((r) => r.d)
}

/** Total match count (untruncated) for the footer note. */
export function countDocumentMatches(documents: DocumentItem[], query: string): number {
  const needle = query.trim().toLowerCase()
  if (needle.length < MIN_CHARS) return 0
  return documents.filter((d) => scoreDoc(d, needle) < 5).length
}

/** Renders the title with the matched substring emphasised (no regex). */
function Highlighted({ title, needle }: { title: string; needle: string }) {
  const idx = title.toLowerCase().indexOf(needle.toLowerCase())
  if (idx < 0 || !needle) return <>{title}</>
  return (
    <>
      {title.slice(0, idx)}
      <mark>{title.slice(idx, idx + needle.length)}</mark>
      {title.slice(idx + needle.length)}
    </>
  )
}

export default function DocumentSearchBar({ documents, text, onTextChange, placeholder, ariaLabel, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  const needle = text.trim().toLowerCase()
  const matches = useMemo(() => findDocumentMatches(documents, text), [documents, text])
  const total = useMemo(() => countDocumentMatches(documents, text), [documents, text])

  useEffect(() => setHighlight(-1), [needle])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlight(-1)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const showList = open && needle.length >= MIN_CHARS
  const shown = matches

  const pick = (doc: DocumentItem) => {
    setOpen(false)
    setHighlight(-1)
    onPick(doc)
  }

  const submitFirst = () => {
    if (matches.length > 0) pick(highlight >= 0 && highlight < shown.length ? shown[highlight] : matches[0])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && showList && shown.length > 0) {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => (h + 1) % shown.length)
    } else if (e.key === 'ArrowUp' && showList && shown.length > 0) {
      e.preventDefault()
      setHighlight((h) => (h <= 0 ? shown.length - 1 : h - 1))
    } else if (e.key === 'Enter') {
      if (showList && matches.length > 0) {
        e.preventDefault()
        submitFirst()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlight(-1)
    }
  }

  return (
    <div className="doc-suggest-wrap" ref={wrapRef}>
      <input
        className="input"
        style={{ maxWidth: 420, width: '100%' }}
        placeholder={placeholder ?? 'Search official documents…'}
        value={text}
        aria-label={ariaLabel ?? 'Search documents'}
        role="combobox"
        aria-expanded={showList}
        aria-controls="doc-suggest-list"
        aria-activedescendant={highlight >= 0 ? `doc-suggest-${highlight}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          onTextChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="doc-suggest-list" id="doc-suggest-list" role="listbox" aria-label="Document suggestions">
          {shown.length === 0 ? (
            <li className="doc-suggest-empty">No documents match &ldquo;{text.trim()}&rdquo;.</li>
          ) : (
            <>
              {shown.map((d, i) => (
                <li
                  key={d.id}
                  id={`doc-suggest-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  className={`doc-suggest-item${i === highlight ? ' active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(d)
                  }}
                  onMouseEnter={() => setHighlight(i)}
                >
                  <span className="doc-suggest-title">
                    <Highlighted title={d.title} needle={needle} />
                  </span>
                  <span className="doc-suggest-cat">{d.category}</span>
                </li>
              ))}
              {total > shown.length && (
                <li className="doc-suggest-foot" aria-hidden="true">
                  +{total - shown.length} more match{total - shown.length === 1 ? '' : 'es'} — keep typing to narrow
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  )
}
