import { useFetch } from '../api/hooks'
import type { Institution } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function Institutions() {
  const { data: items, loading, error, reload } = useFetch<Institution[]>('/institutions')

  return (
    <>
      <PageHead
        title="Institutions"
        sub="The ministries, academies and bodies responsible for preserving and promoting Indian culture."
        crumbs={[{ label: 'Institutions' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <Skeleton style={{ height: 320 }} />
        ) : !items || items.length === 0 ? (
          <Empty big="🏫" text="Institution data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid">
            {items.map((i) => (
              <div className="card" key={i.id}>
                <span className="chip chip-green">{i.type}</span>
                <h3>{i.name}</h3>
                <p className="meta">{i.location}</p>
                <p className="desc">{i.description}</p>
                {i.responsibilities && <p className="meta" style={{ marginTop: 6 }}>Mandate: {i.responsibilities}</p>}
                {i.official_url && <a className="btn btn-sm btn-outline" href={i.official_url} target="_blank" rel="noreferrer">Official ↗</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}