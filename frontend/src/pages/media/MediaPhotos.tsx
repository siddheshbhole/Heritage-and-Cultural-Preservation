import { useState } from 'react'
import { useFetch } from '../../api/hooks'
import type { MediaAlbum } from '../../api/media'
import { PageHead } from '../_shared'
import { Empty, Skeleton, CoverImg } from '../../components/ui'

export default function MediaPhotos() {
  const [order, setOrder] = useState<'latest' | 'oldest'>('latest')
  const { data: items, loading, error, reload } = useFetch<MediaAlbum[]>(`/media/photos?order=${order}`)
  const [lightbox, setLightbox] = useState<MediaAlbum | null>(null)

  return (
    <>
      <PageHead
        title="Photo Gallery"
        sub="Official photo albums from the Ministry of Culture, Government of India."
        crumbs={[{ label: 'Media', to: '/media/photos' }, { label: 'Photos' }]}
      />

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="filters">
          <select
            className="input"
            value={order}
            onChange={(e) => setOrder(e.target.value as 'latest' | 'oldest')}
            aria-label="Sort order"
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <span className="muted" style={{ fontSize: 13 }}>{items?.length ?? 0} albums</span>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
        ) : items && items.length > 0 ? (
          <div className="card-grid">
            {items.map((album) => (
              <button
                key={album.id}
                type="button"
                className="feature-card"
                style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                onClick={() => setLightbox(album)}
              >
                <CoverImg src={album.cover_image} alt={album.title} seed={album.title} style={{ height: 200 }} />
                <div className="fc-body">
                  <h3 style={{ fontSize: 15 }}>{album.title}</h3>
                  <div className="meta">
                    <span>{album.items_count} photos</span>
                    <span>{album.date}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty big="📷" text="Photo albums will appear here." error={error} onRetry={reload} />
        )}
      </div>

      {lightbox && (
        <div className="media-lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">&times;</button>
            <CoverImg src={lightbox.cover_image} alt={lightbox.title} seed={lightbox.title} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            <div className="lightbox-info">
              <h3>{lightbox.title}</h3>
              <p>{lightbox.items_count} photos &middot; {lightbox.date}</p>
              {lightbox.gallery_url && (
                <a href={lightbox.gallery_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                  View on Ministry site &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
