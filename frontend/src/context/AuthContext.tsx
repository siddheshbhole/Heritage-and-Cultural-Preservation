import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { get } from '../api/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  /** True while /admin/session is still in flight for the current token. */
  adminChecking: boolean
  token: string | null
  authModalOpen: boolean
  authModalTab: 'login' | 'signup'
  openAuthModal: (tab?: 'login' | 'signup') => void
  closeAuthModal: () => void
  signIn: (email: string, pass: string) => Promise<{ error: any }>
  signUp: (email: string, pass: string, fullName?: string) => Promise<{ error: any; data: any }>
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, pass: string, fullName?: string) => Promise<{ error: any; data: any }>
  signInWithOtp: (email: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null)
  const [adminChecking, setAdminChecking] = useState<boolean>(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login')

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => setAuthModalOpen(false)

  useEffect(() => {
    // Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Ask the backend whether this token is an administrator. The response is
   * authoritative and replaces the optimistic guess, so the portal is only ever
   * shown to an account whose verified token passes the same checks that guard
   * the admin routes.
   */
  useEffect(() => {
    const accessToken = session?.access_token
    if (!accessToken) {
      setAdminVerified(null)
      setAdminChecking(false)
      return
    }

    let cancelled = false
    // Mark the verdict as pending so route guards wait for the authoritative
    // answer instead of acting on the optimistic guess.
    setAdminChecking(true)
    setAdminVerified(null)

    get<{ is_admin: boolean }>('/admin/session', accessToken)
      .then((body) => {
        if (!cancelled && typeof body?.is_admin === 'boolean') {
          setAdminVerified(body.is_admin)
        }
      })
      .catch(() => {
        /* Network failure leaves the optimistic guess in place; admin routes still 403. */
      })
      .finally(() => {
        if (!cancelled) setAdminChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  // Parse optional comma-separated admin emails from env, normalized to lowercase
  const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

  /**
   * Optimistic client-side guess, used only until /admin/session answers. The
   * backend is the sole authority because it reads ADMIN_EMAILS and the role
   * claims from a verified token; guessing here would let the portal render for
   * an account the API then rejects with 403.
   */
  const guessAdmin = Boolean(
    user &&
      (user.app_metadata?.role === 'admin' ||
        user.user_metadata?.role === 'admin' ||
        (user.email && envAdminEmails.includes(user.email.toLowerCase())))
  )

  const isAdmin = adminVerified ?? guessAdmin

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password: pass })
    return { error: res.error }
  }

  const signUpWithEmail = async (email: string, pass: string, fullName?: string) => {
    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    })
    if (res.error) {
      return { error: res.error, data: res.data }
    }
    // If Supabase requires email confirmation, sign in explicitly after signup
    if (!res.data.session) {
      const signInRes = await supabase.auth.signInWithPassword({ email, password: pass })
      return { error: signInRes.error, data: signInRes.data }
    }
    return { error: null, data: res.data }
  }

  const signInWithOtp = async (email: string) => {
    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    return { error: res.error }
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const res = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { error: res.error }
  }

  const signOut = async () => {
    const res = await supabase.auth.signOut()
    return { error: res.error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        adminChecking,
        token: session?.access_token ?? null,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        signIn: signInWithEmail,
        signUp: signUpWithEmail,
        signInWithEmail,
        signUpWithEmail,
        signInWithOtp,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

