import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage, HeritageImage } from '../api/client'
import { PageHead, Facts, Provenance, Show } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'

const TANGIBLE_SLUGS = ['man-made', 'natural', 'mixed']

function parentCrumbs(h: Heritage): Array<{ label: string; to?: string }> {
  const cat = h.category || ''
  if (TANGIBLE_SLUGS.includes(cat)) {
    return [
      { label: 'Tangible Heritage', to: '/heritage/tangible' },
      { label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '), to: `/heritage/tangible/${cat}` },
    ]
  }
  if (h.heritage_type === 'intangible' || ['classical-dance', 'folk-dance', 'classical-music', 'folk-music', 'folk-songs',
    'theatre', 'traditional-performing-arts', 'traditional-crafts', 'handicrafts', 'textiles',
    'traditional-artistic-forms', 'festivals-cultural-practices', 'rituals-traditions', 'oral-traditions',
    'storytelling', 'traditional-knowledge', 'culinary'].includes(cat)) {
    return [{ label: 'Intangible Heritage', to: '/heritage/intangible' }]
  }
  if (cat.toLowerCase().includes('world') || h.heritage_type === 'world') {
    return [{ label: 'World Heritage', to: '/heritage/world' }]
  }
  return [{ label: 'Heritage', to: '/heritage' }]
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: HeritageImage[]
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
        <img src={img.url} alt={img.caption || 'Gallery image'} />
        <div className="lightbox-caption">{img.caption || `Image ${index + 1} of ${images.length}`}</div>
        <div className="lightbox-nav">
          <button aria-label="Previous image" onClick={onPrev}>‹</button>
          <span>{index + 1} / {images.length}</span>
          <button aria-label="Next image" onClick={onNext}>›</button>
        </div>
      </div>
    </div>
  )
}

export default function HeritageDetail() {
  const { id } = useParams()
  const { data: h, loading, error } = useFetch<Heritage>(`/heritage/${id}`)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const gallery = useMemo<HeritageImage[]>(
    () => h?.gallery && h.gallery.length > 0 ? h.gallery : (h?.main_image || h?.image_url) ? [{ id: -1, url: h.main_image || h.image_url!, caption: null, display_order: 0 }] : [],
    [h],
  )

  if (loading) return <Skeleton style={{ height: 360, marginTop: 30 }} />
  if (error || !h) return <Empty big="🏛️" text="Heritage site not found — the dataset hasn’t been connected." error={error} />

  const photo = h.main_image || h.image_url
  const has360 = Boolean(h.google_360_url)
  const crumbs = [{ label: 'Heritage', to: '/heritage' }, ...parentCrumbs(h), { label: h.name }]

  const openLightbox = (i: number) => setLightbox(i)
  const closeLightbox = () => setLightbox(null)
  const stepLightbox = (dir: 1 | -1) =>
    setLightbox((cur) => (cur === null ? cur : (cur + dir + gallery.length) % gallery.length))

  return (
    <>
      <div className="container">
        <PageHead
          title={h.name}
          sub={h.description || ''}
          crumbs={crumbs}
        />
      </div>

      {/* 1. Photos */}
      {photo && (
        <div className="container">
          <div className="heritage-photo heritage-photo-wrap">
            <CoverImg src={photo} alt={h.name} seed={h.name} />
            <span className="heritage-photo-label">{h.name}</span>
          </div>
        </div>
      )}

      <div className="container" style={{ margin: '24px 0 48px' }}>
        <div className="content-block">
          <h3>Description</h3>
          <Show what={h.description} />
          {h.significance && <Show what={h.significance} />}
        </div>

        {/* 3. History */}
        {(h.history || h.related_events) && (
          <div className="content-block">
            <h3>History</h3>
            <Show what={h.history} />
            {h.related_events && <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>{h.related_events}</p>}
          </div>
        )}

        {/* 4. Important Facts */}
        <div className="content-block">
          <Facts
            rows={[
              { k: 'Location', v: h.location || h.region },
              { k: 'State / Region', v: h.region || h.state_name },
              { k: 'Period / Era', v: h.historical_period },
              { k: 'Established / Built', v: h.established },
              { k: 'Heritage Category', v: h.heritage_type ? (h.heritage_type === 'tangible' ? 'Tangible Heritage' : h.heritage_type === 'intangible' ? 'Intangible Heritage' : 'World Heritage') : h.category },
              { k: 'UNESCO Status', v: h.unesco_status || null },
              { k: 'Inscribed', v: h.unesco_year || null },
              { k: 'Classification', v: h.unesco_category || null },
              { k: 'City', v: h.city_name, to: h.city_id ? `/cities/${h.city_id}` : undefined },
              { k: 'State', v: h.state_name, to: h.state_id ? `/states/${h.state_id}` : undefined },
            ]}
          />
        </div>

        {/* 5. 360° View */}
        <div className="content-block">
          <div className={`tour-360${has360 ? '' : ' muted'}`}>
            <div className="tour-360-icon" aria-hidden>🛰️</div>
            <div>
              <h3>360° Virtual Tour</h3>
              {has360 ? (
                <>
                  <p>Immersive street-level views of {h.name} on Google Maps.</p>
                  <a
                    className="btn btn-green"
                    href={h.google_360_url!}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore in 360°
                  </a>
                </>
              ) : (
                <p>A 360° view isn’t available for this site yet. Coverage depends on Google Street View data.</p>
              )}
            </div>
          </div>
        </div>

        {/* 6. Gallery */}
        {gallery.length > 0 && (
          <div className="content-block">
            <h3>Gallery</h3>
            <div className="gallery">
              {gallery.map((g, i) => (
                <button
                  key={g.id === -1 ? i : g.id}
                  className="gallery-item"
                  onClick={() => openLightbox(i)}
                  aria-label={`View image ${i + 1} of ${gallery.length}`}
                >
                  <CoverImg src={g.url} alt={g.caption || `${h.name} image ${i + 1}`} seed={`${h.name}-${i}`} />
                </button>
              ))}
            </div>
            <p className="gallery-sub">Click any image to enlarge. Images are sourced from the public record of {h.name}.</p>
          </div>
        )}

        {/* Nearby */}
        {h.nearby && h.nearby.length > 0 && (
          <div className="content-block">
            <h3>Nearby attractions</h3>
            <div className="card-grid tight">
              {h.nearby.map((n) => (
                <Link key={n.id} to={`/heritage/${n.slug ?? n.id}`} className="feature-card">
                  <div className="card-thumb"><CoverImg src={n.main_image || n.image_url} alt={n.name} seed={n.name} /></div>
                  <div className="fc-body">
                    <h3>{n.name}</h3>
                    <p className="desc">{n.region || n.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Provenance rows={h.provenance} />
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