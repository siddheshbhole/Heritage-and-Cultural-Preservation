import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AdminIcon } from '../pages/admin/AdminIcons'

interface ProtectedRouteProps {
  children: React.ReactElement
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, adminChecking } = useAuth()
  const location = useLocation()

  // Wait for both the Supabase session and the authoritative admin verdict.
  // Deciding while /admin/session is in flight would deny an account that is on
  // the ADMIN_EMAILS server-side whitelist but carries no client-side hint.
  if (loading || (requireAdmin && adminChecking)) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="form-card" style={{ maxWidth: 480, margin: '40px auto', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AdminIcon name="shield" size={36} strokeWidth={1.4} />
          </div>
          <h2>Access Denied</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            Administrative privileges are required to view the administration portal.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    )
  }

  return children
}
