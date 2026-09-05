import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden>श्री</span>
            <span>
              <div className="brand-name" style={{ color: '#fff' }}>Bharat Cultural Odessey</div>
              <div className="brand-sub">Ministry of Culture · Digital Bharat</div>
            </span>
          </Link>
          <p className="muted" style={{ marginTop: 14, fontSize: 13.5, maxWidth: 340 }}>
            A digital gateway to India’s rich cultural heritage and the institutions that
            preserve it — states, cities, heritage sites, living traditions, and archives.
            Built for SIH 2026.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/explore">Interactive Map</Link></li>
            <li><Link to="/heritage">Heritage Sites</Link></li>
            <li><Link to="/museums">Museums</Link></li>
            <li><Link to="/culture">Culture & Rituals</Link></li>
          </ul>
        </div>

        <div>
          <h4>Knowledge</h4>
          <ul>
            <li><Link to="/papers">Archival Documents</Link></li>
            <li><Link to="/eternities">Scholars & Authors</Link></li>
            <li><Link to="/commemorations">Commemorations</Link></li>
            <li><Link to="/awards">Awards & Honours</Link></li>
          </ul>
        </div>

        <div>
          <h4>About</h4>
          <ul>
            <li><Link to="/about">About the Platform</Link></li>
            <li><Link to="/assistant">Ask Culture AI</Link></li>
            <li><Link to="/community">Community Voice</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} Bharat Cultural Odessey · Digital Bharat · Building for SIH 2026
        </div>
      </div>
    </footer>
  )
}