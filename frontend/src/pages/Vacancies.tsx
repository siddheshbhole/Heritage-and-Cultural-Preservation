import { useEffect, useState } from 'react'
import { useFetch } from '../api/hooks'
import {
  registerGuideAccount,
  guideSignIn,
  getMyGuideProfile,
  updateGuideAvailability,
} from '../api/client'
import type { State, GuideProfile, GuideProfileDashboard } from '../api/client'
import { PageHead } from './_shared'
import { Empty, Skeleton } from '../components/ui'
import { Link } from 'react-router-dom'

type View = 'landing' | 'register' | 'member' | 'dashboard'

const GUIDE_TOKEN_KEY = 'sanskriti-setu-guide-token'
const getStoredGuideToken = () => localStorage.getItem(GUIDE_TOKEN_KEY)
const storeGuideToken = (t: string) => localStorage.setItem(GUIDE_TOKEN_KEY, t)
const clearGuideToken = () => localStorage.removeItem(GUIDE_TOKEN_KEY)

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function availabilityChip(availability: string) {
  if (availability === 'occupied') return <span className="chip" style={{ fontSize: 12 }}>🔴 Occupied — on a tour</span>
  if (availability === 'not_ready') return <span className="chip" style={{ fontSize: 12 }}>🟡 Not ready</span>
  return <span className="chip chip-green" style={{ fontSize: 12 }}>🟢 Open to work</span>
}

export default function Vacancies() {
  const { data: states, loading: statesLoading } = useFetch<State[]>('/states')

  const [view, setView] = useState<View>('landing')
  const [guideLoading, setGuideLoading] = useState(true)
  const [guideToken, setGuideToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<GuideProfile | null>(null)
  const [dashboard, setDashboard] = useState<GuideProfileDashboard | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const [pin, setPin] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPin, setMemberPin] = useState('')

  const loadDashboard = async (token: string): Promise<GuideProfileDashboard | null> => {
    try {
      const d = await getMyGuideProfile(token)
      setProfile(d.profile)
      setDashboard(d)
      return d
    } catch {
      clearGuideToken()
      setGuideToken(null)
      setProfile(null)
      setDashboard(null)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const token = getStoredGuideToken()
      if (!mounted) return
      setGuideLoading(false)
      if (token) {
        setGuideToken(token)
        const d = await loadDashboard(token)
        if (mounted && d) setView('dashboard')
      }
    }
    init()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goRegister = () => {
    setErr('')
    setDone('')
    setView('register')
  }

  const goMember = () => {
    setErr('')
    setDone('')
    setView('member')
  }

  const backToLanding = () => {
    setErr('')
    setDone('')
    setView('landing')
  }

  const guideLogout = async () => {
    setErr('')
    setDone('')
    clearGuideToken()
    setGuideToken(null)
    setProfile(null)
    setDashboard(null)
    setPin('')
    setView('landing')
  }

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setDone('')
    setBusy(true)
    try {
      const r = await registerGuideAccount({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        state: state.trim(),
        location: null,
      })
      storeGuideToken(r.access_token)
      setGuideToken(r.access_token)
      setProfile(r.profile)
      const d = await getMyGuideProfile(r.access_token)
      if (d) {
        setDashboard(d)
        setView('dashboard')
      }
      setPin(r.pin || '')
      setDone(r.message || 'Welcome aboard!')
      setName('')
      setPhone('')
      setEmail('')
      setState('')
    } catch (error: any) {
      setErr(error.message || 'Registration could not be submitted. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const memberLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setDone('')
    setBusy(true)
    try {
      const r = await guideSignIn(memberEmail.trim().toLowerCase(), memberPin.trim())
      storeGuideToken(r.access_token)
      setGuideToken(r.access_token)
      const d = await getMyGuideProfile(r.access_token)
      if (!d) throw new Error('No guide profile is linked to this account. Please complete New Registration first.')
      setDashboard(d)
      setProfile(d.profile)
      setDone('Welcome back!')
      setView('dashboard')
      setMemberEmail('')
      setMemberPin('')
    } catch (error: any) {
      setErr(error.message || 'Could not sign you in. Check your email and Guide PIN.')
    } finally {
      setBusy(false)
    }
  }

  const setAvailability = async (next: 'open_to_work' | 'not_ready') => {
    if (!guideToken || !profile) return
    setErr('')
    setDone('')
    try {
      const r = await updateGuideAvailability(next, guideToken)
      setProfile(r.profile)
      setDashboard((d) => (d ? { ...d, profile: r.profile } : d))
      setDone(r.message || `You are now marked as ${next === 'open_to_work' ? 'OPEN TO WORK' : 'NOT READY'}.`)
    } catch (error: any) {
      setErr(error.message || 'Could not update your availability.')
    }
  }

  if (guideLoading) {
    return (
      <>
        <div className="v-center">
          <PageHead
            title="Heritage Guide — Vacancies"
            sub="A chance to share what you know with travellers discovering India's heritage."
            crumbs={[{ label: 'Vacancies' }]}
          />
        </div>
        <div className="container" style={{ marginBottom: 40 }}><Skeleton style={{ height: 320 }} /></div>
      </>
    )
  }

  const hero = (
    <div className="v-center">
      <PageHead
        title="Heritage Guide — Vacancies"
        sub="A chance to share what you know. Residents, culture enthusiasts and local historians can register as volunteer Heritage Guides and help visitors discover tangible and natural heritage sites across India."
        crumbs={[{ label: 'Vacancies' }]}
      />
    </div>
  )

  return (
    <>
      {hero}

      {/* ===== Landing ===== */}
      {view === 'landing' && (
        <div className="container v-layout">
          <div className="v-stack">
            <section className="v-card">
              <h3>About the Opportunity</h3>
              <p>
                The Sanskriti Setu portal connects travellers, students and researchers with India's
                built and natural heritage — forts, temples, monuments, stepwells, national parks and
                landscapes of significance. Local knowledge makes these visits far richer.
              </p>
              <p>
                As a volunteer Heritage Guide, you can offer your time to share stories, context and
                practical guidance with visitors at treasures in your neighbourhood. There is no set
                hourly commitment — you decide how and when you contribute.
              </p>
              <p>
                <b>This is a community opportunity, not a government job.</b> The portal does not pay
                or employ guides, and no contract or guarantee of work is implied.
              </p>
            </section>

            <section className="v-card">
              <h3>Who Can Apply</h3>
              <ul className="v-list">
                <li>Residents with genuine knowledge of a town, city or region's heritage.</li>
                <li>Students and scholars of history, archaeology, culture or nature.</li>
                <li>Artisans, storytellers and community members who keep traditions alive.</li>
                <li>Anyone willing to share verifiable, respectful and accurate information.</li>
              </ul>
              <p style={{ marginTop: 14 }}>
                Explore the places where guides are featured:{' '}
                <Link to="/heritage/tangible">Tangible Heritage</Link> and{' '}
                <Link to="/heritage/world">World Heritage sites</Link>.
              </p>
            </section>

            <section className="v-card">
              <h3>Your Role as a Guide</h3>
              <p>
                Volunteering is entirely your call — you welcome visitors at sites you know and love,
                and share what makes them special.
              </p>
              <ul className="v-list">
                <li>Guide visitors around the treasures in your neighbourhood.</li>
                <li>Share stories, context and practical guidance on the spot.</li>
                <li>Keep every detail verifiable, respectful and accurate.</li>
                <li>Set your own pace — there is no fixed hourly commitment.</li>
              </ul>
            </section>
          </div>

          <aside className="v-panel">
            <h3>Join the Guide Programme</h3>
            <p className="v-panel-sub">
              Create a dedicated guide account to start volunteering. This guide identity is
              separate from the main Sanskriti Setu website Sign In.
            </p>
            <p className="v-panel-actions">
              <button className="btn btn-primary btn-block" onClick={goRegister}>
                 New Registration
              </button>
              <button className="btn btn-outline btn-block" onClick={goMember}>
                 Already a Member
              </button>
            </p>
            <p className="v-panel-hint">
              New here? New Registration creates your own guide account and issues a Guide PIN you
              can use to sign back in under “Already a Member”.
            </p>
            <hr className="v-panel-divider" />
            <div className="v-note">
              <b>Guide Availability</b>
              <p>
                Heritage Guides are available on Tangible Heritage and Natural Heritage site pages.
                Intangible culture (dance, music, crafts) is served through the Culture section
                instead.
              </p>
            </div>
            {err && <p className="v-form-msg" style={{ color: 'var(--orange-deep)', marginTop: 14 }}>{err}</p>}
            {done && <p className="v-form-msg" style={{ color: 'var(--green-deep)', marginTop: 14 }}>✓ {done}</p>}
          </aside>
        </div>
      )}

      {/* ===== Guide registration form (separate from main website login) ===== */}
      {view === 'register' && (
        <div className="container" style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={backToLanding}>← Back to Vacancies</button>
          </div>
          <div className="v-layout" style={{ margin: 0 }}>
            <div className="v-stack">
              <section className="v-card">
                <h3>Complete Your Registration</h3>
                <p>
                  This creates a <b>dedicated guide account</b> — it is completely separate from the
                  main Sanskriti Setu website login and never turns your normal account into a guide.
                </p>
                <ul className="v-list">
                  <li>Your profile becomes live immediately and starts as OPEN TO WORK.</li>
                  <li>You'll receive a Guide PIN to sign back in under “Already a Member”.</li>
                  <li>Your phone and email are never published on site pages.</li>
                  <li>You can change your availability any time from your dashboard.</li>
                </ul>
              </section>

              <div className="v-note" style={{ margin: 0 }}>
                <b>Guide Availability</b>
                <p>
                  Heritage Guides are available on Tangible Heritage and Natural Heritage site pages.
                  Intangible culture (dance, music, crafts) is served through the Culture section
                  instead.
                </p>
              </div>
            </div>

            <aside className="v-panel">
              <h3>Register as a Heritage Guide</h3>
              <p className="v-panel-sub">
                A dedicated guide account — not your main website sign-in. One account per guide.
              </p>
              <form className="v-form" onSubmit={submitRegistration}>
                <div className="field">
                  <label>Full Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" required />
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="tel" required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </div>
                <div className="field">
                  <label>From State</label>
                  {statesLoading ? (
                    <Skeleton style={{ height: 42 }} />
                  ) : !states || states.length === 0 ? (
                    <input className="input" value={state} onChange={(e) => setState(e.target.value)} placeholder="Your state" required />
                  ) : (
                    <select className="input" value={state} onChange={(e) => setState(e.target.value)} required>
                      <option value="">Select your state…</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {done && <p className="v-form-msg" style={{ color: 'var(--green-deep)' }}>✓ {done}</p>}
                {err && <p className="v-form-msg" style={{ color: 'var(--orange-deep)' }}>{err}</p>}

                <button className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit Registration'}
                </button>
                <p className="v-form-terms">
                  After submitting, your profile goes live as OPEN TO WORK and you'll receive a
                  Guide PIN for sign-in next time. Your phone and email are never published.
                </p>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* ===== Guide member login (separate from main website login) ===== */}
      {view === 'member' && (
        <div className="container" style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={backToLanding}>← Back to Vacancies</button>
          </div>
          <div className="v-layout" style={{ margin: 0 }}>
            <div className="v-stack">
              <section className="v-card">
                <h3>Member Sign In</h3>
                <p>
                  Sign back in to your Heritage Guide profile with the email and <b>Guide PIN</b>{' '}
                  you received during New Registration.
                </p>
                <ul className="v-list">
                  <li>This guide sign-in is separate from the main website login.</li>
                  <li>Only you can view your own private guide profile.</li>
                  <li>Signing out of the guide system never signs you out of your main account.</li>
                </ul>
              </section>

              <div className="v-note" style={{ margin: 0 }}>
                <b>Lost your Guide PIN?</b>
                <p>
                  Contact the portal team — they can issue a new Guide PIN for your registered
                  guide email address.
                </p>
              </div>
            </div>

            <aside className="v-panel">
              <h3>Sign In as a Guide Member</h3>
              <p className="v-panel-sub">
                Your dedicated guide account — not the main Sanskriti Setu Sign In.
              </p>
              <form className="v-form" onSubmit={memberLogin}>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </div>
                <div className="field">
                  <label>Guide PIN</label>
                  <input className="input" type="password" value={memberPin} onChange={(e) => setMemberPin(e.target.value)} placeholder="8-character Guide PIN" autoComplete="current-password" required />
                </div>

                {done && <p className="v-form-msg" style={{ color: 'var(--green-deep)' }}>✓ {done}</p>}
                {err && <p className="v-form-msg" style={{ color: 'var(--orange-deep)' }}>{err}</p>}

                <button className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign In to Guide Profile'}
                </button>
                <p className="v-form-terms">
                  Not a member yet?{' '}
                  <button type="button" className="link-button" onClick={goRegister}>Create your guide account</button>.
                </p>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* ===== Guide dashboard (guide's own private profile) ===== */}
      {view === 'dashboard' && profile && (
        <div className="container" style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Your guide dashboard</h3>
            <button className="btn btn-outline btn-sm" onClick={guideLogout}>
               Guide Logout
            </button>
          </div>

          <div className="card-grid tight" style={{ marginTop: 12 }}>
            <div className="feature-card">
              <div className="fc-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{profile.name}</h3>
                    <p className="muted small" style={{ margin: '2px 0 0' }}>
                      📍 {profile.location || profile.state}
                    </p>
                  </div>
                </div>
                <p className="muted small" style={{ margin: '10px 0 0' }}>📧 {profile.email}</p>
                <p className="muted small" style={{ margin: '4px 0 0' }}>📞 {profile.phone}</p>
                <p className="muted small" style={{ margin: '4px 0 0' }}>🗓️ Registered {formatDate(profile.created_at)}</p>
                <p className="muted small" style={{ margin: '10px 0 0', paddingTop: 8, borderTop: '1px dashed var(--archival-line)' }}>
                  You are signed in to the Guide system only. Your main Sanskriti Setu website
                  account is separate and unaffected.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="fc-body">
                <h3 style={{ margin: '0 0 8px' }}>Availability</h3>
                {availabilityChip(profile.availability)}
                {profile.availability === 'occupied' ? (
                  <p className="muted small" style={{ margin: '10px 0 0' }}>
                    You are currently on a tour. Availability switches back to OPEN TO WORK automatically
                    once the tour ends.
                  </p>
                ) : (
                  <>
                    <p className="muted small" style={{ margin: '10px 0 0' }}>
                      Choose whether visitors can book you. You can never set yourself to Occupied —
                      that happens automatically while a tour is active.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        className={`btn btn-sm ${profile.availability === 'open_to_work' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setAvailability('open_to_work')}
                        disabled={profile.availability === 'open_to_work'}
                      >
                        {profile.availability === 'open_to_work' ? '✓ Open to Work' : 'Open to Work'}
                      </button>
                      <button
                        className={`btn btn-sm ${profile.availability === 'not_ready' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setAvailability('not_ready')}
                        disabled={profile.availability === 'not_ready'}
                      >
                        {profile.availability === 'not_ready' ? '✓ Not Ready' : 'Not Ready'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="feature-card">
              <div className="fc-body">
                <h3 style={{ margin: '0 0 8px' }}>Tour activity</h3>
                <p className="desc" style={{ marginBottom: 4 }}>
                  ✅ Tours Completed Successfully: <b>{dashboard?.tours_completed ?? 0}</b>
                </p>
                <p className="desc" style={{ marginBottom: 4 }}>
                  ⭐ Reviews: <b>{dashboard?.reviews_count ?? 0}</b>{' '}
                  {dashboard && dashboard.reviews_count > 0 && (
                    <span className="muted small">· {Number(dashboard.rating || 0).toFixed(1)} / 5 average</span>
                  )}
                </p>
                <p className="desc" style={{ marginBottom: 0 }}>
                  🚩 Reports: <b>{dashboard?.reports_count ?? 0}</b>{' '}
                  <span className="muted small">(shown only to administrators)</span>
                </p>
              </div>
            </div>
          </div>

          {pin && (
            <div className="feature-card" style={{ marginTop: 12, border: '1px solid var(--orange-deep)' }}>
              <div className="fc-body">
                <h3 style={{ margin: 0 }}>Your Guide PIN</h3>
                <p className="desc" style={{ margin: '6px 0 0' }}>
                  Keep this safe — you'll use it with your registered email to sign back in under{' '}
                  <b>Already a Member</b>.
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, margin: '6px 0' }}>{pin}</p>
                <button className="btn btn-outline btn-sm" onClick={() => setPin('')}>Got it</button>
              </div>
            </div>
          )}

          {dashboard?.current_tour && (
            <div className="feature-card" style={{ marginTop: 12, border: '1px solid var(--green-deep)' }}>
              <div className="fc-body">
                <h3 style={{ margin: 0 }}>Current Tour</h3>
                <p className="desc" style={{ margin: '6px 0 0' }}>
                  Heritage Site: <b>{dashboard.current_tour.site_name}</b>
                </p>
                <p className="muted small" style={{ margin: '6px 0 0' }}>
                  Active since {formatDate(dashboard.current_tour.created_at)}
                </p>
              </div>
            </div>
          )}

          {done && <p style={{ color: 'var(--green-deep)', fontSize: 13.5, marginTop: 12 }}>✓ {done}</p>}
          {err && <p style={{ color: 'var(--orange-deep)', fontSize: 13.5, marginTop: 12 }}>{err}</p>}
        </div>
      )}

      {view === 'dashboard' && profile === null && (
        <div className="container" style={{ marginBottom: 44 }}>
          <Empty big="🧭" text="Your guide profile could not be loaded. Please sign back in from the options on the Vacancies landing page." />
        </div>
      )}
    </>
  )
}