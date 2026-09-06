const API_BASE = '/api'

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export interface HomeData {
  apps: CultureApp[]
  announcements: Announcement[]
  events: Event[]
  featured_heritage: Heritage[]
  showcase: GovernmentProgramme[]
  stats: { states: number; cities: number; heritage_sites: number; museums: number; publications: number; events: number }
}

export interface Statistics {
  states_ut: number
  heritage_resources: number
  museums: number
  festivals_events: number
  publications: number
  cities: number
}

export interface ShowcaseItem {
  id: number
  title: string
  description: string
  category: string
  image_url: string | null
  official_url: string
  action: string
  source_label?: string
  source_url?: string | null
  imageFit?: 'cover' | 'contain'
  imagePosition?: string
  bgColor?: string
  playStoreUrl?: string
  appStoreUrl?: string
  qrUrl?: string | null
  qrLabel?: string
}

export interface GovernmentProgramme extends ShowcaseItem {
  source_label: string
  source_url: string | null
}

export interface State {
  id: number
  name: string
  code: string
  region: string
  capital: string
  description: string | null
  history: string | null
  culture: string | null
  rituals: string | null
  handicrafts: string | null
  food: string | null
  festivals: string | null
  iconic_battles: string | null
  image_url: string | null
  categories: string[]
  cities?: City[]
  heritage_count?: number
  provenance?: Record<string, string>
}

export interface City {
  id: number
  state_id: number
  name: string
  description: string | null
  history: string | null
  culture: string | null
  rituals: string | null
  handicrafts: string | null
  food: string | null
  iconic_battles: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  categories: string[]
  state_name?: string
  heritage?: Heritage[]
  museums?: Museum[]
  state_festivals?: string[]
  provenance?: Record<string, string>
}

export interface Heritage {
  id: number
  city_id: number | null
  state_id: number
  name: string
  category: string
  description: string | null
  history: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  historical_period: string | null
  architecture: string | null
  significance: string | null
  famous_people: string | null
  related_events: string | null
  image_url: string | null
  featured: boolean
  city_name?: string
  state_name?: string
  nearby?: Heritage[]
  provenance?: Record<string, string>
}

export interface Museum {
  id: number
  city_id: number | null
  name: string
  description: string | null
  collections: string | null
  location: string | null
  image_url: string | null
  official_url: string | null
}

export interface CultureApp {
  id: number
  title: string
  description: string
  category: string
  official_url: string
  image_url: string | null
  action: string
}

export interface Announcement {
  id: number
  title: string
  date: string
  source: string
  summary: string
  url: string
}

export interface Event {
  id: number
  name: string
  category: string
  start_date: string
  end_date: string
  location: string
  state_id: number | null
  city_id: number | null
  description: string
  image_url: string | null
  organizer: string
  official_url: string | null
  registration_url: string | null
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}

export interface Scheme {
  id: number
  name: string
  description: string
  category: string
  eligibility: string
  benefits: string
  application_info: string
  year: string
  organization: string
  official_url: string
}

export interface Award {
  id: number
  name: string
  year: string
  recipient: string
  field: string
  citation: string
  description: string
  official_url: string
}

export interface Commemoration {
  id: number
  name: string
  period: string
  field: string
  contribution: string
  significance: string
  locations: string
  people: string
  related_events: string
  sources: string
}

export interface Personality {
  id: number
  name: string
  period: string
  field: string
  biography: string
  achievements: string
  legacy: string
  locations: string
  image_url: string | null
}

export interface Document {
  id: number
  title: string
  year: string
  organization: string
  description: string
  doc_type: string
  source_url: string
  file_url: string | null
  rights_status: string
}

export interface Author {
  id: number
  name: string
  biography: string
  field: string
  period: string
  institutions: string
  research: string
  image_url: string | null
  publications?: Publication[]
}

export interface Publication {
  id: number
  author_id: number | null
  title: string
  publisher: string
  year: string
  language: string
  subject: string
  isbn: string | null
  description: string
  institution: string | null
  catalogue_url: string | null
  digital_url: string | null
  author_name?: string
}

export interface MoU {
  id: number
  title: string
  parties: string
  date: string
  purpose: string
  description: string
  institution: string
  document_url: string | null
  source_url: string
  category: string
}

export interface Institution {
  id: number
  name: string
  type: string
  location: string
  description: string
  responsibilities: string
  official_url: string
}

export interface CommunityPost {
  id: number
  kind: string
  title: string
  content: string
  author_name: string
  status: string
  created_at: string
  related_resource: string | null
  related_city: string | null
  image_url: string | null
  trust_level?: string
  message?: string
}

export interface SearchResult {
  query: string
  total: number
  results: Array<{ type: string; label: string; summary: string; data: Record<string, unknown>; rank: number }>
}

export interface AssistantResponse {
  question: string
  intent: string
  place: string | null
  answer: string
  sources: Array<{ type: string; id: number; label: string; url: string | null }>
  trust: string
  note: string
}