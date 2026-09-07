import { useFetch } from '../api/hooks'
import type { Author } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'

export default function Eternities() {
  const { data: items, loading, error, reload } = useFetch<Author[]>('/authors')

  return (
    <>
      <PageHead
        title="Scholars & Authors"
        sub="The researchers, historians and chroniclers who built the cultural record of Bharat."
        crumbs={[{ label: 'Scholars' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <div className="card-grid"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : !items || items.length === 0 ? (
          <Empty big="✒️" text="Scholar data hasn’t been connected yet." error={error} onRetry={reload} />
        ) : (
          <div className="card-grid wide">
            {items.map((a) => (
              <div className="card" key={a.id}>
                <div className="thumb-x" style={{ background: gradientFor(a.name), minHeight: 70 }}>{a.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}</div>
                <span className="chip chip-green">{a.field}</span>
                <h3>{a.name}</h3>
                <p className="desc">{a.biography}</p>
                <div className="meta">
                  <span>{a.period}</span>
                  {a.institutions && <span>{a.institutions}</span>}
                </div>
                {a.research && <p className="meta" style={{ marginTop: 4 }}>Research: {a.research}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}