import { useMemo, useState } from 'react'
import india from '@svg-maps/india'
import type { State } from '../api/client'

export function MiniIndia() {
  return (
    <svg viewBox={india.viewBox} className="india-map" role="presentation" aria-hidden>
      {india.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          fill="var(--green-soft)"
          stroke="#fff"
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}

// Map @svg-maps/india location names to our State.name values.
const NAME_ALIAS: Record<string, string> = {
  'Andaman and Nicobar Islands': 'Andaman & Nicobar',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli',
  'Daman and Diu': 'Daman & Diu',
  'Andhra Pradesh': 'Andhra Pradesh',
}

export default function IndiaMap({ states, onSelect }: { states: State[]; onSelect: (s: State) => void }) {
  const [hover, setHover] = useState<State | null>(null)
  const [selected, setSelected] = useState<State | null>(null)

  const byName = useMemo(() => {
    const m = new Map<string, State>()
    for (const s of states) m.set(s.name.toLowerCase(), s)
    return m
  }, [states])

  const resolve = (locName: string): State | undefined => {
    const aliased = NAME_ALIAS[locName] ?? locName
    return byName.get(aliased.toLowerCase()) ?? byName.get(locName.toLowerCase())
  }

  return (
    <div className="map-wrap" style={{ maxWidth: 620, margin: '0 auto' }}>
      <svg viewBox={india.viewBox} className="india-map" role="img" aria-label="Interactive map of India">
        {india.locations.map((loc) => {
          const st = resolve(loc.name)
          return (
            <path
              key={loc.id}
              id={loc.id}
              d={loc.path}
              className={`state-path${st ? ' has-data' : ''}${st && st.id === selected?.id ? ' selected' : ''}`}
              onMouseEnter={() => st && setHover(st)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (st) {
                  setSelected(st)
                  onSelect(st)
                }
              }}
            />
          )
        })}
      </svg>
      {(hover || selected) && (
        <div className="map-tooltip" style={{ left: 24, top: 8 }}>
          {(hover || selected)!.name}
        </div>
      )}
      <p className="map-key" style={{ justifyContent: 'center' }}>
        <span><i style={{ background: 'var(--green-soft)' }} aria-hidden /> States available</span>
        <span><i style={{ background: 'var(--orange)' }} aria-hidden /> Selected</span>
        <span><i style={{ background: '#fdf3ea', border: '1px solid #eee' }} aria-hidden /> No data</span>
      </p>
    </div>
  )
}