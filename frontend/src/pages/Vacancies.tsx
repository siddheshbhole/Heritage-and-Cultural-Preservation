import { useEffect, useState } from 'react'
import { useFetch } from '../api/hooks'
import {
  registerGuide,
  getMyGuides,
  getMyGuideDashboard,
  updateMyGuide,
  deleteMyGuide,
  getAvailableGuides,
} from '../api/client'
import type { State, GuideAdminRecord, HeritageGuide, GuideDashboardData } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Vacancies() {
  const { user, token, isAdmin, loading: authLoading, signOut, openAuthModal } = useAuth()
  const { data: states, loading: statesLoading } = useFetch<State[]>('/states')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [location, setLocation] = useState('')
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [myGuideProfile, setMyGuideProfile] = useState<GuideAdminRecord[]>([])
  const [dashboard, setDashboard] = useState<GuideDashboardData | null>(null)
  const [myGuideLoading, setMyGuideLoading] = useState(false)
  const [allGuides, setAllGuides] = useState<HeritageGuide[]>([])

  const hasRegistration = user !== null && myGuideProfile.length > 0
  const myGuide = myGuideProfile[0]

  useEffect(() => {
    if (!token || isAdmin) {
      setMyGuideProfile([])
      setDashboard(null)
      return
    }
    let cancelled = false
    setMyGuideLoading(true)
    getMyGuides(token)
      .then((r) => { if (!cancelled) setMyGuideProfile(r.items || []) })
      .catch(() => { if (!cancelled) setMyGuideProfile([]) })
      .finally(() => { if (!cancelled) setMyGuideLoading(false) })
    return () => { cancelled = true }
  }, [token, isAdmin])

  useEffect(() => {
    if (!token || isAdmin || myGuideProfile.length === 0) {
      setDashboard(null)
      return
    }
    let cancelled = false
    getMyGuideDashboard(token)
      .then((d) => { if (!cancelled) setDashboard(d) })
      .catch(() => { if (!cancelled) setDashboard(null) })
    return () => { cancelled = true }
  }, [token, isAdmin, myGuideProfile])

  useEffect(() => {
    let cancelled = false
    getAvailableGuides({})
      .then((rows) => { if (!cancelled) setAllGuides(rows) })
      .catch(() => { if (!cancelled) setAllGuides([]) })
    return () => { cancelled = true }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setDone('')
    setSubmitting(true)
    try {
      const r = await registerGuide(
        {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          state: state.trim(),
          location: location.trim() || null,
        },
        token,
      )
      setDone(r.message || 'Registration received. We will review it shortly.')
      setFullName(''); setPhone(''); setEmail(''); setState(''); setLocation('')
      if (token && !isAdmin) {
        const refresh = await getMyGuides(token)
        setMyGuideProfile(refresh.items || [])
      }
    } catch (error: any) {
      setErr(error.message || 'Registration could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAvailability = async () => {
    if (!token || !myGuide) return
    setErr('')
    setDone('')
    try {
      const updated = await updateMyGuide(
        { availability: myGuide.availability === 'occupied' ? 'free' : 'occupied', location: myGuide.location },
        token,
      )
      setMyGuideProfile((rows) => rows.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)))
      setAllGuides((rows) =>
        rows.map((row) => (row.id === updated.id ? { ...row, availability: updated.availability } : row)),
      )
      setDashboard((d) => (d ? { ...d, guide: { ...d.guide, ...updated } } : d))
      setDone(updated.message || `You are now marked as ${updated.availability}.`)
    } catch (error: any) {
      setErr(error.message || 'Could not update your availability.')
    }
  }

  const removeOwnRegistration = async () => {
    if (!token || !myGuide) return
    if (!window.confirm(`Remove your registration as "${myGuide.full_name}"? Your name will disappear from all heritage site pages.`)) return
    setErr('')
    setDone('')
    try {
      const r = await deleteMyGuide(token)
      setMyGuideProfile([])
      setDashboard(null)
      setAllGuides((rows) => rows.filter((row) => row.id !== myGuide.id))
      setDone(r.message)
    } catch (error: any) {
      setErr(error.message || 'Could not remove your registration.')
    }
  }

  const logout = async () => {
    setDone('')
    setErr('')
    await signOut()
    setMyGuideProfile([])
    setDashboard(null)
  }

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Approved' : s === 'rejected' ? 'Not approved' : 'Pending review'

  const currentTour = dashboard?.current_tour || null

  if (authLoading) {
    return (
      <>
        <PageHead
          title="Heritage Guide — Vacancies"
          sub="A chance to share what you know. Residents, culture enthusiasts and local historians can register as volunteer Heritage Guides."
          crumbs={[{ label: 'Vacancies' }]}
        />
        <div className="container" style={{ marginBottom: 40 }}><Skeleton style={{ height: 320 }} /></div>
      </>
    )
  }

  return (
    <>
      <PageHead
        title="Heritage Guide — Vacancies"
        sub="A chance to share what you know. Residents, culture enthusiasts and local historians can register as volunteer Heritage Guides and help visitors discover tangible and natural heritage sites across India."
        crumbs={[{ label: 'Vacancies' }]}
      />

      {!isAdmin && (
        <div className="container" style={{ marginBottom: 40 }}>
          <div className="content-block" style={{ border: '1px solid var(--line)' }}>

            {/* ===== Logged-in guide: personal dashboard ===== */}
            {token && hasRegistration ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ margin: 0 }}>Your guide dashboard</h3>
                  <button className="btn btn-outline btn-sm" onClick={logout}>
                    Logout as Guide
                  </button>
                </div>

                <div className="card-grid tight" style={{ marginTop: 12 }}>
                  <div className="feature-card">
                    <div className="fc-body">
                      <h3>{myGuide.full_name}</h3>
                      <span className={`chip ${myGuide.status === 'approved' ? 'chip-green' : ''}`} style={{ fontSize: 11 }}>
                        {statusLabel(myGuide.status)}
                      </span>
                      <p className="muted small" style={{ margin: '8px 0 0' }}>
                        📍 <b>{myGuide.location || myGuide.state}</b>
                      </p>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        📧 {myGuide.email}
                      </p>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        📞 {myGuide.phone}
                      </p>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        🗓️ Registered {formatDate(myGuide.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="fc-body">
                      <h3>Current availability</h3>
                      <span className={`chip ${myGuide.availability === 'occupied' ? '' : 'chip-green'}`} style={{ fontSize: 13 }}>
                        {myGuide.availability === 'occupied' ? '🔴 Occupied' : '🟢 Free'}
                      </span>
                      {myGuide.status === 'approved' ? (
                        <>
                          <p className="muted small" style={{ margin: '10px 0 0' }}>
                            While you are guiding someone, stay <b>Occupied</b> so visitors cannot book you twice;
                            switch back to <b>Free</b> when you are available.
                          </p>
                          <button className="btn btn-primary" onClick={toggleAvailability} style={{ marginTop: 10 }}>
                            {myGuide.availability === 'occupied' ? 'Mark me Free' : 'Mark me Occupied'}
                          </button>
                        </>
                      ) : (
                        <p className="muted small" style={{ margin: '10px 0 0' }}>
                          Availability frees up once an administrator approves your registration.
                        </p>
                      )}
                      {myGuide.assigned_site && myGuide.availability === 'occupied' && (
                        <p className="muted small" style={{ margin: '8px 0 0' }}>
                          Currently assigned to: <b>{myGuide.assigned_site}</b>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="fc-body">
                      <h3>Tour activity</h3>
                      <p className="desc" style={{ marginBottom: 4 }}>
                        ✅ Completed tours: <b>{dashboard?.tours_completed ?? 0}</b>
                      </p>
                      <p className="desc" style={{ marginBottom: 4 }}>
                        🟢 Active tours: <b>{dashboard?.active_tours_count ?? 0}</b>
                      </p>
                      <p className="desc" style={{ marginBottom: 0 }}>
                        🧾 Total tours: <b>{dashboard?.tours_total ?? 0}</b>
                      </p>
                    </div>
                  </div>
                </div>

                {currentTour && (
                  <div className="feature-card" style={{ marginTop: 12, border: '1px solid var(--green-deep)' }}>
                    <div className="fc-body">
                      <h3 style={{ margin: 0 }}>Current Tour</h3>
                      <p className="desc" style={{ margin: '6px 0 0' }}>
                        Heritage Site: <b>{currentTour.site_name}</b>
                      </p>
                      <p className="desc" style={{ margin: '4px 0 0' }}>
                        Tour Status: <b>{currentTour.status === 'active' ? '🟢 Active' : currentTour.status}</b>
                      </p>
                      <p className="muted small" style={{ margin: '6px 0 0' }}>
                        Booked {formatDate(currentTour.created_at)}
                        {currentTour.tourist_name ? ` · Visitor: ${currentTour.tourist_name}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {dashboard && dashboard.upcoming_tours.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ margin: '0 0 8px' }}>Upcoming tours</h4>
                    <div className="card-grid tight">
                      {dashboard.upcoming_tours.map((t) => (
                        <div className="feature-card" key={t.id}>
                          <div className="fc-body">
                            <p className="desc" style={{ margin: 0 }}><b>{t.site_name}</b></p>
                            <p className="muted small" style={{ margin: '4px 0 0' }}>{t.status} · booked {formatDate(t.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {done && <p style={{ color: 'var(--green-deep)', fontSize: 13.5, marginTop: 12 }}>✓ {done}</p>}
                {err && <p style={{ color: 'var(--orange-deep)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}

                <p style={{ marginTop: 14, marginBottom: 0 }}>
                  <button className="btn btn-outline btn-sm" onClick={removeOwnRegistration}>
                    Remove my registration
                  </button>
                </p>
              </>
            ) : token ? (
              <>
                {/* ===== Signed in, but not yet a guide ===== */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ margin: 0 }}>You’re signed in</h3>
                  <button className="btn btn-outline btn-sm" onClick={logout}>
                    Logout
                  </button>
                </div>
                <p className="muted" style={{ margin: '8px 0 0' }}>
                  Signed in as <b>{user?.email}</b>. You haven’t registered as a Heritage Guide yet —
                  complete the form below to apply.
                </p>
              </>
            ) : (
              <>
                {/* ===== New visitor: login option + registration ===== */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ margin: 0 }}>Join as a Heritage Guide</h3>
                  <span>
                    Already registered?{' '}
                    <button className="btn btn-outline btn-sm" onClick={() => openAuthModal('login')}>
                      Sign in to manage your application
                    </button>
                  </span>
                </div>
                <p className="muted" style={{ margin: '8px 0 0' }}>
                  Fill in the registration form below. Once an administrator approves your application, your name will
                  appear on relevant heritage site pages as an available guide.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="container grid-2" style={{ marginBottom: 44 }}>
        <div>
          <div className="content-block">
            <h3>About the opportunity</h3>
            <p>
              The Sanskriti Setu portal connects travellers, students and researchers with India's built
              and natural heritage — forts, temples, monuments, stepwells, national parks and landscapes of
              significance. Local knowledge makes these visits far richer.
            </p>
            <p>
              As a volunteer Heritage Guide, you can offer your time to share stories, context and practical
              guidance with visitors at treasures in your neighbourhood. There is no set hourly commitment —
              you decide how and when you contribute.
            </p>
            <p>
              <b>This is a community opportunity, not a government job.</b> Registrations are reviewed and
              listed on relevant heritage site pages so visitors can reach out to you directly. The portal does
              not pay or employ guides, and no contract or guarantee of work is implied.
            </p>
          </div>
          <div className="content-block">
            <h3>Who can apply</h3>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>Residents with genuine knowledge of a town, city or region's heritage.</li>
              <li>Students and scholars of history, archaeology, culture or nature.</li>
              <li>Artisans, storytellers and community members who keep traditions alive.</li>
              <li>Anyone willing to share verifiable, respectful and accurate information.</li>
            </ul>
            <p className="muted small" style={{ marginTop: 12 }}>
              Guides appear only on Tangible Heritage and Natural Heritage site pages. Intangible culture
              (dance, music, crafts) is served through our existing Culture section instead.
            </p>
            <p style={{ marginTop: 12 }}>
              Explore the places where guides are featured:{' '}
              <Link to="/heritage/tangible">Tangible Heritage</Link> and{' '}
              <Link to="/heritage/world">World Heritage sites</Link>.
            </p>
          </div>

          <div className="content-block">
            <h3>Registered guides</h3>
            {allGuides.length > 0 ? (
              <div className="card-grid tight">
                {allGuides.map((g) => {
                  const occupied = g.availability === 'occupied'
                  return (
                    <div className="feature-card" key={g.id}>
                      <div className="fc-body">
                        <h3>{g.full_name}</h3>
                        <p className="desc">📍 {g.location || g.state}</p>
                        <span className={`chip ${occupied ? '' : 'chip-green'}`} style={{ fontSize: 11 }}>
                          {occupied ? '🔴 Occupied' : '🟢 Free'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty big="🧑‍🤝‍🧑" text="No approved guides have registered yet." />
            )}
          </div>
        </div>

        <div>
          {/* Registration is hidden for guides who are already registered. */}
          {!hasRegistration ? (
            <form className="form-card" onSubmit={submit} style={{ maxWidth: '100%', position: 'sticky', top: 84 }}>
              <h3 style={{ marginBottom: 12 }}>Register as a Heritage Guide</h3>
              <div className="field">
                <label>Full Name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label>State</label>
                {statesLoading ? (
                  <Skeleton style={{ height: 40 }} />
                ) : !states || states.length === 0 ? (
                  <input
                    className="input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Your state"
                  />
                ) : (
                  <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
                    <option value="">Select your state…</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="field">
                <label>Location / Area of expertise</label>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kaziranga National Park, Golaghat"
                />
              </div>

              {done && <p style={{ color: 'var(--green-deep)', fontSize: 13.5 }}>✓ {done}</p>}
              {err && <p style={{ color: 'var(--orange-deep)', fontSize: 13.5 }}>{err}</p>}

              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Registration'}
              </button>
              <p className="muted small" style={{ marginTop: 8 }}>
                Your application is stored for review. Approved guides are shown on relevant heritage site
                pages with only your name and state — your phone and email are never published.
              </p>
            </form>
          ) : (
            <div className="content-block" style={{ border: '1px solid var(--line)' }}>
              <h3>Manage your guide account</h3>
              <p className="muted" style={{ margin: 0 }}>
                Your guide dashboard is shown above. Use it to update your availability, view your current tour
                and track your completed tours. Sign in on any device to reach it again.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}