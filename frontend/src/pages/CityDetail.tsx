import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { City } from '../api/client'
import { PageHead, Band, Detail, Main, Aside, Facts, Block, Show } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function CityDetail() {
  const { id } = useParams()
  const { data: c, loading, error } = useFetch<City>(`/cities/${id}`)

  if (loading) return <Skeleton style={{ height: 360, marginTop: 30 }} />
  if (error || !c) return <Empty big="🏙️" text="City not found — the dataset hasn’t been connected." />

  const heritage = c.heritage ?? []
  const museums = c.museums ?? []

  return (
    <>
      <div className="container">
        <PageHead
          title={c.name}
          sub={c.description || `Discover ${c.name}.`}
          crumbs={[
            { label: 'States', to: '/states' },
            { label: c.state_name || (c.state_id ? 'State' : 'States'), to: c.state_id ? `/states/${c.state_id}` : '/states' },
            { label: c.name },
          ]}
        />
      </div>
      <div className="container"><Band label={c.name} /></div>

      <Detail>
        <Main>
          <Block title="History"><Show what={c.history} /></Block>
          <Block title="Culture & Traditions"><Show what={c.culture || c.rituals} /></Block>
          {(c.handicrafts || c.food) && (
            <>
              <Block title="Handicrafts"><Show what={c.handicrafts} /></Block>
              <Block title="Food"><Show what={c.food} /></Block>
            </>
          )}
          {c.iconic_battles && <Block title="Iconic Battles"><Show what={c.iconic_battles} /></Block>}

          <Block title="Heritage sites">
            {heritage.length === 0 ? (
              <p className="muted">Heritage data hasn’t been connected.</p>
            ) : (
              <div className="card-grid">
                {heritage.map((h) => (
                  <Link key={h.id} to={`/heritage/${h.id}`} className="feature-card">
                    <div className="card-thumb" style={{ background: '#d8ecd9' }}>{h.name.slice(0, 1)}</div>
                    <div className="fc-body">
                      <span className="chip chip-green">{h.category}</span>
                      <h3>{h.name}</h3>
                      {h.location && <p className="desc">{h.location}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Block>

          <Block title="Museums">
            {museums.length === 0 ? (
              <p className="muted">Museum data hasn’t been connected.</p>
            ) : (
              <div className="card-grid tight">
                {museums.map((m) => (
                  <Link key={m.id} to={`/museums/${m.id}`} className="card">
                    <h3>{m.name}</h3>
                    <p className="desc">{m.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Block>
        </Main>

        <Aside>
          <Facts
            rows={[
              { k: 'State', v: c.state_name, to: c.state_id ? `/states/${c.state_id}` : undefined },
              { k: 'Heritage sites', v: heritage.length },
              { k: 'Museums', v: museums.length },
              ...(c.latitude ? [{ k: 'Coordinates', v: `${c.latitude?.toFixed(3)}, ${c.longitude?.toFixed(3)}` }] : []),
            ]}
          />
        </Aside>
      </Detail>
    </>
  )
}