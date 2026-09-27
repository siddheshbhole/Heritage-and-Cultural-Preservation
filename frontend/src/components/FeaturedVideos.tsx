import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { MediaVideo } from '../api/media'
import { Section, Skeleton, CoverImg } from './ui'
import { requestSmoothTopScroll } from './ScrollToTop'

// Hand-picked from Explore ▸ Media ▸ Videos. Displayed in this exact order:
// three cards on the top row, three on the bottom row.
const FEATURED_IDS = [6, 11, 13, 16, 17, 18]

export default function FeaturedVideos() {
  const { data, loading } = useFetch<MediaVideo[]>('/media/videos')
  const [playing, setPlaying] = useState<string | null>(null)
  const navigate = useNavigate()

  // Built directly from FEATURED_IDS so the display order is always exactly
  // [6, 11, 13, 16, 17, 18], regardless of the order the API returns rows in.
  const byId = new Map((data ?? []).map((v) => [v.id, v]))
  const items = FEATURED_IDS.map((id) => byId.get(id)).filter(
    (v): v is MediaVideo => Boolean(v),
  )

  const goVideos = () => {
    requestSmoothTopScroll()
    navigate('/media/videos')
  }

  return (
    <Section kicker="Watch" title="Featured Videos">
      {loading ? (
        <div className="fv-grid" aria-busy="true" aria-label="Loading featured videos">
          <Skeleton style={{ height: 300 }} />
          <Skeleton style={{ height: 300 }} />
          <Skeleton style={{ height: 300 }} />
          <Skeleton style={{ height: 300 }} />
          <Skeleton style={{ height: 300 }} />
          <Skeleton style={{ height: 300 }} />
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="fv-grid">
            {items.map((v) => (
              <div key={v.id} className="feature-card">
                {playing === v.youtube_id ? (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${v.youtube_id}?autoplay=1`}
                      title={v.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{ display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
                    onClick={() => setPlaying(v.youtube_id)}
                    aria-label={`Play: ${v.title}`}
                  >
                    <CoverImg src={v.thumbnail_url} alt={v.title} seed={v.title} style={{ height: 200 }} />
                  </button>
                )}
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{v.title}</h3>
                  <div className="meta">
                    {v.source_name && <span>{v.source_name}</span>}
                    <span>{v.duration}</span>
                    <span>{v.language}</span>
                    <span>{v.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <button type="button" className="btn btn-primary" onClick={goVideos}>
              Explore more →
            </button>
          </div>
        </>
      ) : null}
    </Section>
  )
}
