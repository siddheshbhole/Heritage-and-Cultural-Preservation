import { useState } from 'react'
import AIChat from '../components/AIChat'
import { PageHead } from './_shared'

const SUGGESTIONS = [
  'Suggest a 3-day heritage itinerary for Jaipur',
  'What festivals happen in Tamil Nadu in January?',
  'Tell me about the Chola temples',
  'Which museums are near Red Fort?',
  'What is the food culture of Bengal?',
]

export default function AssistantPage() {
  const [q, setQ] = useState('')

  return (
    <>
      <PageHead
        title="Ask Culture AI"
        sub="A grounded travel & heritage guide built on the Ministry of Culture dataset. Responses link back to source documents so you can trust every answer."
        crumbs={[{ label: 'Assistant' }]}
      />

      <div className="container" style={{ marginBottom: 44 }}>
        <div className="hero-strip" style={{ marginBottom: 14 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="filter-pill" onClick={() => setQ(s)}>{s}</button>
          ))}
        </div>
        <AIChat />
        {q && (
          <p className="muted small" style={{ marginTop: 8 }}>
            Tip: we pre-filled “{q}” — press Send to ask. 🚀
          </p>
        )}
      </div>
    </>
  )
}