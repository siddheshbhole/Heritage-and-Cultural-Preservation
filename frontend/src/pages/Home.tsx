import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import { useLanguage } from '../context/LanguageContext'
import type { HomeData, MinistryData, ShowcaseItem, State, TrendingResponse } from '../api/client'
import Ticker from '../components/Ticker'
import Carousel from '../components/Carousel'
import TrendingCarousel from '../components/TrendingCarousel'
import FeaturedVideos from '../components/FeaturedVideos'
import MinistrySection from '../components/MinistrySection'
import IndiaMap from '../components/IndiaMap'
import { Section, StatCard, Skeleton } from '../components/ui'

const SHOWCASE_ORDER = ['150 Years of Vande Mataram', 'Gyan Bharatam Mission', 'Indian Culture Portal (Version 2.0)']

const SHOWCASE_META: Record<string, Partial<ShowcaseItem>> = {
  '150 Years of Vande Mataram': {
    title: '150 Years of Vande Mataram',
    description: "Commemorating 150 years of India's National Song and its enduring legacy.",
    image_url: '/images/campaigns/vande-mataram-showcase-square.webp',
    official_url: 'https://www.vandemataram150.in',
    imageFit: 'cover',
    imagePosition: 'center',
    bgColor: 'var(--orange-tint)',
    qrUrl: '/images/campaigns/qr-vande-mataram.png',
    qrLabel: 'Scan to Visit',
  },
  'Gyan Bharatam Mission': {
    title: 'Gyan Bharatam',
    description: "A national initiative to survey, preserve and digitise India's manuscript heritage.",
    image_url: '/images/campaigns/gyan-bharatam-showcase-square.webp',
    official_url: 'https://culture.gov.in/gyan-bharatam-mission',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.gyanbharatam.app',
    appStoreUrl: 'https://apps.apple.com/in/app/gyan-bharatam/id6756345232',
    imageFit: 'cover',
    imagePosition: 'center',
    bgColor: 'var(--white)',
    qrUrl: '/images/campaigns/qr-gyan-bharatam.png',
    qrLabel: 'Scan to Download',
  },
  'Indian Culture Portal (Version 2.0)': {
    title: 'Indian Culture Portal',
    description: "A digital gateway to India's cultural heritage, knowledge, traditions and collections.",
    image_url: '/images/campaigns/indian-culture-showcase-square.webp',
    official_url: 'https://indianculture.gov.in/',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=in.gov.indianculture.portal',
    imageFit: 'cover',
    imagePosition: 'center',
    bgColor: 'var(--white)',
    qrUrl: '/images/campaigns/qr-indian-culture.png',
    qrLabel: 'Scan to Download',
  },
}

export default function Home() {
  const { t } = useLanguage()
  const { data, loading } = useFetch<HomeData>('/home')
  const { data: trending, loading: trendingLoading, error: trendingError } = useFetch<TrendingResponse>('/trending')
  const { data: ministry, loading: ministryLoading } = useFetch<MinistryData>('/ministry')

  const stats = data?.stats
  const apps = data?.apps ?? []
  const announcements = data?.announcements ?? []
  const trendingItems = trending?.items ?? []
  const showcase = (data?.showcase ?? [])
    .filter((s) => SHOWCASE_META[s.title])
    .map((s) => ({ ...s, ...SHOWCASE_META[s.title] }))
    .sort((a, b) => SHOWCASE_ORDER.indexOf(a.title) - SHOWCASE_ORDER.indexOf(b.title))

  const { data: statesData, loading: statesLoading } = useFetch<State[]>('/states')
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapVisible, setMapVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMapVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const states = statesData ?? []

  return (
    <>
      <Ticker items={announcements} />

      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <img src="/images/heritage/hero/taj-mahal.webp" alt="" loading="eager" decoding="async" />
          <img src="/images/heritage/hero/hampi.webp" alt="" loading="lazy" decoding="async" />
          <img src="/images/heritage/hero/konark.webp" alt="" loading="lazy" decoding="async" />
          <img src="/images/heritage/hero/amber-fort.webp" alt="" loading="lazy" decoding="async" />
          <img src="/images/heritage/hero/ellora.webp" alt="" loading="lazy" decoding="async" />
        </div>
        <div className="hero-bg-overlay" aria-hidden="true" />
        <div className="container hero-inner">
          <div>
            <h1>
              {t('portal_tagline')}
            </h1>
            <p className="lead">
              {t('portal_sub')}
            </p>
            <div className="hero-strip">
              <Link to="/explore" className="btn btn-primary">{t('btn_explore')} →</Link>
              <Link to="/assistant" className="btn btn-outline">{t('btn_ask_ai')}</Link>
            </div>
            {stats && (
              <div className="stats" style={{ maxWidth: 620 }}>
                <StatCard value={stats.states} label={t('stats_states')} />
                <StatCard value={stats.heritage_sites.toLocaleString('en-IN')} label={t('stats_heritage')} />
                <StatCard value={stats.museums.toLocaleString('en-IN')} label={t('stats_museums')} />
              </div>
            )}
          </div>
          <div className="hero-map-card showcase-box">
            <h2 className="showcase-title">Government Cultural Showcase</h2>
            {loading ? (
              <Skeleton style={{ height: 560 }} />
            ) : showcase.length > 0 ? (
              <Carousel items={showcase} variant="hero" />
            ) : (
              <p className="muted" style={{ fontSize: 13.5 }}>
                Official Government of India cultural campaigns will appear here.
              </p>
            )}
          </div>
        </div>
      </section>

      <FeaturedVideos />

      <Section
        kicker="Curated by MoC"
        title="Heritage & trending"
        action={<Link to="/heritage" className="see-all">See all heritage →</Link>}
      >
        <TrendingCarousel items={trendingItems} loading={trendingLoading} error={trendingError} />
      </Section>

      <section
        ref={mapRef}
        className={`map-entrance${mapVisible ? ' visible' : ''}`}
        style={{ padding: '48px 0' }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="kicker">Interactive Map</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 10px' }}>
              Explore the Cultural Soul of Bharat
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: 600, margin: '0 auto', fontSize: 15 }}>
              Journey through 28 states and 8 union territories — discover heritage sites, living
              traditions, festivals, crafts, cuisine and the stories that shape India's cultural
              tapestry.
            </p>
          </div>
          {statesLoading ? (
            <Skeleton style={{ height: 420 }} />
          ) : states.length > 0 ? (
            <div style={{ maxWidth: 980, margin: '0 auto' }}>
              <IndiaMap states={states} onSelect={(s) => navigate(`/states/${s.id}`)} />
            </div>
          ) : null}
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/states" className="see-all">View all states &rarr;</Link>
          </div>
        </div>
      </section>

      <MinistrySection data={ministry} loading={ministryLoading} />

      <Section kicker="Updates" title="Latest announcements">
        {loading ? (
          <Skeleton style={{ height: 90 }} />
        ) : (
          <div className="feed">
            {(announcements.length ? announcements : []).map((a) => (
              <div className="feed-item" key={a.id}>
                <div className="feed-head">
                  <span className="chip">{a.date}</span>
                  <span className="muted">{a.source}</span>
                </div>
                <a href={a.url} target="_blank" rel="noreferrer">
                  <b style={{ fontSize: 15 }}>{a.title}</b>
                </a>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{a.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}