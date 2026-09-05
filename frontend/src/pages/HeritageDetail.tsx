import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Heritage } from '../api/client'
import { PageHead, Band, Detail, Main, Aside, Facts, Provenance, Block, Show } from './_shared'
import { Empty, Skeleton, gradientFor } from '../components/ui'

export default function HeritageDetail() {
  const { id } = useParams()
  const { data: h, loading, error } = useFetch<Heritage>(`/heritage/${id}`)

  if (loading) return <Skeleton style={{ height: 360, marginTop: 30 }} />
  if (error || !h) return <Empty big="🏛️" text="Heritage site not found — the dataset hasn’t been connected." />

  const nearby = h.nearby ?? []

  return (
    <>
      <div className="container">
        <PageHead
          title={h.name}
          sub={h.description || ''}
          crumbs={[
            { label: 'Heritage', to: '/heritage' },
            ...(h.state_name ? [{ label: h.state_name, to: `/states/${h.state_id}` }] : []),
            { label: h.name },
          ]}
        />
      </div>
      <div className="container"><Band label={h.name} /></div>

      <Detail>
        <Main>
          <Block title="History & Significance">
            {h.history ? <Show what={h.history} /> : <Show what={h.significance} />}
          </Block>
          {h.architecture && <Block title="Architecture"><Show what={h.architecture} /></Block>}
          {h.famous_people && <Block title="People connected to this site"><Show what={h.famous_people} /></Block>}
          {h.related_events && <Block title="Related events"><Show what={h.related_events} /></Block>}

          {nearby.length > 0 && (
            <Block title="Nearby attractions">
              <div className="card-grid tight">
                {nearby.map((n) => (
                  <Link key={n.id} to={`/heritage/${n.id}`} className="feature-card">
                    <div className="card-thumb" style={{ background: gradientFor(n.name), height: 90 }}>{n.name.slice(0, 1)}</div>
                    <div className="fc-body">
                      <h3>{n.name}</h3>
                      <p className="desc">{n.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Block>
          )}
        </Main>

        <Aside>
          <Facts
            rows={[
              { k: 'Category', v: h.category },
              { k: 'Location', v: h.location },
              { k: 'Period', v: h.historical_period },
              { k: 'Architecture', v: h.architecture },
              { k: 'City', v: h.city_name, to: h.city_id ? `/cities/${h.city_id}` : undefined },
              { k: 'State', v: h.state_name, to: h.state_id ? `/states/${h.state_id}` : undefined },
            ]}
          />
          <Provenance rows={h.provenance} />
        </Aside>
      </Detail>
    </>
  )
}