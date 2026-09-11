import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { City, State } from '../api/client'
import { PageHead, Band, Detail, Main, Aside, Facts, Provenance, Block, Show } from './_shared'
import { CoverImg, Empty, Skeleton } from '../components/ui'
import { getStateData } from '../data'

const TABS = ['Overview', 'Cities', 'Heritage', 'Culture & Rituals', 'Museums']

/** Normalise a place name for matching curated entries with API records. */
function normName(s: string): string {
  return s.toLowerCase().replace(/[(),.'&-]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Photo card for a curated city / heritage / culture / museum entry. */
function EntryCard({
  name,
  description,
  type,
  location,
  image,
  imageCredit,
  linkTo,
}: {
  name: string
  description?: string
  type?: string
  location?: string
  image?: string
  imageCredit?: string
  linkTo?: string
}) {
  const inner = (
    <>
      {image ? (
        <div className="card-thumb">
          <CoverImg src={image} alt={`${name} - photograph`} seed={name} />
        </div>
      ) : (
        <div className="card-thumb" style={{ background: '#f6e3cf' }}>{name.slice(0, 1)}</div>
      )}
      <div className="fc-body">
        {type && <span className="chip">{type}</span>}
        <h3>{name}</h3>
        {description && <p className="desc">{description}</p>}
        {(location || imageCredit) && (
          <div className="meta">
            {location && <span>{location}</span>}
            {imageCredit && <span className="photo-credit" title="Wikimedia Commons">Photo: {imageCredit}</span>}
          </div>
        )}
      </div>
    </>
  )
  if (linkTo) {
    return (
      <Link key={name} to={linkTo} className="feature-card">
        {inner}
      </Link>
    )
  }
  return (
    <div key={name} className="feature-card entry-card">
      {inner}
    </div>
  )
}

export default function StateDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('Overview')
  const { data: s, loading, error } = useFetch<State>(`/states/${id}`)

  if (loading) return <Skeleton style={{ height: 400, marginTop: 30 }} />
  if (error || !s) return <Empty big="🏛️" text="State not found — the dataset hasn't been connected." error={error} />

  const curated = getStateData(s.code)
  const apiCities: City[] = s.cities ?? []
  const apiCityByName = new Map(apiCities.map((c) => [normName(c.name), c]))

  // Normalised, unified entries so curated + API data render through one card.
  const cities = curated
    ? curated.cities.map((c) => ({
        name: c.name,
        description: c.description,
        image: c.image,
        imageCredit: c.imageCredit,
        apiId: apiCityByName.get(normName(c.name))?.id,
      }))
    : apiCities.map((c) => ({ name: c.name, description: c.description || undefined, image: c.image_url || undefined, imageCredit: undefined, apiId: c.id }))

  const apiHeritage = apiCities.flatMap((c) => (c.heritage ?? []).map((h) => ({ name: h.name, description: h.description || undefined, type: h.category, location: h.location || undefined, apiId: h.id })))
  const heritage = curated
    ? curated.heritage.map((h) => ({ name: h.name, description: h.description, type: h.type, location: h.location, apiId: apiHeritage.find((a) => a.name === h.name)?.apiId }))
    : apiHeritage

  const museums = curated
    ? curated.museums.map((m) => ({ name: m.name, description: m.description, type: m.type, location: m.location }))
    : apiCities.flatMap((c) =>
        (c.museums ?? []).map((m) => ({ name: m.name, description: m.description || undefined, location: c.name })),
      )

  const culture = curated?.culture ?? null
  const counts = curated
    ? { cities: curated.cities.length, heritage: curated.heritage.length, culture: curated.culture.length, museums: curated.museums.length }
    : null

  return (
    <>
      <div className="container">
        <PageHead
          title={s.name}
          sub={s.description || curated?.overview || `Explore the history, culture and heritage of ${s.name}.`}
          crumbs={[{ label: 'States', to: '/states' }, { label: s.name }]}
        />
      </div>

      {curated?.image ? (
        <div className="container">
          <div className="state-hero">
            <CoverImg
              src={curated.image}
              alt={`${s.name} — representative photograph`}
              seed={s.name}
            />
          </div>
        </div>
      ) : (
        <div className="container">
          <Band label={s.name} />
        </div>
      )}

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
                <Show what={s.historical_overview || s.history || curated?.overview} />
                {!s.historical_overview && !s.history && !curated?.overview && (
                  <p className="muted">Deep history content will appear here once the data source is connected.</p>
                )}
              </Block>
              {s.cultural_identity && (
                <Block title="Cultural Identity">
                  <Show what={s.cultural_identity} />
                </Block>
              )}
              <Block title="Culture">
                <Show what={s.culture} />
                {!s.culture && !!(culture && culture.length > 0) && (
                  <p className="muted">Living traditions of {s.name} are listed below under ‘Rituals & Culture’.</p>
                )}
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
                    {cities.slice(0, 6).map((c) => (
                      <EntryCard
                        key={c.name}
                        name={c.name}
                        description={c.description}
                        image={c.image}
                        imageCredit={c.imageCredit}
                        linkTo={c.apiId ? `/cities/${c.apiId}` : undefined}
                      />
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
                    <EntryCard
                      key={c.name}
                      name={c.name}
                      description={c.description}
                      image={c.image}
                      imageCredit={c.imageCredit}
                      linkTo={c.apiId ? `/cities/${c.apiId}` : undefined}
                    />
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
                  {heritage.map((h, i) => (
                      <EntryCard
                        key={h.name + i}
                        name={h.name}
                        description={h.description}
                        type={h.type}
                        location={h.location}
                        linkTo={h.apiId ? `/heritage/${h.apiId}` : undefined}
                      />
                    ))}
                </div>
              )}
            </Block>
          )}

          {tab === 'Culture & Rituals' && (
            <>
              <Block title="Rituals & Culture">
                {culture && culture.length > 0 ? (
                  <div className="card-grid">
                    {culture.map((c, i) => (
                      <EntryCard
                        key={c.name + i}
                        name={c.name}
                        description={c.description}
                        type={c.type}
                        location={c.location}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty text="Culture content will appear here once connected." />
                )}
              </Block>
              {s.rituals && <Block title="Rituals & Traditions"><Show what={s.rituals} /></Block>}
              {s.handicrafts && <Block title="Handicrafts"><Show what={s.handicrafts} /></Block>}
              {s.festivals && <Block title="Festivals"><Show what={s.festivals} /></Block>}
              {s.food && <Block title="Food"><Show what={s.food} /></Block>}
              {s.arts_and_crafts && <Block title="Arts & Crafts"><Show what={s.arts_and_crafts} /></Block>}
              {s.cuisine_and_languages && <Block title="Cuisine & Languages"><Show what={s.cuisine_and_languages} /></Block>}
            </>
          )}

          {tab === 'Museums' && (
            <Block title={`Museums in ${s.name}`}>
              {museums.length === 0 ? (
                <Empty text="Museum data hasn't been connected." />
              ) : (
                <div className="card-grid">
                  {museums.map((m, i) => (
                    <EntryCard
                      key={m.name + i}
                      name={m.name}
                      description={m.description}
                      location={m.location}
                    />
                  ))}
                </div>
              )}
            </Block>
          )}
        </Main>

        <Aside>
          <Facts
            rows={[
              { k: 'Capital', v: s.capital, to: s.capital ? `/cities/${apiCityByName.get(normName(s.capital))?.id}` : undefined },
              { k: 'Region', v: s.region },
              { k: 'Code', v: s.code },
              { k: 'Cities', v: counts?.cities ?? cities.length },
              { k: 'Heritage sites', v: counts?.heritage ?? heritage.length },
              { k: 'Culture entries', v: counts?.culture },
              { k: 'Museums', v: counts?.museums },
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