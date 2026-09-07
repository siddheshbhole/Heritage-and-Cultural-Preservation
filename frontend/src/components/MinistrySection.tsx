import type { MinistryData } from '../api/client'
import { Section, Skeleton, StatCard } from './ui'

export default function MinistrySection({ data, loading }: { data: MinistryData | null; loading: boolean }) {
  if (loading) {
    return (
      <Section kicker="Ministry of Culture · Government of India" title="About the Ministry" alt="alt">
        <Skeleton style={{ height: 220 }} />
      </Section>
    )
  }
  if (!data) return null

  const stats = [
    { value: data.stats.attached_offices, label: 'Attached offices' },
    { value: data.stats.subordinate_offices, label: 'Subordinate offices' },
    { value: data.stats.autonomous_organizations, label: 'Autonomous organizations' },
  ]

  return (
    <Section
      kicker="Ministry of Culture · Government of India"
      title={data.heading}
      alt="alt"
      action={
        <a className="see-all" href={data.organisations_url} target="_blank" rel="noreferrer">
          Explore organizations →
        </a>
      }
    >
      <div className="ministry">
        <div className="ministry-split">
          <div className="ministry-copy">
            <p>{data.about}</p>
            <blockquote className="ministry-quote">
              <span className="ministry-quote-label">Our mission</span>
              {data.mission}
            </blockquote>
          </div>
          <div className="ministry-stats">
            {stats.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <div className="ministry-leaders">
          {data.leaders.map((l) => (
            <article className="ministry-leader" key={l.id}>
              <img src={l.image_url ?? undefined} alt={`${l.name}, ${l.designation}`} loading="lazy" />
              <div className="ministry-leader-body">
                <h3>
                  {l.title ? `${l.title} ` : ''}
                  {l.name}
                </h3>
                <p className="ministry-post">{l.designation}</p>
                {l.official_url && (
                  <a className="btn btn-outline btn-sm" href={l.official_url} target="_blank" rel="noreferrer">
                    View official profile →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="ministry-foot">
          <p className="muted">
            Facts sourced from{' '}
            <a href={data.source_url} target="_blank" rel="noreferrer">
              {data.source_name}
            </a>
            {data.updated_at ? ` · Updated ${data.updated_at}` : ''}
          </p>
          <a className="see-all" href={data.directory_url} target="_blank" rel="noreferrer">
            Meet the full team →
          </a>
        </div>
      </div>
    </Section>
  )
}