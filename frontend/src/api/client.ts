const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `Server responded with status ${res.status} (${res.statusText || 'unknown'})`
    try {
      const data = await res.json()
      if (data && data.detail) errMessage = data.detail
    } catch {}
    throw new Error(errMessage)
  }
  return res.json() as Promise<T>
}

function getAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function get<T>(path: string, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }
  return handle<T>(res)
}

export async function post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }
  return handle<T>(res)
}

export async function patch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }
  return handle<T>(res)
}

export async function put<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }
  return handle<T>(res)
}

export async function del<T>(path: string, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }
  return handle<T>(res)
}


export interface HomeData {
  apps: CultureApp[]
  announcements: Announcement[]
  events: Event[]
  featured_heritage: Heritage[]
  showcase: GovernmentProgramme[]
  stats: { states: number; cities: number; heritage_sites: number; museums: number; publications: number; events: number }
}

export interface TrendingItem {
  id: number
  title: string
  slug: string
  category: string
  kind: 'heritage' | 'culture'
  state: string | null
  city: string | null
  image_url: string
  image_position: string
  summary: string
  external_url: string
  explore_url: string
  trend_score: number
  source_name: string
  source_url: string | null
  is_active: boolean
}

export interface TrendingResponse {
  items: TrendingItem[]
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
  cultural_identity?: string | null
  historical_overview?: string | null
  arts_and_crafts?: string | null
  festivals_and_rituals?: string | null
  cuisine_and_languages?: string | null
  important_personalities?: string | null
  source_name?: string | null
  source_url?: string | null
  source_type?: string | null
  last_verified_at?: string | null
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
  cultural_identity?: string | null
  historical_overview?: string | null
  arts_and_crafts?: string | null
  festivals_and_rituals?: string | null
  cuisine_and_languages?: string | null
  important_personalities?: string | null
  source_name?: string | null
  source_url?: string | null
  source_type?: string | null
  last_verified_at?: string | null
  provenance?: Record<string, string>
}

export interface Heritage {
  id: number
  city_id: number | null
  state_id: number | null
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
  slug?: string | null
  heritage_type?: 'tangible' | 'intangible' | 'world' | string | null
  region?: string | null
  unesco_status?: string | null
  unesco_year?: string | null
  unesco_category?: string | null
  google_360_url?: string | null
  main_image?: string | null
  established?: string | null
  gallery?: HeritageImage[]
  city_name?: string | null
  state_name?: string | null
  nearby?: Heritage[]
  provenance?: Record<string, string>
}

export interface HeritageCategory {
  id: number
  slug: string
  name: string
  kind: 'tangible' | 'intangible' | string
  parent_slug: string | null
  description: string | null
  image_url: string | null
  display_order: number
  count: number
}

export interface HeritageImage {
  id: number
  url: string
  caption: string | null
  display_order: number
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

export interface MinistryLeader {
  id: number
  name: string
  title: string | null
  designation: string
  image_url: string | null
  official_url: string | null
}

export interface MinistryData {
  heading: string
  about: string
  mission: string
  vision: string
  stats: { attached_offices: number; subordinate_offices: number; autonomous_organizations: number }
  leaders: MinistryLeader[]
  directory_url: string
  organisations_url: string
  source_name: string
  source_url: string
  updated_at: string
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

export interface DocumentCategory {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  count: number
}

export interface DocumentItem {
  id: number
  title: string
  slug: string
  category: string
  file_url: string | null
  file_type: string
  file_size: number
  published_date: string | null
  description: string | null
  sort_order: number
  created_at: string | null
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

export interface SearchInterpretedIntent {
  state?: string
  city?: string
  category?: string
  religion?: string
  period?: string
  heritage_type?: string
}

export interface EnhancedSearchResultItem {
  type: string
  label: string
  summary: string
  rank: number
  match_reasons?: string[]
  data: Record<string, unknown>
}

export interface EnhancedSearchResult {
  query: string
  total: number
  interpreted?: SearchInterpretedIntent
  did_you_mean?: string
  suggestions?: string[]
  results: EnhancedSearchResultItem[]
}

export interface SearchSuggestion {
  type: string
  label: string
  query: string
}

export interface SearchSuggestionResult {
  query: string
  suggestions: SearchSuggestion[]
}

export async function searchHeritage(
  query: string,
  filters?: { kind?: string; state_id?: number; city_id?: number; heritage_type?: string; period?: string; limit?: number; offset?: number }
): Promise<EnhancedSearchResult> {
  const params = new URLSearchParams({ q: query })
  if (filters) {
    if (filters.kind) params.set('kind', filters.kind)
    if (filters.state_id) params.set('state_id', String(filters.state_id))
    if (filters.city_id) params.set('city_id', String(filters.city_id))
    if (filters.heritage_type) params.set('heritage_type', filters.heritage_type)
    if (filters.period) params.set('period', filters.period)
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))
  }
  return get<EnhancedSearchResult>(`/search?${params.toString()}`)
}

export async function getSearchSuggestions(query: string, limit = 8): Promise<SearchSuggestionResult> {
  return get<SearchSuggestionResult>(`/search/suggest?q=${encodeURIComponent(query)}&limit=${limit}`)
}

export interface AssistantRecommendation {
  id: number
  name: string
  slug: string | null
  category: string | null
  location: string | null
  description: string | null
  match_reasons: string[]
  image_url: string | null
  heritage_type?: string | null
  period?: string | null
  unesco_status?: string | null
  state_name?: string | null
  city_name?: string | null
  distance_km?: number | null
}

export interface AssistantItineraryStop {
  id: number
  name: string
  slug: string | null
  category: string | null
  location: string | null
  description?: string | null
  city_name?: string | null
  state_name?: string | null
  distance_km?: number | null
  match_reasons?: string[]
  image_url?: string | null
}

export interface AssistantItineraryDay {
  day: number
  area: string
  stops: AssistantItineraryStop[]
}

export interface AssistantProfile {
  id: number
  name: string
  slug: string | null
  category: string | null
  location: string | null
  city_name: string | null
  state_name: string | null
  description: string | null
  history: string | null
  significance: string | null
  architecture: string | null
  period: string | null
  unesco_status: string | null
  unesco_year: string | null
  heritage_type: string | null
  image_url: string | null
}

export interface AssistantResponse {
  question: string
  intent: string
  place: string | null
  answer: string
  sources: Array<{ type: string; id: number; label: string; url: string | null }>
  recommendations: AssistantRecommendation[]
  itinerary: AssistantItineraryDay[]
  profile: AssistantProfile | null
  interpreted: Record<string, unknown> | null
  matched_count: number
  trust: string
  note: string
}

export interface ModelFieldMeta {
  name: string
  type: string
  primary_key: boolean
  nullable: boolean
  editable: boolean
}

export interface ModelMeta {
  key: string
  class_name: string
  table_name: string
  domain: string
  count: number
  fields: ModelFieldMeta[]
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface AuditLogItem {
  id: number
  timestamp: string
  user_id: string
  user_email: string | null
  action: string
  model_name: string
  record_id: string
  details: string | null
}

export interface AdminStats {
  total_posts: number
  pending_posts: number
  approved_posts: number
  rejected_posts: number
  heritage_sites: number
  categories_count: number
  audit_logs_count: number
  states_count: number
  cities_count: number
  documents_count: number
  doc_categories_count: number
  museums_count: number
  events_count: number
  trending_count: number
  media_count: number
}

export interface AdminAnalytics {
  sites_by_category: Record<string, number>
  sites_by_unesco: Record<string, number>
  sites_by_type: Record<string, number>
  sites_by_state: Record<string, number>
  categories_breakdown: Record<string, number>
  moderation_breakdown: { approved: number; pending: number; rejected: number }
  recent_activity: AuditLogItem[]
  doc_categories: Record<string, number>
  media_breakdown: Record<string, number>
}

export interface AdminUserSummary {
  author_name: string
  total_posts: number
  approved_posts: number
  pending_posts: number
  rejected_posts: number
  last_active: string | null
}

export interface AdminUsersResponse {
  authors: AdminUserSummary[]
  total_unique_authors: number
  supabase_users_with_posts: number
}