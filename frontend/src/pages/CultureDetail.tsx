import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Event } from '../api/client'
import { PageHead, Block, Show } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'

const STATUS_CHIP: Record<string, unknown> = {
  UPCOMING: 'chip chip-green',
  ONGOING: 'chip',
  COMPLETED: 'chip chip-outline',
}

function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  const img = images[index]

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" aria-label="Close" onClick={onClose}>✕</button>
        <img src={img} alt={`Gallery image ${index + 1}`} />
        <div className="lightbox-caption">Image {index + 1} of {images.length}</div>
        <div className="lightbox-nav">
          <button aria-label="Previous image" onClick={onPrev}>‹</button>
          <span>{index + 1} / {images.length}</span>
          <button aria-label="Next image" onClick={onNext}>›</button>
        </div>
      </div>
    </div>
  )
}

export default function CultureDetail() {
  const { id } = useParams()
  const { data: e, loading, error } = useFetch<Event>(`/events/${id}`)
  const allQ = useFetch<Event[]>('/events')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const gallery = useMemo<string[]>(() => {
    if (!e) return []
    const imgs = (e.gallery_images ?? []).filter(Boolean)
    if (imgs.length > 0) return imgs
    return e.image_url ? [e.image_url] : []
  }, [e])

  const related = useMemo(() => {
    if (!e) return []
    return (allQ.data ?? [])
      .filter((x) => x.id !== e.id)
      .sort((a, b) => {
        const sa = a.category === e.category ? 1 : 0
        const sb = b.category === e.category ? 1 : 0
        return sb - sa
      })
      .slice(0, 3)
  }, [e, allQ.data])

  if (loading) return <Skeleton style={{ height: 380, marginTop: 30 }} />
  if (error || !e) return <Empty big="🎭" text="Festival not found — the dataset hasn’t been connected." error={error} />

  const crumbs = [{ label: 'Culture', to: '/culture' }, { label: e.name }]
  const hasDetail = Boolean(e.historical_background || e.cultural_significance || e.rituals_traditions)

  const openLightbox = (i: number) => setLightbox(i)
  const closeLightbox = () => setLightbox(null)
  const stepLightbox = (dir: 1 | -1) =>
    setLightbox((cur) => (cur === null ? cur : (cur + dir + gallery.length) % gallery.length))

  return (
    <>
      <div className="container">
        <PageHead title={e.name} sub={e.description} crumbs={crumbs} />
      </div>

      {e.image_url && (
        <div className="container">
          <div className="heritage-photo heritage-photo-wrap">
            <CoverImg src={e.image_url} alt={e.name} seed={e.name} />
            <span className="heritage-photo-label">{e.name}</span>
          </div>
        </div>
      )}

      <div className="container" style={{ margin: '24px 0 48px' }}>
        <div className="content-block">
          <div className="hero-strip" style={{ marginBottom: 10 }}>
            <span className={(STATUS_CHIP[e.status] as string) ?? 'chip chip-outline'}>{e.status.toLowerCase()}</span>
            <span className="chip">{e.category}</span>
          </div>
          <Show what={e.description} />
        </div>

        {hasDetail && (
          <>
            {e.historical_background && (
              <div className="content-block">
                <h3>Historical Background</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>{e.historical_background}</p>
              </div>
            )}
            {e.cultural_significance && (
              <Block title="Cultural Significance">
                <Show what={e.cultural_significance} />
              </Block>
            )}
            {e.rituals_traditions && (
              <Block title="Rituals & Traditions">
                <Show what={e.rituals_traditions} />
              </Block>
            )}
          </>
        )}

        <div className="content-block">
          <div className="fact-box">
            <h4>Quick Facts</h4>
            <div className="fact-row"><b>Dates:</b> {fmtDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` – ${fmtDate(e.end_date)}` : ''}</div>
            <div className="fact-row"><b>Location:</b> {e.location}</div>
            {e.state_name && <div className="fact-row"><b>State:</b> {e.state_name}</div>}
            {e.city_name && <div className="fact-row"><b>City:</b> {e.city_name}</div>}
            {e.organizer && <div className="fact-row"><b>Organiser:</b> {e.organizer}</div>}
            {(e.registration_url || e.official_url) && (
              <div className="hero-strip" style={{ marginTop: 10 }}>
                {e.registration_url && <a className="btn btn-sm btn-primary" href={e.registration_url} target="_blank" rel="noreferrer">Register →</a>}
                {e.official_url && <a className="btn btn-sm btn-outline" href={e.official_url} target="_blank" rel="noreferrer">Official site ↗</a>}
              </div>
            )}
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="content-block">
            <h3>Gallery</h3>
            <div className="gallery">
              {gallery.map((g, i) => (
                <button
                  key={g + i}
                  className="gallery-item"
                  onClick={() => openLightbox(i)}
                  aria-label={`View image ${i + 1} of ${gallery.length}`}
                >
                  <CoverImg src={g} alt={`${e.name} image ${i + 1}`} seed={`${e.name}-${i}`} />
                </button>
              ))}
            </div>
            <p className="gallery-sub">Click any image to enlarge. Images are sourced from Wikimedia Commons.</p>
          </div>
        )}

        {related.length > 0 && (
          <div className="content-block">
            <h3>More events</h3>
            <div className="card-grid tight">
              {related.map((r) => (
                <Link key={r.id} to={`/culture/${r.id}`} className="feature-card">
                  <div className="card-thumb"><CoverImg src={r.image_url} alt={r.name} seed={r.name} /></div>
                  <div className="fc-body">
                    <span className="chip chip-green">{r.category}</span>
                    <h3>{r.name}</h3>
                    <p className="desc">{e.category === r.category ? '' : `${r.category} • `}{r.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="content-block">
          <div className="hero-strip">
            <Link to="/culture" className="see-all">← Back to all events</Link>
          </div>
        </div>
      </div>

      {lightbox !== null && gallery.length > 0 && (
        <Lightbox
          images={gallery}
          index={lightbox}
          onClose={closeLightbox}
          onPrev={() => stepLightbox(-1)}
          onNext={() => stepLightbox(1)}
        />
      )}
    </>
  )
}