import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import States from './pages/States'
import StateDetail from './pages/StateDetail'
import CityDetail from './pages/CityDetail'
import Heritage from './pages/Heritage'
import HeritageDetail from './pages/HeritageDetail'
import Museums from './pages/Museums'
import MuseumDetail from './pages/MuseumDetail'
import Culture from './pages/Culture'
import Greats from './pages/Greats'
import Commemorations from './pages/Commemorations'
import Publications from './pages/Publications'
import Papers from './pages/Papers'
import Schemes from './pages/Schemes'
import Awards from './pages/Awards'
import Eternities from './pages/Eternities'
import Mous from './pages/Mous'
import Institutions from './pages/Institutions'
import AssistantPage from './pages/AssistantPage'
import Community from './pages/Community'
import About from './pages/About'
import Search from './pages/Search'
import Extended from './pages/Extended'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/states" element={<States />} />
          <Route path="/states/:id" element={<StateDetail />} />
          <Route path="/cities/:id" element={<CityDetail />} />
          <Route path="/heritage" element={<Heritage />} />
          <Route path="/heritage/:id" element={<HeritageDetail />} />
          <Route path="/museums" element={<Museums />} />
          <Route path="/museums/:id" element={<MuseumDetail />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/greats" element={<Greats />} />
          <Route path="/commemorations" element={<Commemorations />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/eternities" element={<Eternities />} />
          <Route path="/mous" element={<Mous />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<Search />} />
          <Route path="/extended" element={<Extended />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}