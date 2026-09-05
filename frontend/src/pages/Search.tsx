import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import { withQuery } from '../api/hooks'
import type { SearchResult } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'

const detailTo: Record<string, (d: Record<string, unknown>) => string> = {
  State: (d) => `/states/${d.id}`,
  City: (d) => `/cities/${d.id}`,
  Heritage: (d) => `/heritage/${d.id}`,
  HeritageSite: (d) => `/heritage/${d.id}`,
  Museum: (d) => `/museums/${d.id}`,
}

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const path = useMemo(() => (q ? withQuery('/search', { q }) : null), [q])
  const { data, loading } = useFetch<SearchResult>(path)

  const results = (data?.results ?? []).sort((a, b) => b.rank - a.rank)

  return (
    <>
      <PageHead
        title={q ? `Results for “${q}”` : 'Search'}
        sub={data ? `${data.total} results found across the knowledge base.` : 'Search across states, cities, heritage sites, museums, personalities and documents.'}
        crumbs={[{ label: 'Search' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        {loading ? (
          <Skeleton />
        ) : results.length === 0 ? (
          <Empty big="🔍" text={q ? 'Nothing matched. Try a different query.' : 'Type in the search bar above to begin.'} />
        ) : (
          <div className="feed">
            {results.map((r, i) => {
              const to = detailTo[r.type]?.(r.data)
              const body = (
                <>
                  <div className="feed-head">
                    <span className="chip chip-green">{r.type}</span>
                    <span className="trust trust-verified">rank {r.rank}</span>
                  </div>
                  <b style={{ fontSize: 16 }}>{r.label}</b>
                  <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{r.summary}</p>
                </>
              )
              return (
                <div className="feed-item" key={i}>
                  {to ? <Link to={to} style={{ color: 'inherit' }}>{body}</Link> : body}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}