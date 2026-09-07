import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { Museum } from '../api/client'
import { PageHead, Band, Detail, Main, Aside, Facts, Block, Show } from './_shared'
import { Empty, Skeleton } from '../components/ui'

export default function MuseumDetail() {
  const { id } = useParams()
  const { data: m, loading, error } = useFetch<Museum>(`/museums/${id}`)

  if (loading) return <Skeleton style={{ height: 320, marginTop: 30 }} />
  if (error || !m) return <Empty big="🖼️" text="Museum not found — the dataset hasn’t been connected." error={error} />

  return (
    <>
      <div className="container">
        <PageHead
          title={m.name}
          sub={m.description || ''}
          crumbs={[{ label: 'Museums', to: '/museums' }, { label: m.name }]}
        />
      </div>
      <div className="container"><Band label={m.name} /></div>

      <Detail>
        <Main>
          <Block title="Collections">
            <Show what={m.collections} />
            {!m.collections && <p className="muted">Collection details will appear once the data source is connected.</p>}
          </Block>
          {m.official_url && (
            <p><a className="btn btn-sm btn-green" href={m.official_url} target="_blank" rel="noreferrer">Visit official site ↗</a></p>
          )}
        </Main>
        <Aside>
          <Facts
            rows={[
              { k: 'Location', v: m.location },
              { k: 'Official site', v: m.official_url },
            ]}
          />
          <div className="card">
            <h4>Plan a visit</h4>
            <p className="desc">Ask Culture AI for heritage near this museum.</p>
            <Link to="/assistant" className="btn btn-sm btn-primary">Ask →</Link>
          </div>
        </Aside>
      </Detail>
    </>
  )
}