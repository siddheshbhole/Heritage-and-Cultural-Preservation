import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { State } from '../api/client'
import { PageHead, Band, Detail, Main, Aside, Facts, Provenance, Block, Show } from './_shared'
import { Empty, Skeleton } from '../components/ui'

const TABS = ['Overview', 'Cities', 'Heritage', 'Culture & Rituals', 'Museums']

export default function StateDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('Overview')
  const { data: s, loading, error } = useFetch<State>(`/states/${id}`)

  if (loading) return <Skeleton style={{ height: 400, marginTop: 30 }} />
  if (error || !s) return <Empty big="🏛️" text="State not found — the dataset hasn't been connected." error={error} />

  const cities = s.cities ?? []
  const heritage = cities.flatMap((c) => (c.heritage ?? []).map((h) => ({ ...h, city: c.name })))

  return (
    <>
      <div className="container">
        <PageHead
          title={s.name}
          sub={s.description || `Explore the history, culture and heritage of ${s.name}.`}
          crumbs={[{ label: 'States', to: '/states' }, { label: s.name }]}
        />
      </div>
      <div className="container">
        <Band label={s.name} />
      </div>

      <div className="container">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Detail>
        <Main>
          {tab === 'Overview' && (
            <>
              <Block title="History">
                <Show what={s.historical_overview || s.history} />
                {!s.historical_overview && !s.history && <p className="muted">Deep history content will appear here once the data source is connected.</p>}
              </Block>
              {s.cultural_identity && (
                <Block title="Cultural Identity">
                  <Show what={s.cultural_identity} />
                </Block>
              )}
              <Block title="Culture">
                <Show what={s.culture} />
              </Block>
              {s.iconic_battles && <Block title="Iconic Battles & Turning Points"><Show what={s.iconic_battles} /></Block>}
              {(s.categories?.length || 0) > 0 && (
                <Block title="What it's known for">
                  <div className="hero-strip">{s.categories.map((c) => <span key={c} className="chip chip-green">{c}</span>)}</div>
                </Block>
              )}
              {s.important_personalities && (
                <Block title="Important Personalities">
                  <Show what={s.important_personalities} />
                </Block>
              )}
              {cities.length > 0 && (
                <Block title="Cities to explore">
                  <div className="card-grid tight">
                    {cities.map((c) => (
                      <Link key={c.id} to={`/cities/${c.id}`} className="card">
                        <h3>{c.name}</h3>
                        <p className="desc">{c.description || (c.heritage?.length ? `${c.heritage.length} heritage sites` : '')}</p>
                      </Link>
                    ))}
                  </div>
                </Block>
              )}
            </>
          )}

          {tab === 'Cities' && (
            <Block title={`Cities in ${s.name}`}>
              {cities.length === 0 ? (
                <Empty text="Cities haven't been added yet." />
              ) : (
                <div className="card-grid">
                  {cities.map((c) => (
                    <Link key={c.id} to={`/cities/${c.id}`} className="feature-card">
                      <div className="fc-body">
                        <h3>{c.name}</h3>
                        <p className="desc">{c.description}</p>
                        <div className="meta">
                          <span>{c.heritage?.length ?? 0} heritage</span>
                          <span>{c.museums?.length ?? 0} museums</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Block>
          )}

          {tab === 'Heritage' && (
            <Block title={`Heritage sites in ${s.name}`}>
              {heritage.length === 0 ? (
                <Empty text="Heritage data hasn't been connected." />
              ) : (
                <div className="card-grid">
                  {heritage.map((h) => (
                    <Link key={h.id} to={`/heritage/${h.id}`} className="feature-card">
                      <div className="card-thumb" style={{ background: '#d8ecd9' }}>{h.name.slice(0, 1)}</div>
                      <div className="fc-body">
                        <span className="chip chip-green">{h.category}</span>
                        <h3>{h.name}</h3>
                        <div className="meta">
                          <span>{h.city}</span>
                          {h.location && <span>{h.location}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Block>
          )}

          {tab === 'Culture & Rituals' && (
            <>
              <Block title="Rituals & Traditions"><Show text="" what={s.rituals || s.culture} /></Block>
              <Block title="Handicrafts"><Show what={s.handicrafts} /></Block>
              <Block title="Festivals"><Show what={s.festivals} /></Block>
              <Block title="Food"><Show what={s.food} /></Block>
              {s.arts_and_crafts && <Block title="Arts & Crafts"><Show what={s.arts_and_crafts} /></Block>}
              {s.cuisine_and_languages && <Block title="Cuisine & Languages"><Show what={s.cuisine_and_languages} /></Block>}
              {!s.rituals && !s.handicrafts && !s.festivals && !s.food && !s.arts_and_crafts && !s.cuisine_and_languages && (
                <Empty text="Culture content will appear here once connected." />
              )}
            </>
          )}

          {tab === 'Museums' && (
            <Block title={`Museums in ${s.name}`}>
              {cities.flatMap((c) => (c.museums ?? []).map((m) => ({ ...m, city: c.name }))).length === 0 ? (
                <Empty text="Museum data hasn't been connected." />
              ) : (
                <div className="card-grid">
                  {cities.flatMap((c) => (c.museums ?? []).map((m) => ({ ...m, city: c.name }))).map((m) => (
                    <Link key={m.id} to={`/museums/${m.id}`} className="card">
                      <h3>{m.name}</h3>
                      <p className="desc">{m.description}</p>
                      <div className="meta"><span>{m.city}</span></div>
                    </Link>
                  ))}
                </div>
              )}
            </Block>
          )}
        </Main>

        <Aside>
          <Facts
            rows={[
              { k: 'Capital', v: s.capital, to: s.capital ? `/cities/${cities.find((c) => c.name === s.capital)?.id}` : undefined },
              { k: 'Region', v: s.region },
              { k: 'Code', v: s.code },
              { k: 'Heritage sites', v: heritage.length },
              { k: 'Cities', v: cities.length },
            ]}
          />
          <Provenance rows={s.provenance} />
          <div className="card">
            <h4>Keep exploring</h4>
            <div className="hero-strip">
              <Link to="/heritage" className="see-all">Heritage →</Link>
              <Link to="/culture" className="see-all">Culture →</Link>
            </div>
          </div>
        </Aside>
      </Detail>
    </>
  )
}
