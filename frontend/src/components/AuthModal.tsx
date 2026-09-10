import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signInWithOAuth,
  } = useAuth()

  const [tab, setTab] = useState<'login' | 'signup' | 'magic'>(authModalTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!authModalOpen) return null

  const resetForm = () => {
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(false)
  }

  const handleTabChange = (newTab: 'login' | 'signup' | 'magic') => {
    setTab(newTab)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetForm()
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setErrorMsg(error.message)
        } else {
          setSuccessMsg('Successfully signed in!')
          setTimeout(() => closeAuthModal(), 1000)
        }
      } else if (tab === 'signup') {
        const { error, data } = await signUpWithEmail(email, password, fullName)
        if (error) {
          setErrorMsg(error.message)
        } else if (data?.session) {
          setSuccessMsg('Account created and signed in successfully!')
          setTimeout(() => closeAuthModal(), 1200)
        } else {
          // Should not happen with auto-login enabled; keep modal open safely.
          setErrorMsg('Unable to establish a session. Please try signing in.')
        }
      } else if (tab === 'magic') {
        const { error } = await signInWithOtp(email)
        if (error) {
          setErrorMsg(error.message)
        } else {
          setSuccessMsg('Magic login link sent to your email!')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    resetForm()
    setLoading(true)
    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        setErrorMsg(error.message || `${provider.toUpperCase()} authentication is not configured. Please enable ${provider} under Supabase Auth -> Providers.`)
        setLoading(false)
      }
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to launch ${provider} sign-in. Please ensure ${provider} OAuth is configured in Supabase.`)
      setLoading(false)
    }
  }


  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={closeAuthModal}
    >
      <div
        className="modal-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px 12px',
              border: 'none',
              background: tab === 'login' ? '#ffffff' : 'transparent',
              borderBottom: tab === 'login' ? '2px solid var(--saffron-primary, #d97706)' : 'none',
              fontWeight: tab === 'login' ? '600' : '400',
              color: tab === 'login' ? '#111827' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14.5px',
            }}
            onClick={() => handleTabChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px 12px',
              border: 'none',
              background: tab === 'signup' ? '#ffffff' : 'transparent',
              borderBottom: tab === 'signup' ? '2px solid var(--saffron-primary, #d97706)' : 'none',
              fontWeight: tab === 'signup' ? '600' : '400',
              color: tab === 'signup' ? '#111827' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14.5px',
            }}
            onClick={() => handleTabChange('signup')}
          >
            Create Account
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '14px 12px',
              border: 'none',
              background: tab === 'magic' ? '#ffffff' : 'transparent',
              borderBottom: tab === 'magic' ? '2px solid var(--saffron-primary, #d97706)' : 'none',
              fontWeight: tab === 'magic' ? '600' : '400',
              color: tab === 'magic' ? '#111827' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onClick={() => handleTabChange('magic')}
          >
            Magic Link
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              {tab === 'login' && 'Welcome Back'}
              {tab === 'signup' && 'Join Sanskriti Setu'}
              {tab === 'magic' && 'Passwordless Sign In'}
            </h3>
            <button
              onClick={closeAuthModal}
              style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '13.5px', color: '#6b7280', marginTop: 0, marginBottom: 20 }}>
            {tab === 'login' && 'Sign in to submit cultural stories, access contributions, and view moderation updates.'}
            {tab === 'signup' && 'Create your cultural contributor profile on India’s national preservation portal.'}
            {tab === 'magic' && 'Receive a secure, single-use login link straight to your inbox.'}
          </p>

          <form onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div className="field" style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Full Name
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Email Address
              </label>
              <input
                className="input"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {tab !== 'magic' && (
              <div className="field" style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: 14,
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: 14,
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Send Magic Link'}
            </button>
          </form>

          {/* Social OAuth Providers */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
              <span
                style={{
                  position: 'absolute',
                  top: '-9px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: '#9ca3af',
                }}
              >
                OR CONTINUE WITH
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13.5px' }}
                onClick={() => handleOAuth('google')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13.5px' }}
                onClick={() => handleOAuth('github')}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
