import { useState } from 'react'
import { useFetch } from '../../api/hooks'
import type { MediaLeader, MediaMonument, MediaArtist } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

type Tab = 'leaders' | 'monuments' | 'artists'

interface LeadersRes { items: MediaLeader[]; source: { source_name: string; source_url: string } }
interface MonumentsRes extends Array<MediaMonument> {}
interface ArtistsRes { categories: string[]; items: MediaArtist[]; source: { source_name: string; source_url: string } }

export default function MediaBharatBeat() {
  const [tab, setTab] = useState<Tab>('leaders')
  const [artistCat, setArtistCat] = useState('')

  const { data: leaders, loading: lLoading, error: lError, reload: lReload } = useFetch<LeadersRes>('/media/leaders')
  const { data: monuments, loading: mLoading, error: mError, reload: mReload } = useFetch<MediaMonument[]>('/media/monuments')
  const { data: artists, loading: aLoading, error: aError, reload: aReload } = useFetch<ArtistsRes>(
    artistCat ? `/media/artists?category=${encodeURIComponent(artistCat)}` : '/media/artists'
  )

  const loading = tab === 'leaders' ? lLoading : tab === 'monuments' ? mLoading : aLoading
  const error = tab === 'leaders' ? lError : tab === 'monuments' ? mError : aError
  const reload = tab === 'leaders' ? lReload : tab === 'monuments' ? mReload : aReload

  return (
    <>
      <PageHead
        title="Bharat Beat"
        sub="Leaders, monuments in 360°, and artists from the Ministry of Culture."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Bharat Beat' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <div className="media-tab-group">
            {(['leaders', 'monuments', 'artists'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`media-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'leaders' ? "Leader's Corner" : t === 'monuments' ? '360° Monuments' : 'Artists'}
              </button>
            ))}
          </div>
          {tab === 'artists' && artists?.categories && (
            <select
              className="input"
              value={artistCat}
              onChange={(e) => setArtistCat(e.target.value)}
              aria-label="Filter by artist category"
            >
              <option value="">All categories</option>
              {artists.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : error ? (
          <Empty big="⚠️" text="Something went wrong." error={error} onRetry={reload} />
        ) : tab === 'leaders' ? (
          leaders && leaders.items.length > 0 ? (
            <div className="card-grid">
              {leaders.items.map((l) => (
                <div key={l.id} className="feature-card">
                  <CoverImg src={l.image_url} alt={l.name} seed={l.name} style={{ height: 200 }} />
                  <div className="fc-body">
                    <h3 style={{ fontSize: 15 }}>{l.name}</h3>
                    <p className="desc" style={{ fontSize: 13, maxHeight: 80, overflow: 'hidden' }}>{l.bio.slice(0, 150)}...</p>
                    {l.official_url && (
                      <div className="meta">
                        <a href={l.official_url} target="_blank" rel="noreferrer">Read more &rarr;</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty big="👤" text="No leaders found." />
        ) : tab === 'monuments' ? (
          monuments && monuments.length > 0 ? (
            <div className="card-grid">
              {monuments.map((m) => (
                <div key={m.id} className="feature-card">
                  <CoverImg src={m.image_url} alt={m.name} seed={m.name} style={{ height: 200 }} />
                  <div className="fc-body">
                    <h3 style={{ fontSize: 15 }}>{m.name}</h3>
                    <div className="meta">
                      {m.streetview_url && (
                        <a href={m.streetview_url} target="_blank" rel="noreferrer">View in 360° &rarr;</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty big="🏛️" text="No monuments found." />
        ) : (
          artists && artists.items.length > 0 ? (
            <div className="card-grid">
              {artists.items.map((a) => (
                <div key={a.id} className="feature-card">
                  <CoverImg src={a.image_url} alt={a.name} seed={a.name} style={{ height: 200 }} />
                  <div className="fc-body">
                    <h3 style={{ fontSize: 15 }}>{a.name}</h3>
                    <div className="meta">
                      <span>{a.category}</span>
                      {a.official_url && (
                        <a href={a.official_url} target="_blank" rel="noreferrer">Official &rarr;</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty big="🎨" text="No artists found." />
        )}
      </div>
    </>
  )
}
