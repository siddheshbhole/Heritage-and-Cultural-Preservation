import { Link } from 'react-router-dom'
import { PageHead } from './_shared'

export default function NotFound() {
  return (
    <>
      <PageHead
        title="404 — page not found"
        sub="This corner of the map doesn’t exist yet."
        crumbs={[]}
      />
      <div className="container" style={{ marginBottom: 60 }}>
        <div className="empty">
          <div className="big">🧭</div>
          <p>Let’s get you back to civilisation.</p>
          <div className="hero-strip" style={{ justifyContent: 'center', marginTop: 12 }}>
            <Link to="/" className="btn btn-primary">Home</Link>
            <Link to="/explore" className="btn btn-outline">Explore</Link>
          </div>
        </div>
      </div>
    </>
  )
}