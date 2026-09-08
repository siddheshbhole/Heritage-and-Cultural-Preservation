import { Link } from 'react-router-dom'
import { useFetch } from '../api/hooks'
import type { HomeData, MinistryData, ShowcaseItem, TrendingResponse } from '../api/client'
import Ticker from '../components/Ticker'
import Carousel from '../components/Carousel'
import TrendingCarousel from '../components/TrendingCarousel'
import MinistrySection from '../components/MinistrySection'
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

  return (
    <>
      <Ticker items={data?.announcements} />

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
              Discover the <em>living soul</em> of Bharat
            </h1>
            <p className="lead">
              One digital gateway to India’s states, cities, heritage sites, museums and living
              traditions — curated from the Ministry of Culture and trusted institutions.
            </p>
            <div className="hero-strip">
              <Link to="/explore" className="btn btn-primary">Explore the map →</Link>
              <Link to="/assistant" className="btn btn-outline">Ask Culture AI</Link>
            </div>
            {stats && (
              <div className="stats" style={{ maxWidth: 620 }}>
                <StatCard value={stats.states} label="States & UTs" />
                <StatCard value={stats.heritage_sites.toLocaleString('en-IN')} label="Heritage resources" />
                <StatCard value={stats.museums.toLocaleString('en-IN')} label="Museums" />
                <StatCard value={stats.events} label="Major festivals" />
                <StatCard value={`${(stats.publications / 1e7).toFixed(2)} Cr+`} label="Manuscripts surveyed" />
                <StatCard value={stats.cities.toLocaleString('en-IN')} label="Cities & towns" />
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

      <Section
        kicker="Curated by MoC"
        title="Heritage & trending"
        action={<Link to="/heritage" className="see-all">See all heritage →</Link>}
      >
        <TrendingCarousel items={trendingItems} loading={trendingLoading} error={trendingError} />
      </Section>

      <Section kicker="Official digital services" title="Culture, one app at a time" alt="altgreen">
        {apps.length > 0 ? <Carousel items={apps} /> : <Skeleton />}
      </Section>

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