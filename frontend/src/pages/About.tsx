import { Link } from 'react-router-dom'
import { PageHead } from './_shared'

const PILLARS = [
  { t: 'Trust-labelled content', d: 'Every answer shows whether it comes from an official source, a curated record, or the community.' },
  { t: 'One archive, many doors', d: 'States, cities, heritage, museums, publications, documents, institutions and MoUs — all linked in one knowledge graph.' },
  { t: 'Grounded AI', d: 'Culture AI answers only from the connected dataset and links back to the exact source rows.' },
  { t: 'Made for Bharat, built on open data', d: 'Public-domain records and ministry links, with provenance shown wherever content appears.' },
]

export default function About() {
  return (
    <>
      <PageHead
        title="About this platform"
        sub="Sanskriti Setu is a SIH 2026 prototype — a single window to India's heritage and the institutions that preserve it."
        crumbs={[{ label: 'About' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        <p style={{ maxWidth: 720 }}>
          This platform aggregates rich, structured content about Indian states, cities, heritage sites,
          museums and cultural bodies into an unified digital archive. It is designed to be the public,
          fresh-facing layer over the official Ministry of Culture datasets — bringing the cultural record to
          citizens, students, tourists and researchers.
        </p>

        <div className="grid-2" style={{ marginTop: 26 }}>
          {PILLARS.map((p) => (
            <div className="panel" key={p.t}>
              <h4>{p.t}</h4>
              <p className="desc">{p.d}</p>
            </div>
          ))}
        </div>

        <div className="banner-cta" style={{ margin: '40px 0' }}>
          <div>
            <h3>Ready to explore?</h3>
            <p>Start from the map, or just ask the assistant.</p>
          </div>
          <div className="hero-strip">
            <Link to="/explore" className="btn btn-primary" style={{ background: '#e8630a' }}>Explore →</Link>
            <Link to="/assistant" className="btn btn-outline" style={{ background: '#fff' }}>Ask Culture AI</Link>
          </div>
        </div>

        <p className="muted small" style={{ maxWidth: 700 }}>
          This is an unofficial showcase build created for the Smart India Hackathon 2026 problem statement on
          heritage and culture preservation. All content is intended to cite the Ministry of Culture and
          public-domain sources.
        </p>
      </div>
    </>
  )
}