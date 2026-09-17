import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import {
  createGuideTour,
  getActiveGuideTour,
  cancelGuideTour,
  getAvailableGuides,
  reportGuide,
} from '../api/client'
import type { Heritage, HeritageGuide, HeritageImage, GuideTour } from '../api/client'
import { PageHead, Facts, Provenance, Show } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const TANGIBLE_SLUGS = ['man-made', 'natural', 'mixed']

const INTANGIBLE_CATEGORIES = new Set([
  'classical-dance', 'folk-dance', 'classical-music', 'folk-music', 'folk-songs',
  'theatre', 'traditional-performing-arts', 'traditional-crafts', 'handicrafts',
  'textiles', 'traditional-artistic-forms', 'festivals-cultural-practices',
  'rituals-traditions', 'oral-traditions', 'storytelling', 'traditional-knowledge', 'culinary',
])

function isIntangible(h: Heritage): boolean {
  if (h.heritage_type === 'intangible') return true
  return INTANGIBLE_CATEGORIES.has((h.category || '').toLowerCase())
}

// Guide options appear on every tangible, natural and world-heritage site —
// i.e. every physical site — and never on intangible culture pages.
function guideEligible(h: Heritage): boolean {
  return !isIntangible(h)
}

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
  const { token } = useAuth()
  const { data: h, loading, error } = useFetch<Heritage>(`/heritage/${id}`)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [guides, setGuides] = useState<HeritageGuide[]>([])
  const [guidesLoading, setGuidesLoading] = useState(false)
  const [guideMsg, setGuideMsg] = useState('')
  const [doneMsg, setDoneMsg] = useState('')
  const [choosingId, setChoosingId] = useState<number | null>(null)
  const [reportingId, setReportingId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [tourBusy, setTourBusy] = useState(false)

  // The tourist's own persisted tour assignment for this site (source of truth
  // is the guide_tours table; we only remember our anonymous tour token to be
  // able to find it again on reload).
  const [myTour, setMyTour] = useState<GuideTour | null>(null)
  const [myTourGuideId, setMyTourGuideId] = useState<number | null>(null)

  const eligibleForGuides = useMemo(() => Boolean(h && guideEligible(h)), [h])

  const siteTourKey = (siteId: number | string) => `sih_guide_tour_${siteId}`
  const savedTourToken = h ? sessionStorage.getItem(siteTourKey(h.id)) : null

  useEffect(() => {
    let cancelled = false
    if (!h || !guideEligible(h)) {
      setGuides([])
      setGuideMsg('')
      setMyTour(null)
      setMyTourGuideId(null)
      return () => { cancelled = true }
    }
    setGuidesLoading(true)
    setGuideMsg('')

    // 1. Live approved guides for this location (from the database only).
    getAvailableGuides({ state: h.state_name || h.region || null, location: h.location || null })
      .then((rows) => {
        if (cancelled) return
        setGuides(rows)
        if (rows.length > 0 && rows.every((g) => g.availability === 'occupied')) {
          setGuideMsg('All registered guides are currently occupied. Please check again later.')
        }
      })
      .catch(() => { if (!cancelled) setGuides([]) })
      .finally(() => { if (!cancelled) setGuidesLoading(false) })

    // 2. This tourist's own selection for this site (persists in the DB).
    getActiveGuideTour({ heritage_site_id: h.id, tour_token: savedTourToken || null }, token)
      .then((r) => {
        if (cancelled) return
        if (r.tour) {
          setMyTour(r.tour)
          setMyTourGuideId(r.tour.guide_id)
          sessionStorage.setItem(siteTourKey(h.id), r.tour.tour_token)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h])

  const chooseGuideAction = async (g: HeritageGuide) => {
    if (!h) return
    setChoosingId(g.id)
    setGuideMsg('')
    try {
      const r = await createGuideTour(
        {
          guide_id: g.id,
          heritage_site_id: h.id,
          site_name: h.name,
        },
        token,
      )
      setGuides((rows) => rows.map((row) => (row.id === r.guide.id ? { ...row, availability: 'occupied' } : row)))
      setMyTour(r.tour)
      setMyTourGuideId(r.guide.id)
      sessionStorage.setItem(siteTourKey(h.id), r.tour.tour_token)
      setDoneMsg(r.message)
      setGuideMsg('')
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not select this guide right now. Please try again.')
    } finally {
      setChoosingId(null)
    }
  }

  const removeGuideAction = async (tour: GuideTour) => {
    setTourBusy(true)
    setGuideMsg('')
    setDoneMsg('')
    try {
      const r = await cancelGuideTour(tour.id, tour.tour_token, token)
      setGuides((rows) => rows.map((row) => (row.id === r.guide.id ? { ...row, availability: r.guide.availability } : row)))
      setMyTour(null)
      setMyTourGuideId(null)
      sessionStorage.removeItem(siteTourKey(h!.id))
      setDoneMsg(r.message || 'You can now choose another available guide.')
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not remove the guide right now.')
    } finally {
      setTourBusy(false)
    }
  }

  const submitReport = async (g: HeritageGuide) => {
    setReportBusy(true)
    setGuideMsg('')
    try {
      const r = await reportGuide(g.id, { reason: reportReason, details: reportDetails.trim() || null })
      setDoneMsg(r.message)
      setReportingId(null)
      setReportReason('')
      setReportDetails('')
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not submit your report right now.')
    } finally {
      setReportBusy(false)
    }
  }

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

        {/* 7. Heritage Guides */}
        {eligibleForGuides && (
          <div className="content-block">
            <h3>Explore With a Heritage Guide</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>
              Connect with local volunteers who know {h.name} and its surroundings. Guides are
              registered through Sanskriti Setu and are not employed or paid by any government body.
            </p>

            {/* Selected guide (persisted tour) */}
            {myTour && (
              <div
                className="feature-card"
                style={{ border: '1px solid var(--green-deep)', marginBottom: 18 }}
              >
                <div className="fc-body">
                  <p className="muted small" style={{ margin: 0, fontWeight: 600 }}>Your selected guide</p>
                  <h3 style={{ margin: '6px 0 2px' }}>
                    {guides.find((g) => g.id === myTour.guide_id)?.full_name || `Guide #${myTour.guide_id}`}
                  </h3>
                  <p className="desc">📍 {guides.find((g) => g.id === myTour.guide_id)?.location || h.name}</p>
                  <span className="chip chip-green" style={{ fontSize: 11 }}>🟢 Assigned to your tour</span>
                  <p className="muted small" style={{ margin: '8px 0 0' }}>
                    This selection is saved. Your guide is reserved for this tour until you remove them.
                  </p>
                  <p style={{ display: 'flex', gap: 8, margin: '12px 0 0', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline"
                      disabled={tourBusy}
                      onClick={() => removeGuideAction(myTour)}
                    >
                      {tourBusy ? 'Removing…' : 'Remove Guide'}
                    </button>
                    <button
                      className="btn btn-outline"
                      disabled={tourBusy}
                      onClick={() => { setMyTour(null); setMyTourGuideId(null) }}
                    >
                      Change Guide
                    </button>
                  </p>
                  <p className="muted small" style={{ margin: '8px 0 0' }}>
                    Choosing another guide below will replace this selection.
                  </p>
                </div>
              </div>
            )}

            {guidesLoading ? (
              <div className="card-grid tight"><Skeleton style={{ height: 120 }} /><Skeleton style={{ height: 120 }} /></div>
            ) : guides.length > 0 ? (
              <>
                <div className="card-grid tight">
                  {guides.map((g) => {
                    const occupied = g.availability === 'occupied' || (myTour && myTour.guide_id === g.id)
                    const isMine = myTour && myTour.guide_id === g.id
                    return (
                      <div className="feature-card" key={g.id}>
                        <div className="fc-body">
                          <h3>{g.full_name}</h3>
                          <p className="desc">📍 {g.location || g.state}</p>
                          <span className={`chip ${occupied ? '' : 'chip-green'}`} style={{ fontSize: 11 }}>
                            {isMine ? '🟢 Selected' : occupied ? '🔴 Occupied' : '🟢 Free'}
                          </span>
                          {g.status === 'approved' && (
                            <span className="chip chip-green" style={{ fontSize: 11 }}>Registered through Sanskriti Setu</span>
                          )}
                          <p style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 0, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-primary"
                              disabled={occupied || choosingId === g.id || tourBusy}
                              style={occupied ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                              onClick={() => chooseGuideAction(g)}
                            >
                              {choosingId === g.id ? 'Connecting…' : isMine ? 'Selected' : occupied ? 'Occupied' : 'Choose Guide'}
                            </button>
                          </p>
                          <p style={{ margin: '10px 0 0' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ fontSize: 12 }}
                              onClick={() => { setReportingId(reportingId === g.id ? null : g.id); setReportReason(''); setReportDetails('') }}
                            >
                              {reportingId === g.id ? 'Close report' : 'Report guide'}
                            </button>
                          </p>
                          {reportingId === g.id && (
                            <div className="content-block" style={{ margin: '10px 0 0', padding: 12, border: '1px solid var(--line)' }}>
                              <label className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Report {g.full_name}</label>
                              <select
                                className="input"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                style={{ marginTop: 6 }}
                              >
                                <option value="">Select a reason…</option>
                                <option>Did not show up</option>
                                <option>Misbehaved / unprofessional</option>
                                <option>Demanded payment or money</option>
                                <option>Gave wrong information</option>
                                <option>Other</option>
                              </select>
                              <input
                                className="input"
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                placeholder="More details (optional)"
                                style={{ marginTop: 6 }}
                              />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={!reportReason || reportBusy}
                                  onClick={() => submitReport(g)}
                                >
                                  {reportBusy ? 'Submitting…' : 'Submit report'}
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setReportingId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {guideMsg && <p style={{ color: 'var(--orange-deep)', fontSize: 14 }}>{guideMsg}</p>}
                {doneMsg && <p style={{ color: 'var(--green-deep)', fontSize: 14 }}>✓ {doneMsg}</p>}
              </>
            ) : (
              <Empty big="🧑‍🤝‍🧑" text="No registered Heritage Guides are currently available for this site." />
            )}
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