/**
 * Data model for the curated "Cultural Atlas of India" state dataset used by
 * the interactive India map's side information panel.
 *
 * The dataset lives on the frontend so the map panel loads instantly on hover,
 * independent of backend seed data. Every entry carries source attribution so
 * each fact is traceable to an official or reputable source.
 */

/** A single curated entry within a state's section. */
export interface CultureDataItem {
  /** Display name, e.g. "Ajanta Caves" or "Kuchipudi". */
  name: string
  /** One-to-two sentence website-friendly description. */
  description: string
  /** Sub-category tag, e.g. "Temple", "Dance", "Craft", "Museum". */
  type?: string
  /** City / location, where relevant. */
  location?: string
  /** Human-readable source label, e.g. "UNESCO World Heritage Centre". */
  sourceName?: string
  /** URL of the source, where available. */
  source?: string
  /** Licensed photograph (Wikimedia Commons) for this place, where available. */
  image?: string
  /** Attribution line for `image`, e.g. "Author / CC BY-SA 4.0". */
  imageCredit?: string
  /** Commons description page for the photograph. */
  imagePage?: string
}

export interface StateCultureData {
  /** Official state name, matching the map/API ("Maharashtra"). */
  name: string
  /** ISO state code ("MH"). */
  code: string
  /** Census-style region grouping ("North", "South", ...). */
  region: string
  capital: string
  /** Concise overview of the state's cultural identity (1 short paragraph). */
  overview: string
  cities: CultureDataItem[]
  heritage: CultureDataItem[]
  culture: CultureDataItem[]
  museums: CultureDataItem[]
  /** Representative licensed photograph for the state. */
  image?: string
  /** Attribution line for `image`. */
  imageCredit?: string
  /** Commons description page for the photograph. */
  imagePage?: string
}

/** Source constants reused across the dataset for reliable attribution. */
export const OFFICIAL_SOURCES = {
  unesco: 'UNESCO World Heritage Centre',
  as: 'Archaeological Survey of India',
  culture: 'Ministry of Culture',
  indianCulture: 'Indian Culture Portal (Ministry of Culture)',
  museumsDirectory: 'Directory of Museums in India (Ministry of Culture)',
  stateTourism: 'State Tourism Department',
  asiMuseum: 'ASI Site Museum',
} as const