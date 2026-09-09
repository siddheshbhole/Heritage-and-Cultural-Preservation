import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactElement
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
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
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
          <h2>Access Denied</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            Administrative privileges are required to view the moderation dashboard.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    )
  }

  return children
}

