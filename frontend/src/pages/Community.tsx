import { useState } from 'react'
import { useFetch } from '../api/hooks'
import { post } from '../api/client'
import type { CommunityPost } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, TrustBadge } from '../components/ui'

export default function Community() {
  const { data: items, loading, reload } = useFetch<CommunityPost[]>('/community/posts')
  const [kind, setKind] = useState('Story')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setDone('')
    try {
      const r = await post<CommunityPost>('/community/posts', { kind, title, content, author_name: author })
      setDone(r.message || 'Thanks! Your story has been submitted for moderation.')
      setTitle(''); setContent(''); setAuthor('')
      reload()
    } catch {
      setErr('Could not submit — make sure the backend is connected.')
    }
  }

  return (
    <>
      <PageHead
        title="Community Voice"
        sub="Stories, memories and questions from travellers, students and culture lovers across India — moderated and merged with official data."
        crumbs={[{ label: 'Community' }]}
      />

      <div className="container grid-2" style={{ marginBottom: 44 }}>
        <div>
          {loading ? (
            <div className="card-grid"><Skeleton /><Skeleton /></div>
          ) : !items || items.length === 0 ? (
            <Empty big="💬" text="No contributions yet — be the first!" />
          ) : (
            <div className="feed">
              {items.map((p) => (
                <div className="feed-item" key={p.id}>
                  <div className="feed-head">
                    <span className="avatar">{p.author_name?.slice(0, 1) || '?'}</span>
                    <div>
                      <span className="chip">{p.kind}</span>{' '}
                      <b>{p.title}</b>
                      <div className="muted small">{p.author_name} · {new Date(p.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                  <p className="desc">{p.content}</p>
                  {(p.related_city || p.related_resource) && (
                    <div className="hero-strip">
                      {p.related_city && <span className="chip chip-green">📍 {p.related_city}</span>}
                      {p.related_resource && <span className="chip chip-green">{p.related_resource}</span>}
                    </div>
                  )}
                  <TrustBadge level={p.trust_level} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form className="form-card" onSubmit={submit} style={{ maxWidth: '100%', position: 'sticky', top: 84 }}>
            <h3 style={{ marginBottom: 12 }}>Share your story</h3>
            <div className="field">
              <label>Type</label>
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option>Story</option>
                <option>Question</option>
                <option>Memory</option>
                <option>Review</option>
              </select>
            </div>
            <div className="field">
              <label>Name</label>
              <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
            </div>
            <div className="field">
              <label>Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short headline" required />
            </div>
            <div className="field">
              <label>Story</label>
              <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell us about your visit, memory or question…" required />
            </div>
            {done && <p style={{ color: 'var(--green-deep)', fontSize: 13.5 }}>✓ {done}</p>}
            {err && <p style={{ color: 'var(--orange-deep)', fontSize: 13.5 }}>{err}</p>}
            <button className="btn btn-primary btn-block">Submit for review</button>
            <p className="muted small" style={{ marginTop: 8 }}>
              Every post is reviewed and tagged with a trust level so it’s clearly distinguished from official sources.
            </p>
          </form>
        </div>
      </div>
    </>
  )
}