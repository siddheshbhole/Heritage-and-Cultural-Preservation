import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Explore from './pages/Explore'
import States from './pages/States'
import Heritage from './pages/Heritage'
import Museums from './pages/Museums'
import Culture from './pages/Culture'
import Search from './pages/Search'
import MediaLayout from './pages/media/MediaLayout'
import AIHeritageGuide from './components/AIHeritageGuide'

const StateDetail = lazy(() => import('./pages/StateDetail'))
const CityDetail = lazy(() => import('./pages/CityDetail'))
const HeritageDetail = lazy(() => import('./pages/HeritageDetail'))
const Tangible = lazy(() => import('./pages/Tangible'))
const TangibleCategory = lazy(() => import('./pages/TangibleCategory'))
const Intangible = lazy(() => import('./pages/Intangible'))
const IntangibleArtForm = lazy(() => import('./pages/IntangibleArtForm'))
const WorldHeritage = lazy(() => import('./pages/WorldHeritage'))
const MuseumDetail = lazy(() => import('./pages/MuseumDetail'))
const Greats = lazy(() => import('./pages/Greats'))
const Commemorations = lazy(() => import('./pages/Commemorations'))
const Publications = lazy(() => import('./pages/Publications'))
const Schemes = lazy(() => import('./pages/Schemes'))
const Awards = lazy(() => import('./pages/Awards'))
const Eternities = lazy(() => import('./pages/Eternities'))
const Mous = lazy(() => import('./pages/Mous'))
const Institutions = lazy(() => import('./pages/Institutions'))
const AssistantPage = lazy(() => import('./pages/AssistantPage'))
const Community = lazy(() => import('./pages/Community'))
const About = lazy(() => import('./pages/About'))
const Extended = lazy(() => import('./pages/Extended'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))
const MediaPhotos = lazy(() => import('./pages/media/MediaPhotos'))
const MediaVideos = lazy(() => import('./pages/media/MediaVideos'))
const MediaBrochure = lazy(() => import('./pages/media/MediaBrochure'))
const MediaBharatBeat = lazy(() => import('./pages/media/MediaBharatBeat'))
const MediaSanskriti = lazy(() => import('./pages/media/MediaSanskriti'))
const MediaEvents = lazy(() => import('./pages/media/MediaEvents'))
const MediaNews = lazy(() => import('./pages/media/MediaNews'))
const MediaAnnouncement = lazy(() => import('./pages/media/MediaAnnouncement'))
const MediaWebcast = lazy(() => import('./pages/media/MediaWebcast'))
const DocumentsHome = lazy(() => import('./pages/documents/DocumentsHome'))
const DocumentCategoryPage = lazy(() => import('./pages/documents/DocumentCategoryPage'))

import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

function PageLoading() {
  return (
    <div className="page-loading">
      <div className="container">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    </div>
  )
}

function AuthRedirect({ tab }: { tab: 'login' | 'signup' }) {
  const { openAuthModal, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    } else {
      openAuthModal(tab)
    }
  }, [user, tab, openAuthModal, navigate, location])

  return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthModal />
        <AIHeritageGuide />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<AuthRedirect tab="login" />} />
            <Route path="/signup" element={<AuthRedirect tab="signup" />} />
            <Route path="/states" element={<States />} />
            <Route path="/states/:id" element={<Suspense fallback={<PageLoading />}><StateDetail /></Suspense>} />
            <Route path="/cities/:id" element={<Suspense fallback={<PageLoading />}><CityDetail /></Suspense>} />
            <Route path="/heritage" element={<Heritage />} />
            <Route path="/heritage/tangible" element={<Suspense fallback={<PageLoading />}><Tangible /></Suspense>} />
            <Route path="/heritage/tangible/:category" element={<Suspense fallback={<PageLoading />}><TangibleCategory /></Suspense>} />
            <Route path="/heritage/intangible" element={<Suspense fallback={<PageLoading />}><Intangible /></Suspense>} />
            <Route path="/heritage/intangible/:artForm" element={<Suspense fallback={<PageLoading />}><IntangibleArtForm /></Suspense>} />
            <Route path="/heritage/world" element={<Suspense fallback={<PageLoading />}><WorldHeritage /></Suspense>} />
            <Route path="/heritage/:id" element={<Suspense fallback={<PageLoading />}><HeritageDetail /></Suspense>} />
            <Route path="/museums" element={<Museums />} />
            <Route path="/museums/:id" element={<Suspense fallback={<PageLoading />}><MuseumDetail /></Suspense>} />
            <Route path="/culture" element={<Culture />} />
            <Route path="/greats" element={<Suspense fallback={<PageLoading />}><Greats /></Suspense>} />
            <Route path="/commemorations" element={<Suspense fallback={<PageLoading />}><Commemorations /></Suspense>} />
            <Route path="/publications" element={<Suspense fallback={<PageLoading />}><Publications /></Suspense>} />
            <Route path="/documents" element={<Suspense fallback={<PageLoading />}><DocumentsHome /></Suspense>} />
            <Route path="/documents/:categorySlug" element={<Suspense fallback={<PageLoading />}><DocumentCategoryPage /></Suspense>} />
            <Route path="/schemes" element={<Suspense fallback={<PageLoading />}><Schemes /></Suspense>} />
            <Route path="/awards" element={<Suspense fallback={<PageLoading />}><Awards /></Suspense>} />
            <Route path="/eternities" element={<Suspense fallback={<PageLoading />}><Eternities /></Suspense>} />
            <Route path="/mous" element={<Suspense fallback={<PageLoading />}><Mous /></Suspense>} />
            <Route path="/institutions" element={<Suspense fallback={<PageLoading />}><Institutions /></Suspense>} />
            <Route path="/media" element={<MediaLayout />}>
              <Route index element={<Navigate to="/media/photos" replace />} />
              <Route path="photos" element={<Suspense fallback={<PageLoading />}><MediaPhotos /></Suspense>} />
              <Route path="videos" element={<Suspense fallback={<PageLoading />}><MediaVideos /></Suspense>} />
              <Route path="brochure" element={<Suspense fallback={<PageLoading />}><MediaBrochure /></Suspense>} />
              <Route path="bharat-beat" element={<Suspense fallback={<PageLoading />}><MediaBharatBeat /></Suspense>} />
              <Route path="sanskriti" element={<Suspense fallback={<PageLoading />}><MediaSanskriti /></Suspense>} />
              <Route path="events" element={<Suspense fallback={<PageLoading />}><MediaEvents /></Suspense>} />
              <Route path="latest-news" element={<Suspense fallback={<PageLoading />}><MediaNews /></Suspense>} />
              <Route path="announcement" element={<Suspense fallback={<PageLoading />}><MediaAnnouncement /></Suspense>} />
              <Route path="webcast" element={<Suspense fallback={<PageLoading />}><MediaWebcast /></Suspense>} />
            </Route>
            <Route path="/assistant" element={<Suspense fallback={<PageLoading />}><AssistantPage /></Suspense>} />
            <Route path="/community" element={<Suspense fallback={<PageLoading />}><Community /></Suspense>} />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageLoading />}>
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route path="/about" element={<Suspense fallback={<PageLoading />}><About /></Suspense>} />
            <Route path="/search" element={<Search />} />
            <Route path="/extended" element={<Suspense fallback={<PageLoading />}><Extended /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageLoading />}><NotFound /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
