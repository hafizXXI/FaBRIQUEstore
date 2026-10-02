import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function ProtectedRoute({ roles }) {
  const location = useLocation()
  const { isAuthenticated, loading, profile, isSupabaseConfigured } = useAuth()

  if (loading) {
    return (
      <div className="loading-shell" aria-live="polite">
        <div className="loading-card">
          <p>Preparing your account…</p>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (roles && (!profile || !roles.includes(profile.role))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export { ProtectedRoute }
