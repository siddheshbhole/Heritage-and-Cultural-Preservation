import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import {
  getSiteGuides,
  startGuideTour,
  endGuideTour,
  reportGuideProfile,
  reviewGuideTour,
} from '../api/client'
import type { Heritage, HeritageImage, GuideProfile, GuideTourAssignment } from '../api/client'
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
  const { token, openAuthModal } = useAuth()
  const { data: h, loading, error } = useFetch<Heritage>(`/heritage/${id}`)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [guides, setGuides] = useState<GuideProfile[]>([])
  const [guidesLoading, setGuidesLoading] = useState(false)
  const [guideMsg, setGuideMsg] = useState('')
  const [doneMsg, setDoneMsg] = useState('')
  const [choosingId, setChoosingId] = useState<number | null>(null)
  const [tourBusy, setTourBusy] = useState(false)

  const [reportingId, setReportingId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportBusy, setReportBusy] = useState(false)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)

  // The signed-in tourist's active tour (if any), returned by the backend so
  // the page can re-render the "Current Guide" state on reload.
  const [myTour, setMyTour] = useState<GuideTourAssignment | null>(null)

  const eligibleForGuides = useMemo(() => Boolean(h && guideEligible(h)), [h])

  const reloadSiteGuides = useCallback(async () => {
    if (!h || !guideEligible(h)) {
      setGuides([])
      setMyTour(null)
      return
    }
    setGuidesLoading(true)
    setGuideMsg('')
    try {
      const r = await getSiteGuides(
        h.id,
        { state: h.state_name || h.region || null, location: h.location || null },
        token,
      )
      setGuides(r.guides)
      setMyTour(r.my_tour)
      if (r.guides.length === 0 && !r.my_tour) {
        setGuideMsg('No heritage guides are currently open to work near this site. Check back later.')
      }
    } catch (error: any) {
      setGuides([])
      setMyTour(null)
      setGuideMsg(error.message || 'Could not load heritage guides for this site right now.')
    } finally {
      setGuidesLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, token])

  useEffect(() => {
    reloadSiteGuides()
  }, [reloadSiteGuides])

  const chooseGuide = async (g: GuideProfile) => {
    if (!token) {
      setGuideMsg('Please sign in to choose a Heritage Guide.')
      openAuthModal('login')
      return
    }
    if (!h) return
    setChoosingId(g.id)
    setGuideMsg('')
    setDoneMsg('')
    try {
      const r = await startGuideTour(
        { guide_id: g.id, site_id: h.id, site_name: h.name },
        token,
      )
      setDoneMsg(r.message)
      await reloadSiteGuides()
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not select this guide right now. Please try again.')
    } finally {
      setChoosingId(null)
    }
  }

  const endTour = async (tour: GuideTourAssignment) => {
    if (!token) return
    setTourBusy(true)
    setGuideMsg('')
    setDoneMsg('')
    try {
      const r = await endGuideTour(tour.id, token)
      setDoneMsg(r.message)
      await reloadSiteGuides()
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not end the tour right now.')
    } finally {
      setTourBusy(false)
    }
  }

  const submitReport = async (g: { id: number; name: string }) => {
    if (!token) return
    setReportBusy(true)
    setGuideMsg('')
    try {
      const r = await reportGuideProfile(
        g.id,
        {
          reason_category: reportReason,
          description: reportDetails.trim() || null,
          tour_id: myTour?.guide_id === g.id ? myTour.id : null,
        },
        token,
      )
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

  const submitReview = async () => {
    if (!token || !myTour) return
    if (reviewRating < 1) {
      setGuideMsg('Please choose a star rating before submitting.')
      return
    }
    setReviewBusy(true)
    setGuideMsg('')
    try {
      const r = await reviewGuideTour(myTour.id, { rating: reviewRating, review_text: reviewText.trim() || null }, token)
      setDoneMsg(r.message)
      setReviewOpen(false)
      setReviewRating(0)
      setReviewText('')
      await reloadSiteGuides()
    } catch (error: any) {
      setGuideMsg(error.message || 'Could not submit your review right now.')
    } finally {
      setReviewBusy(false)
    }
  }

  const reportForm = (g: { id: number; name: string }) => (
    <div className="content-block" style={{ margin: '10px 0 0', padding: 12, border: '1px solid var(--line)' }}>
      <label className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Report {g.name}</label>
      <select
        className="input"
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        style={{ marginTop: 6 }}
      >
        <option value="">Select a reason…</option>
        <option value="no_show">Did not show up</option>
        <option value="misconduct">Misbehaved / unprofessional</option>
        <option value="misinformation">Gave wrong information</option>
        <option value="unsafe">Unsafe behaviour</option>
        <option value="other">Other</option>
      </select>
      <input
        className="input"
        value={reportDetails}
        onChange={(e) => setReportDetails(e.target.value)}
        placeholder="More details (required for Other)"
        style={{ marginTop: 6 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          disabled={!reportReason || reportBusy || (reportReason === 'other' && !reportDetails.trim())}
          onClick={() => submitReport(g)}
        >
          {reportBusy ? 'Submitting…' : 'Submit report'}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setReportingId(null)}>
          Cancel
        </button>
      </div>
    </div>
  )

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

        {/* 5. 360° View & VR Experience */}
        {has360 && (
          <div className="content-block">
            <div className="tour-360-grid">
              {/* Card 1: 360° Virtual Tour */}
              <div className="tour-card">
                <div className="tour-card-header">
                  <div className="tour-card-icon" aria-hidden>🛰️</div>
                  <div className="tour-card-body">
                    <h3>360° Virtual Tour</h3>
                    <p>Immersive street-level views of {h.name} on Google Maps.</p>
                  </div>
                </div>
                <div className="tour-card-footer">
                  <a
                    className="btn btn-green"
                    href={h.google_360_url!}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore in 360°
                  </a>
                </div>
              </div>

              {/* Card 2: VR Experience */}
              <div className="tour-card">
                <div className="tour-card-header">
                  <div className="tour-card-icon" aria-hidden>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4l-2 2-2-2H4a2 2 0 0 1-2-2v-6z" />
                      <circle cx="7" cy="13" r="2" />
                      <circle cx="17" cy="13" r="2" />
                    </svg>
                  </div>
                  <div className="tour-card-body">
                    <h3>VR Experience</h3>
                    <p>Interactive virtual reality tour of {h.name} for VR headsets & mobile display.</p>
                  </div>
                </div>
                <div className="tour-card-footer">
                  <a
                    className="btn btn-green"
                    href={h.vr_url || h.vrUrl || '#vr-experience'}
                    target={h.vr_url || h.vrUrl ? '_blank' : '_self'}
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!h.vr_url && !h.vrUrl) {
                        e.preventDefault()
                        alert('VR Experience mode selected. (Virtual Reality headset setup ready)')
                      }
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4l-2 2-2-2H4a2 2 0 0 1-2-2v-6z" />
                      <circle cx="7" cy="13" r="2" />
                      <circle cx="17" cy="13" r="2" />
                    </svg>
                    VR Experience
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

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

            {/* Current guide (persisted tour) */}
            {myTour && (
              <div className="feature-card" style={{ border: '1px solid var(--green-deep)', marginBottom: 18 }}>
                <div className="fc-body">
                  <p className="muted small" style={{ margin: 0, fontWeight: 600 }}>Your current tour</p>
                  <h3 style={{ margin: '6px 0 2px' }}>
                    {myTour.guide?.name || (myTour.guide_id ? `Guide #${myTour.guide_id}` : 'Heritage Guide')}
                  </h3>
                  <p className="desc">📍 {myTour.site_name}</p>
                  <span className="chip chip-green" style={{ fontSize: 11 }}>🟢 Active with your party</span>
                  <p style={{ display: 'flex', gap: 8, margin: '12px 0 0', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" disabled={tourBusy} onClick={() => endTour(myTour)}>
                      {tourBusy ? 'Ending…' : 'End Tour'}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (!token) {
                          setGuideMsg('Please sign in to report a guide.')
                          openAuthModal('login')
                          return
                        }
                        setReportingId(reportingId === myTour.guide?.id ? null : (myTour.guide?.id ?? null))
                        setReportReason('')
                        setReportDetails('')
                      }}
                    >
                      {reportingId === myTour.guide?.id ? 'Close report' : 'Report Guide'}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setReviewOpen((v) => !v); setGuideMsg('') }}
                    >
                      {reviewOpen ? 'Close Review' : 'Review Guide'}
                    </button>
                  </p>
                  {reviewOpen && (
                    <div className="content-block" style={{ margin: '10px 0 0', padding: 12, border: '1px solid var(--line)' }}>
                      <label className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
                        Rate your tour with {myTour.guide?.name || 'your guide'}
                      </label>
                      <div style={{ display: 'flex', gap: 6, margin: '8px 0 0' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="btn btn-sm"
                            style={star <= reviewRating ? { background: 'var(--green-deep)', color: '#fff' } : undefined}
                            onClick={() => setReviewRating(star)}
                            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                          >
                            {star <= reviewRating ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="input"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience (optional)"
                        rows={3}
                        style={{ marginTop: 8, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-primary btn-sm" disabled={reviewBusy} onClick={submitReview}>
                          {reviewBusy ? 'Submitting…' : 'Submit review'}
                        </button>
                      </div>
                    </div>
                  )}
                  {reportingId === (myTour.guide?.id ?? null) && myTour.guide && reportForm(myTour.guide)}
                  <p className="muted small" style={{ margin: '8px 0 0' }}>
                    Your guide stays reserved for you until the tour ends. They become OPEN TO WORK again
                    afterwards.
                  </p>
                </div>
              </div>
            )}

            {guidesLoading ? (
              <div className="card-grid tight"><Skeleton style={{ height: 120 }} /><Skeleton style={{ height: 120 }} /></div>
            ) : guides.length > 0 ? (
              <>
                <div className="card-grid tight">
                  {guides.map((g) => (
                    <div className="feature-card" key={g.id}>
                      <div className="fc-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {g.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ margin: 0 }}>{g.name}</h3>
                            <p className="desc" style={{ margin: 0 }}>📍 {g.location || g.state}</p>
                          </div>
                        </div>
                        <p className="muted small" style={{ margin: '8px 0 0' }}>
                          ⭐ {Number(g.rating || 0).toFixed(1)} · {g.reviews_count} review{g.reviews_count === 1 ? '' : 's'}
                        </p>
                        <span className="chip chip-green" style={{ fontSize: 11 }}>🟢 Open to work</span>
                        <p style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 0, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary"
                            disabled={choosingId === g.id || tourBusy}
                            onClick={() => chooseGuide(g)}
                          >
                            {choosingId === g.id ? 'Connecting…' : 'Choose Guide'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: 12 }}
                            onClick={() => {
                              if (!token) {
                                setGuideMsg('Please sign in to report a guide.')
                                openAuthModal('login')
                                return
                              }
                              setReportingId(reportingId === g.id ? null : g.id)
                              setReportReason('')
                              setReportDetails('')
                            }}
                          >
                            {reportingId === g.id ? 'Close report' : 'Report guide'}
                          </button>
                        </p>
                        {reportingId === g.id && reportForm(g)}
                      </div>
                    </div>
                  ))}
                </div>
                {guideMsg && <p style={{ color: 'var(--orange-deep)', fontSize: 14 }}>{guideMsg}</p>}
                {doneMsg && <p style={{ color: 'var(--green-deep)', fontSize: 14 }}>✓ {doneMsg}</p>}
              </>
            ) : (
              <>
                <Empty big="🧑‍🤝‍🧑" text="No Heritage Guides are currently open to work near this site." />
                {guideMsg && <p style={{ color: 'var(--orange-deep)', fontSize: 14 }}>{guideMsg}</p>}
                {doneMsg && <p style={{ color: 'var(--green-deep)', fontSize: 14 }}>✓ {doneMsg}</p>}
              </>
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