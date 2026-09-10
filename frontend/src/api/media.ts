import { get } from './client'
import { withQuery } from './hooks'

export interface MediaNewsItem {
  id: number
  title: string
  date: string
  image_url: string
  source_url: string
}

export interface MediaAlbum {
  id: number
  title: string
  date: string
  items_count: number
  cover_image: string
  gallery_url: string
}

export interface MediaVideo {
  id: number
  title: string
  date: string
  duration: string
  language: string
  youtube_id: string
  thumbnail_url: string
}

export interface MediaBrochure {
  id: number
  title: string
  description: string
  image_url: string
  pdf_url: string
  source_url: string
}

export interface MediaLeader {
  id: number
  name: string
  slug: string
  bio: string
  image_url: string
  official_url: string
}

export interface MediaMonument {
  id: number
  name: string
  image_url: string
  streetview_url: string
}

export interface MediaArtist {
  id: number
  name: string
  category: string
  image_url: string
  official_url: string
}

export interface MediaSanskritiItem {
  id: number
  title: string
  slug: string
  description: string
  image_url: string
  official_url: string
  source_label: string
}

export interface MediaEvent {
  id: number
  category: string
  title: string
  start_date: string
  end_date: string
  venue: string
  city: string
  state: string
  event_time: string
  image_url: string
  official_url: string
  is_archive: boolean
}

export interface MediaEventsResponse {
  items: MediaEvent[]
  days: { current: number; past: number }
  categories: string[]
  states: string[]
  cities: string[]
  today: string
  source: { source_name: string; source_url: string }
}

export interface MediaWebcast {
  id: number
  title: string
  date: string
  youtube_url: string
  is_live: boolean
  source_url: string
}

export interface MediaWebcastResponse {
  live: MediaWebcast[]
  archived: MediaWebcast[]
  official_page: string
  youtube_channel: string
  note: string
  source: { source_name: string; source_url: string }
}

export interface MediaSummary {
  photos: number
  videos: number
  brochures: number
  leaders: number
  monuments: number
  artists: number
  sanskriti: number
  events: number
  news: number
  webcasts: number
  webcast_live: number
  source: { source_name: string; source_url: string; retrieved_at: string }
}

export interface MediaLeadersResponse {
  items: MediaLeader[]
  source: { source_name: string; source_url: string }
}

export interface MediaArtistsResponse {
  categories: string[]
  items: MediaArtist[]
  source: { source_name: string; source_url: string }
}

export interface MediaSanskritiResponse {
  items: MediaSanskritiItem[]
  source: { source_name: string; source_url: string }
}

export function fetchMediaSummary() {
  return get<MediaSummary>('/media/summary')
}

export function fetchMediaPhotos(order: 'latest' | 'oldest' = 'latest') {
  return get<MediaAlbum[]>(withQuery('/media/photos', { order }))
}

export function fetchMediaVideos(language?: string) {
  return get<MediaVideo[]>(withQuery('/media/videos', { language }))
}

export function fetchMediaBrochures() {
  return get<MediaBrochure[]>('/media/brochures')
}

export function fetchMediaLeaders() {
  return get<MediaLeadersResponse>('/media/leaders')
}

export function fetchMediaMonuments() {
  return get<MediaMonument[]>('/media/monuments')
}

export function fetchMediaArtists(category?: string) {
  return get<MediaArtistsResponse>(withQuery('/media/artists', { category }))
}

export function fetchMediaSanskriti() {
  return get<MediaSanskritiResponse>('/media/sanskriti')
}

export function fetchMediaNews() {
  return get<MediaNewsItem[]>('/media/news')
}

export function fetchMediaEvents(params?: {
  q?: string
  category?: string
  state?: string
  start_date?: string
  end_date?: string
  archive?: number
}) {
  return get<MediaEventsResponse>(withQuery('/media/events', params ?? {}))
}

export function fetchMediaWebcast() {
  return get<MediaWebcastResponse>('/media/webcast')
}

export function fetchAnnouncements() {
  return get<AnnouncementItem[]>('/announcements')
}

export interface AnnouncementItem {
  id: number
  title: string
  date: string
  source: string
  summary: string
  url: string
}
