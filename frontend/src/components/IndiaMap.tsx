import { useMemo, useState } from 'react'
import india from '@svg-maps/india'
import type { State } from '../api/client'
import { themeForState, type StateTheme } from '../config/stateThemes'
import { getStateData, type CultureDataItem } from '../data'

export function MiniIndia() {
  return (
    <svg viewBox={india.viewBox} className="india-map" role="presentation" aria-hidden>
      {india.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          fill="var(--ivory-deep)"
          stroke="var(--archival-line)"
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
    North: '#b38728',
    South: '#7a9b7e',
    East: '#a58a8a',
    West: '#b5823f',
    Northeast: '#7f9c8a',
    Central: '#a89a6c',
    Islands: '#6f8aa0',
  }
  return accents[region] || 'var(--ivory-deep)'
}

/**
 * SVG defs for the state cultural themes. Region gradients are shared by the
 * states within a region (only one state is ever active at a time); motif
 * patterns cycle across states for subtle variety. Appending a gradient here
 * (plus an entry in ../config/stateThemes) is all a new theme needs.
 */
function ThemedDefs() {
  return (
    <defs>
      {/* Maharashtra reference theme */}
      <linearGradient id="theme-mh-fill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbe5cd" />
        <stop offset="0.55" stopColor="#f7ecd0" />
        <stop offset="1" stopColor="#efd9b0" />
      </linearGradient>
      <pattern
        id="theme-mh-motif"
        width={48}
        height={48}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <circle cx="9" cy="9" r="1.5" fill="#a6531f" opacity="0.4" />
        <circle cx="33" cy="33" r="1.1" fill="#a6531f" opacity="0.35" />
        <path d="M14 40 l5 -9 l5 9 z" fill="none" stroke="#7a2e1f" strokeWidth="1" opacity="0.3" />
        <circle cx="14" cy="14" r="0.9" fill="#7a2e1f" opacity="0.4" />
        <circle cx="40" cy="40" r="0.8" fill="#a6531f" opacity="0.4" />
      </pattern>

      {/* Region-wide gradient fills */}
      <linearGradient id="theme-fill-north" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#faf0dc" />
        <stop offset="1" stopColor="#f2e0ba" />
      </linearGradient>
      <linearGradient id="theme-fill-south" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3f1ea" />
        <stop offset="1" stopColor="#cde3d8" />
      </linearGradient>
      <linearGradient id="theme-fill-east" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#eee3f5" />
        <stop offset="1" stopColor="#dfd1ee" />
      </linearGradient>
      <linearGradient id="theme-fill-west" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fdeede" />
        <stop offset="1" stopColor="#f7dcbe" />
      </linearGradient>
      <linearGradient id="theme-fill-central" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6e9d0" />
        <stop offset="1" stopColor="#ecd7ac" />
      </linearGradient>
      <linearGradient id="theme-fill-ne" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3efe5" />
        <stop offset="1" stopColor="#cfe2d4" />
      </linearGradient>

      {/* Motif palette */}
      <pattern id="theme-motif-a" width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="11" cy="11" r="1.4" fill="#6d5a2e" opacity="0.3" />
        <circle cx="33" cy="33" r="1" fill="#6d5a2e" opacity="0.25" />
      </pattern>
      <pattern id="theme-motif-b" width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <path d="M10 10 l4 -6 l4 6 z" fill="none" stroke="#6d5a2e" strokeWidth="1" opacity="0.28" />
        <path d="M32 30 l4 -6 l4 6 z" fill="none" stroke="#6d5a2e" strokeWidth="1" opacity="0.22" />
      </pattern>
      <pattern id="theme-motif-c" width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <path d="M11 11 h8 M15 7 v8" stroke="#6d5a2e" strokeWidth="1" opacity="0.25" />
        <path d="M33 33 h8 M37 29 v8" stroke="#6d5a2e" strokeWidth="1" opacity="0.2" />
      </pattern>
      <pattern id="theme-motif-d" width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(60)">
        <rect x="10" y="10" width="5" height="5" fill="#6d5a2e" opacity="0.22" rx="1" />
        <rect x="32" y="32" width="4" height="4" fill="#6d5a2e" opacity="0.18" rx="1" />
      </pattern>
    </defs>
  )
}

const SECTIONS: Array<{ key: 'cities' | 'heritage' | 'culture' | 'museums'; label: string }> = [
  { key: 'cities', label: 'Cities' },
  { key: 'heritage', label: 'Heritage sites' },
  { key: 'culture', label: 'Rituals & culture' },
  { key: 'museums', label: 'Museums & galleries' },
]

/** Expandable list of curated entries for one dataset section. */
function MapSection({ label, items }: { label: string; items: CultureDataItem[] }) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, 3)

  return (
    <div className="map-info-sec">
      <button
        type="button"
        className="map-info-sec-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{label}</span>
        <span className="map-info-sec-count">{items.length}</span>
        <span className="map-info-sec-toggle">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="map-info-sec-body">
          {visible.map((item) => (
            <div className="map-info-sec-item" key={item.name}>
              {item.image && (
                <img
                  className="map-info-sec-item-thumb"
                  src={item.image}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="map-info-sec-item-body">
                <div className="map-info-sec-item-name">{item.name}</div>
                {item.description && (
                  <p className="map-info-sec-item-desc">{item.description}</p>
                )}
                {(item.location || item.type || item.sourceName) && (
                  <div className="map-info-sec-item-meta">
                    {item.location && <span className="map-info-sec-item-chip">{item.location}</span>}
                    {item.type && <span className="map-info-sec-item-chip">{item.type}</span>}
                    {item.sourceName && (
                      <span className="map-info-sec-item-src" title={item.sourceName}>
                        {item.sourceName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <button type="button" className="map-info-sec-more" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show less' : `Show all ${items.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function StateInformation({
  state,
  theme,
  onNavigate,
}: {
  state: State
  theme?: StateTheme
  onNavigate: () => void
}) {
  const data = getStateData(state.code)

  if (!data) {
    return (
      <div className="map-info-active" key={state.name}>
        <div className="map-info-region">
          <span className="map-info-dot" style={{ background: regionAccent(state.region) }} aria-hidden />
          {state.region} Region
        </div>
        <h3 className="map-info-name">{state.name}</h3>
        <span className="map-info-theme">{theme ? theme.label : 'Cultural Heritage'}</span>
        <p className="map-info-tagline">{theme ? theme.tagline : state.description}</p>
        <dl className="map-info-meta">
          <div>
            <dt>Capital</dt>
            <dd>{state.capital}</dd>
          </div>
          <div>
            <dt>Heritage sites</dt>
            <dd>{state.heritage_count ?? '\u2014'}</dd>
          </div>
        </dl>
        <p className="map-info-hint">Click any state to explore its heritage {'\u2192'}</p>
      </div>
    )
  }

  return (
    <div className="map-info-active" key={state.name}>
      <div className="map-info-region">
        <span className="map-info-dot" style={{ background: regionAccent(data.region) }} aria-hidden />
        {data.region} Region
      </div>
      {data.image && (
        <a
          href={data.imagePage}
          target="_blank"
          rel="noreferrer"
          title="Photo source (Wikimedia Commons)"
          className="map-info-state-photo"
        >
          <img
            className="map-info-state-img"
            src={data.image}
            alt={`${data.name} - representative photograph`}
            loading="lazy"
          />
        </a>
      )}
      <h3 className="map-info-name">{data.name}</h3>
      <span className="map-info-theme">{theme ? theme.label : 'Cultural Heritage'}</span>
      <p className="map-info-tagline">{data.overview}</p>

      <dl className="map-info-stats">
        <div>
          <dt>Cities</dt>
          <dd>{data.cities.length}</dd>
        </div>
        <div>
          <dt>Heritage</dt>
          <dd>{data.heritage.length}</dd>
        </div>
        <div>
          <dt>Culture</dt>
          <dd>{data.culture.length}</dd>
        </div>
        <div>
          <dt>Museums</dt>
          <dd>{data.museums.length}</dd>
        </div>
      </dl>

      <div className="map-info-sections">
        {SECTIONS.map((sec) => (
          <MapSection key={sec.key} label={sec.label} items={data[sec.key]} />
        ))}
      </div>

      <button type="button" className="map-info-cta" onClick={onNavigate}>
        Explore {data.name} {'\u2192'}
      </button>
      <p className="map-info-note">
        Curated from UNESCO, ASI, the Ministry of Culture and state tourism portals.
      </p>
    </div>
  )
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
  const theme = active ? themeForState(active.name) : undefined

  return (
    <div className="map-wrap" style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="map-layout">
        <div className="map-stage">
          <svg viewBox={india.viewBox} className="india-map" role="img" aria-label="Interactive map of India">
            <ThemedDefs />
            {india.locations.map((loc) => {
              const st = resolve(loc.name)
              const isHovered = st && st.id === hover?.id
              const isSelected = st && st.id === selected?.id
              const isActive = Boolean(isHovered || isSelected)
              const theme = st ? themeForState(st.name) : undefined

              let fill: string | undefined
              if (isSelected || isHovered) fill = 'var(--terracotta)'

              return (
                <g key={loc.id}>
                  <path
                    id={loc.id}
                    d={loc.path}
                    className={`state-path${st ? ' has-data' : ''}${isSelected ? ' selected' : ''}`}
                    fill={fill}
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
                  {theme && st && (
                    <path
                      d={loc.path}
                      className={`state-motif${isActive ? ' state-motif-on' : ''}`}
                      fill={`url(#${theme.motifId})`}
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <aside className="map-info" aria-live="polite">
          {active ? (
            <StateInformation
              state={active}
              theme={theme}
              onNavigate={() => onSelect(active)}
            />
          ) : (
            <div className="map-info-default">
              <p className="map-info-kicker">Interactive Map</p>
              <h3 className="map-info-name">Explore India&apos;s Cultural Heritage</h3>
              <p className="map-info-tagline">
                Hover over a state to read a short strand of its cultural story, then click
                through to discover monuments, museums and living traditions.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="map-key" style={{ justifyContent: 'center' }}>
        <span><i style={{ background: '#F1E8DA', border: '1px solid #d8cdba' }} aria-hidden /> State</span>
        <span><i style={{ background: 'var(--terracotta)' }} aria-hidden /> Hovered / selected</span>
      </p>
    </div>
  )
}