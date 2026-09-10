import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
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

  // Parse optional comma-separated admin emails from env, normalized to lowercase
  const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

  // Check admin status
  const isAdmin = Boolean(
    user &&
    (
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin' ||
      user.email?.toLowerCase().endsWith('@culture.gov.in') ||
      user.email?.toLowerCase() === 'admin@example.com' ||
      (user.email && envAdminEmails.includes(user.email.toLowerCase()))
    )
  )

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
    return { error: res.error, data: res.data }
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

