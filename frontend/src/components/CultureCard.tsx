import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../api/client'

const FALLBACK_IMAGES: Record<string, string> = {
  'Ambubachi Mela': 'https://commons.wikimedia.org/wiki/Special:FilePath/Kamakhya_Temple%2C_Guwahati.jpg?width=960',
  'Bastar Dussehra': 'https://commons.wikimedia.org/wiki/Special:FilePath/Famous_Dussehra_Bastar_Jagdalpur_Chhattisgarh.jpg?width=960',
  'Bihu': 'https://commons.wikimedia.org/wiki/Special:FilePath/Bihu_Dance_%2C_Festival_of_India.jpg?width=960',
  'Bonalu': 'https://commons.wikimedia.org/wiki/Special:FilePath/Hyderabad_bonalu_series_%283%29.jpg?width=960',
  'Chhath Puja': 'https://commons.wikimedia.org/wiki/Special:FilePath/Offering_Arghya_in_the_Chhath_Celebrations.jpg?width=960',
  'Dev Deepawali': 'https://commons.wikimedia.org/wiki/Special:FilePath/Varanasi_2023_Dev_Deepawali_During_the_day_03.jpg?width=960',
  'Durga Puja': 'https://commons.wikimedia.org/wiki/Special:FilePath/Durga_Puja_Festival_-_Kolkata_October_2025.jpg?width=960',
  'Ganesh Chaturthi': 'https://commons.wikimedia.org/wiki/Special:FilePath/Eco_friendly_images_of_God_Ganesh_on_display_for_Ganesh_Chaturthi_celebrations.jpg?width=960',
  'Ganga Aarti': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ganga_aarti_at_varanasi_ghat_uttar_pradesh.jpg?width=960',
  'Hemis Festival': 'https://commons.wikimedia.org/wiki/Special:FilePath/Hemis_Monastery_02.jpg?width=960',
  'Hornbill Festival': 'https://commons.wikimedia.org/wiki/Special:FilePath/Hornbill_Festival_Nagaland_01.jpg?width=960',
  'Jagannath Snana Yatra': 'https://commons.wikimedia.org/wiki/Special:FilePath/Jagannath_Temple_on_2022_Snana_Jatra.jpg?width=960',
  'Jaipur Literature Festival': 'https://commons.wikimedia.org/wiki/Special:FilePath/Gopalkrishna_Gandhi_at_Jaipur_Literature_Festival_2026_%288%29.jpg?width=960',
  'Kala Ghoda Arts Festival': 'https://commons.wikimedia.org/wiki/Special:FilePath/Entrance_gate_to_Kala_Ghoda_Arts_Festival_2026.jpg?width=960',
  'Kanwar Yatra': 'https://commons.wikimedia.org/wiki/Special:FilePath/A_company_of_%27Kanwar_Yatra%27_devotee_raising_the_slogan_to_hail_the_mighty_Shiva.jpg?width=960',
  'Karthigai Deepam': 'https://commons.wikimedia.org/wiki/Special:FilePath/Karthigai_Deepam_002.jpg?width=960',
  'Lohri': 'https://commons.wikimedia.org/wiki/Special:FilePath/Lohri_Festival_Ritual_from_Punjab.jpg?width=960',
  'Mata Ki Chowki & Kumbh logistics': 'https://commons.wikimedia.org/wiki/Special:FilePath/2019_Kumbh_Mela_-_People_in_Allahabad.jpg?width=960',
  'Meenakshi Thirukalyanam': 'https://commons.wikimedia.org/wiki/Special:FilePath/Madurai_Meenakshi_Amman_Temple_Gopuram.jpg?width=960',
  'Mysuru Dasara': 'https://commons.wikimedia.org/wiki/Special:FilePath/Mysore_Dasara_procession.jpg?width=960',
  'Navratri Garba Utsav': 'https://commons.wikimedia.org/wiki/Special:FilePath/Garba_Navratri_03.jpg?width=960',
  'Onam': 'https://commons.wikimedia.org/wiki/Special:FilePath/Onam_Thriuvathira_Dance.jpg?width=960',
  'Pongal': 'https://commons.wikimedia.org/wiki/Special:FilePath/Pot_breaking_celebrations_with_human_pyramid_Pongal_Hindu_festival.jpg?width=960',
  'Pushkar Camel Fair': 'https://commons.wikimedia.org/wiki/Special:FilePath/Camels_of_Pushkar_Camel_Fair_%282015%29.jpg?width=960',
  'Rann Utsav': 'https://commons.wikimedia.org/wiki/Special:FilePath/White_salt_desert_at_Rann_of_Kutch.jpg?width=960',
  'Ratha Yatra': 'https://commons.wikimedia.org/wiki/Special:FilePath/Puri_Ratha_Yatra.jpg?width=960',
  'Sawai Gandharva Mahotsav': 'https://commons.wikimedia.org/wiki/Special:FilePath/Madhukar_Dhumal_at_Sawai_gandharva_Bhimsen_festival_2013.jpg?width=960',
  'Thaipusam': 'https://commons.wikimedia.org/wiki/Special:FilePath/Thaipusam_celebration_with_kavadi_ceremony_at_Little_India.jpg?width=960',
  'Theyyam': 'https://commons.wikimedia.org/wiki/Special:FilePath/Theyyam_performance_Kerala.jpg?width=960',
  'Thrissur Pooram': 'https://commons.wikimedia.org/wiki/Special:FilePath/Elephants_at_Thrissur_Puram.jpg?width=960',
}

function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(s: string) {
  const parts = s.trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w))
  if (parts.length === 0) return s.slice(0, 2).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function fallbackImageFor(event: Event) {
  return FALLBACK_IMAGES[event.name] ?? undefined
}

export function CultureCard({
  event,
  isRitual,
  onBook,
}: {
  event: Event
  isRitual: boolean
  onBook?: (e: Event) => void
}) {
  const fallback = fallbackImageFor(event)
  const [stage, setStage] = useState(event.image_url ? 0 : fallback ? 1 : 2)
  const [bright, setBright] = useState(false)
  const src = stage === 0 ? event.image_url ?? undefined : stage === 1 ? fallback : undefined

  const handleError = () => {
    if (stage === 0 && fallback) setStage(1)
    else setStage(2)
    setBright(false)
  }

  const handleLoad = (img: HTMLImageElement) => {
    try {
      const cnv = document.createElement('canvas')
      cnv.width = 24
      cnv.height = 24
      const ctx = cnv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 24, 24)
      const data = ctx.getImageData(0, 8, 24, 16).data
      let sum = 0
      let n = 0
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        n++
      }
      setBright(sum / n / 255 > 0.5)
    } catch {
      setBright(false)
    }
  }

  return (
    <article className={bright ? 'culture-card culture-card-bright' : 'culture-card'}>
      {stage === 2 ? (
        <div className="culture-card-bg culture-card-fallback" aria-hidden="true">
          <span>{initials(event.name)}</span>
        </div>
      ) : (
        <img
          className="culture-card-bg"
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={handleError}
          onLoad={(e) => handleLoad(e.currentTarget)}
        />
      )}
      <span className="culture-card-shade" aria-hidden="true" />

      <div className="culture-card-body">
        <div className="culture-card-top">
          <span className="culture-status">{(event.status || 'upcoming').toLowerCase()}</span>
          {event.category && <span className="culture-card-cat">{event.category}</span>}
        </div>

        <h3 className="culture-card-title">{event.name}</h3>

        {event.description && <p className="culture-card-desc">{event.description}</p>}

        <div className="culture-card-meta">
          <span className="culture-card-date">
            {event.start_date
              ? fmtDate(event.start_date) +
                (event.end_date && event.end_date !== event.start_date ? ` – ${fmtDate(event.end_date)}` : '')
              : ''}
          </span>
          <span className="culture-card-location">{event.location ?? ''}</span>
        </div>

        <div className="culture-card-actions">
          {isRitual && event.bookable && (
            <button className="culture-card-btn" type="button" onClick={() => onBook?.(event)}>
              Book Ticket
            </button>
          )}
          <Link className="culture-card-btn" to={`/culture/${event.id}`}>
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}