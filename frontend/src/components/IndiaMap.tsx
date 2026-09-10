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

function regionAccent(region: string): string {
  const accents: Record<string, string> = {
    North: '#e8c87a',
    South: '#7ab8a8',
    East: '#c4a0d0',
    West: '#e8a87a',
    Northeast: '#8bc4a0',
    Central: '#c4b07a',
    Islands: '#7ab0c4',
  }
  return accents[region] || 'var(--green-soft)'
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

  const active = hover || selected

  return (
    <div className="map-wrap" style={{ maxWidth: 620, margin: '0 auto' }}>
      <svg viewBox={india.viewBox} className="india-map" role="img" aria-label="Interactive map of India">
        {india.locations.map((loc) => {
          const st = resolve(loc.name)
          const isHovered = st && st.id === hover?.id
          const isSelected = st && st.id === selected?.id
          return (
            <path
              key={loc.id}
              id={loc.id}
              d={loc.path}
              className={`state-path${st ? ' has-data' : ''}${isSelected ? ' selected' : ''}`}
              fill={isSelected ? 'var(--orange)' : isHovered && st ? regionAccent(st.region) : undefined}
              onMouseEnter={() => st && setHover(st)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (st) {
                  setSelected(st)
                  onSelect(st)
                }
              }}
              style={{ cursor: st ? 'pointer' : 'default', transition: 'fill 0.15s ease' }}
            />
          )
        })}
      </svg>
      {active && (
        <div className="map-tooltip" style={{ left: 24, top: 8, maxWidth: 260 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{active.name}</div>
          {active.description && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
              {active.description.length > 80 ? active.description.slice(0, 80) + '...' : active.description}
            </div>
          )}
          {active.heritage_count != null && (
            <div style={{ fontSize: 12, marginTop: 4, color: 'var(--green-deep)' }}>
              {active.heritage_count} heritage {active.heritage_count === 1 ? 'site' : 'sites'}
            </div>
          )}
          {active.capital && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              Capital: {active.capital}
            </div>
          )}
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