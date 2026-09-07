import { useFetch } from '../api/hooks'
import type { Award } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Awards() {
  const { data: items, loading } = useFetch<Award[]>('/awards')

  return (
    <>
      <PageHead
        title="Awards & Honours"
        sub="National honours celebrating artistic and cultural contributions."
        crumbs={[{ label: 'Awards' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <Skeleton style={{ height: 320 }} />
        ) : !items || items.length === 0 ? (
          <Empty big="🎖️" text="Award data hasn’t been connected yet." />
        ) : (
          <div className="card-grid">
            {items.map((a) => (
              <div className="card" key={a.id}>
                <span className="chip chip-green">{a.field}</span>
                <h3>{a.name}</h3>
                <p className="meta"><span>{a.year}</span><span>{a.recipient}</span></p>
                <p className="desc">{a.citation || a.description}</p>
                {a.official_url && <a className="btn btn-sm btn-outline" href={a.official_url} target="_blank" rel="noreferrer">Details ↗</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}