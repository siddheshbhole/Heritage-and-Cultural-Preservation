import { useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { searchHeritage } from '../api/client'
import type { EnhancedSearchResult, EnhancedSearchResultItem, SearchInterpretedIntent } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import { useFetch } from '../api/hooks'

const detailTo: Record<string, (d: Record<string, unknown>) => string> = {
  state: (d) => `/states/${d.id}`,
  city: (d) => `/cities/${d.id}`,
  heritage: (d) => `/heritage/${d.id}`,
  museum: (d) => `/museums/${d.id}`,
}

function IntentBanner({ interpreted }: { interpreted?: SearchInterpretedIntent }) {
  if (!interpreted) return null
  const chips: Array<{ label: string }> = []
  if (interpreted.religion) chips.push({ label: interpreted.religion })
  if (interpreted.category) chips.push({ label: interpreted.category })
  if (interpreted.state) chips.push({ label: interpreted.state })
  if (interpreted.city) chips.push({ label: interpreted.city })
  if (interpreted.period) chips.push({ label: interpreted.period })
  if (chips.length <= 1) return null
  return (
    <div className="search-intent-banner">
      <span className="search-intent-label">Interpreted intent</span>
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6, marginLeft: 10 }}>
        {chips.map((c, i) => (
          <span key={i} className="chip chip-green" style={{ fontSize: 11.5 }}>
            ✓ {c.label}
          </span>
        ))}
      </span>
    </div>
  )
}

function MatchReasonBadge({ reason }: { reason: string }) {
  const classMap: Record<string, string> = {
    Fort: 'chip',
    Temple: 'chip',
    Cave: 'chip',
    Palace: 'chip',
    Monument: 'chip',
    UNESCO: 'chip chip-world',
    Museum: 'chip chip-blue',
    Maharashtra: 'chip',
    'Tamil Nadu': 'chip',
    Buddhist: 'chip chip-green',
    Hindu: 'chip chip-green',
  }
  const cls = classMap[reason] || 'chip chip-green'
  return (
    <span className={cls} style={{ marginRight: 0, fontSize: 11.5 }}>
      ✓ {reason}
    </span>
  )
}

function DidYouMean({
  didYouMean,
  onSuggestionClick,
}: {
  didYouMean?: string
  onSuggestionClick: (q: string) => void
}) {
  if (!didYouMean) return null
  return (
    <div className="search-did-you-mean">
      <span>Did you mean:</span>{' '}
      <button className="link-btn" onClick={() => onSuggestionClick(didYouMean)}>
        {didYouMean}
      </button>
    </div>
  )
}

const BADGED_TYPES = ['heritage', 'museum', 'state', 'city']

function ResultCard({ item, index }: { item: EnhancedSearchResultItem; index: number }) {
  const to = detailTo[item.type]?.(item.data)
  const imgUrl = BADGED_TYPES.includes(item.type) && typeof item.data.image_url === 'string' && item.data.image_url
    ? (item.data.image_url as string)
    : null

  const body = (
    <>
      <div className={`search-result-card${imgUrl ? '' : ' search-result-card-flat'}`}>
        {imgUrl && (
          <img
            className="search-result-img"
            src={imgUrl}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className="search-result-card-body">
          <div className="feed-head">
            <span className="chip chip-outline" style={{ fontSize: 11.5 }}>{item.type}</span>
            {item.match_reasons?.length ? (
              <span style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                {item.match_reasons.slice(0, 3).map((r, i) => (
                  <MatchReasonBadge key={i} reason={r} />
                ))}
              </span>
            ) : (
              <span className="trust trust-verified">rank {item.rank}</span>
            )}
          </div>
          <b style={{ fontSize: 16, fontFamily: 'var(--serif)' }}>{item.label}</b>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
            {item.summary}
          </p>
          {item.match_reasons && item.match_reasons.length > 3 && (
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              +{item.match_reasons.length - 3} more match signals
            </div>
          )}
        </div>
      </div>
    </>
  )
  return (
    <div className="feed-item" key={index}>
      {to ? (
        <Link to={to} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  )
}

function FilterSidebar({
  interpreted,
  results,
}: {
  interpreted?: SearchInterpretedIntent
  results: EnhancedSearchResultItem[]
}) {
  if (!interpreted || !results.length) return null
  const counts: Record<string, number> = {}
  results.forEach((r) => {
    counts[r.type] = (counts[r.type] || 0) + 1
  })
  const types = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const matchReasonCounts: Record<string, number> = {}
  results.forEach((r) => {
    r.match_reasons?.forEach((m) => {
      matchReasonCounts[m] = (matchReasonCounts[m] || 0) + 1
    })
  })
  const reasons = Object.entries(matchReasonCounts).sort((a, b) => b[1] - a[1])
  if (types.length <= 1 && !reasons.length) return null
  return (
    <div className="search-filters">
      <div className="search-filters-title">Filters</div>
      {types.map(([type, count]) => (
        <div key={type} className="search-filter-row">
          <span className="chip chip-outline" style={{ fontSize: 12 }}>
            {type}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>{count}</span>
        </div>
      ))}
      {reasons.length > 0 && (
        <>
          <div className="search-filters-title" style={{ marginTop: 12 }}>Match Reasons</div>
          {reasons.map(([m, count]) => (
            <div key={m} className="search-filter-row">
              <span className="chip chip-green" style={{ fontSize: 11 }}>✓ {m}</span>
              <span className="muted" style={{ fontSize: 12 }}>{count}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function Search() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') || ''
  const [input, setInput] = useState(q)
  const data = useFetch<EnhancedSearchResult>(q ? `/search?q=${encodeURIComponent(q)}` : null)
  const result = data.data
  const results = useMemo(
    () => (result?.results ?? []).slice().sort((a, b) => b.rank - a.rank),
    [result]
  )
  const onSuggestionClick = (s: string) => navigate(`/search?q=${encodeURIComponent(s)}`)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`)
  }

  return (
    <>
      <PageHead
        title={q ? `Results for "${q}"` : 'Search'}
        sub={
          result
            ? `${result.total} results found across the knowledge base.`
            : 'Search across states, cities, heritage sites, museums, personalities and documents.'
        }
        crumbs={[{ label: 'Search' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        <form className="search-input-row" onSubmit={onSubmit} role="search">
          <div className="search-input-shell">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by state, city, monument, dynasty or culture…"
              aria-label="Search heritage"
            />
            <button type="submit">Search</button>
          </div>
        </form>

        <div className="search-layout">
          <div className="search-main">
            {data.loading ? (
              <Skeleton />
            ) : results.length === 0 ? (
              <div className="search-empty-state">
                <DidYouMean didYouMean={result?.did_you_mean} onSuggestionClick={onSuggestionClick} />
                <Empty
                  big="🔍"
                  text={
                    q
                      ? 'No exact matches found. Try a different query.'
                      : 'Type in the search bar above to begin.'
                  }
                  error={data.error}
                  onRetry={data.reload}
                />
                {result?.suggestions && result.suggestions.length > 0 && (
                  <div className="search-fallback-suggestions">
                    <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Suggested queries:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.suggestions.map((s) => (
                        <button
                          key={s}
                          className="chip chip-outline"
                          onClick={() => onSuggestionClick(s)}
                          style={{ cursor: 'pointer', border: '1px solid var(--line)', background: '#fff' }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <IntentBanner interpreted={result?.interpreted} />
                <DidYouMean didYouMean={result?.did_you_mean} onSuggestionClick={onSuggestionClick} />
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  {result?.total} result{result?.total === 1 ? '' : 's'} found
                </div>
                <div className="feed">
                  {results.map((r, i) => (
                    <ResultCard key={i} item={r} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
          <FilterSidebar interpreted={result?.interpreted} results={results} />
        </div>
      </div>
    </>
  )
}