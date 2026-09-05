import { Link } from 'react-router-dom'
import { gradientFor } from './ui'

const BUCKETS = [
  { to: '/states', icon: '🏛️', label: 'States & Cities', desc: '28 states · capitals · history · culture · living traditions' },
  { to: '/heritage', icon: '🏛️', label: 'Heritage Sites', desc: 'Monuments, forts, temples & archaeological treasures' },
  { to: '/museums', icon: '🖼️', label: 'Museums', desc: 'Museums of India branches & their collections' },
  { to: '/greats', icon: '🪔', label: 'Eminent Personalities', desc: 'Freedom fighters, icons & legends of Bharat' },
  { to: '/commemorations', icon: '🏅', label: 'Commemorations', desc: 'Jubilees, anniversaries & national celebrations' },
  { to: '/culture', icon: '🎭', label: 'Culture & Rituals', desc: 'Festivals, rituals, arts & living heritage' },
  { to: '/publications', icon: '📚', label: 'Publications', desc: 'Books, journals & scholarly works' },
  { to: '/papers', icon: '📜', label: 'Archival Documents', desc: 'Digitised records, treaties & manuscripts' },
  { to: '/schemes', icon: '🧾', label: 'Schemes & Programmes', desc: 'Government initiatives for culture & heritage' },
  { to: '/awards', icon: '🎖️', label: 'Awards & Honours', desc: 'Recognitions for cultural contributions' },
  { to: '/eternities', icon: '✒️', label: 'Scholars & Authors', desc: 'Researchers behind the cultural record' },
  { to: '/mous', icon: '🤝', label: 'MoUs & Partnerships', desc: 'Institutional collaborations & agreements' },
  { to: '/institutions', icon: '🏫', label: 'Institutions', desc: 'The bodies preserving Bharat’s culture' },
  { to: '/assistant', icon: '🤖', label: 'Culture AI', desc: 'Ask an AI guide for tailored culture & travel plans' },
  { to: '/extended', icon: '🧠', label: 'Extended Proposals', desc: 'A jungle book of thread ideas' },
]

export default function ExploreDashboard() {
  return (
    <div className="card-grid">
      {BUCKETS.map((b) => (
        <Link key={b.to} to={b.to} className="card">
          <div className="card-thumb" style={{ background: gradientFor(b.label), height: 120 }}>
            <span role="img" aria-hidden>{b.icon}</span>
          </div>
          <h3>{b.label}</h3>
          <p className="desc">{b.desc}</p>
        </Link>
      ))}
    </div>
  )
}