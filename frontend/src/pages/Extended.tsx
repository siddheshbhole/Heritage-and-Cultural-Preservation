import { Link } from 'react-router-dom'
import { PageHead } from './_shared'

const THREADS = [
  { t: 'Museum of India', d: 'A virtual national museum: 360° collections, digital exhibitions and loanable artefacts.' },
  { t: 'Falaknuma of Memories', d: 'Citizen-contributed family stories that slot into official timelines.' },
  { t: 'Kal ka Bharat', d: 'AI-generated “future archaeology” — what would today reveal about us a century hence?' },
  { t: 'Sanskriti Kosh', d: 'A treasure trove of folk arts, crafts and languages tagged by region.' },
  { t: 'Journey of the Inscription', d: 'Follow an inscription from quarry to museum with provenance at every step.' },
  { t: 'Pravas Meal', d: 'Regional kitchens mapped to diaspora communities around the world.' },
  { t: 'Ek Bharat Samvad', d: 'Live conversations pairing two states as “cultural siblings” for a week.' },
  { t: 'Heritage on Foot', d: 'Walkable itineraries with audio guides built from verified site records.' },
]

export default function Extended() {
  return (
    <>
      <PageHead
        title="Extended proposals"
        sub="A “jungle book” of thread ideas — each one a future feature built on the same connected dataset."
        crumbs={[{ label: 'Extended' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        <div className="card-grid">
          {THREADS.map((x) => (
            <div className="panel" key={x.t} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="chip chip-green">Idea</span>
              <h3 style={{ marginBottom: 0 }}>{x.t}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{x.d}</p>
            </div>
          ))}
        </div>

        <p className="muted small" style={{ marginTop: 26, maxWidth: 700 }}>
          These ideas are intentionally left as sketches. Want one built? It plugs straight into the existing
          API and UI patterns — <Link to="/assistant">ask the assistant</Link> to prototype it.
        </p>
      </div>
    </>
  )
}