import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { VendorStatusPage } from '../pages/vendor/VendorStatusPage.jsx'

function VendorAccessGate() {
  const location = useLocation()
  const { isAuthenticated, loading, profile, isSupabaseConfigured, vendorApplication } = useAuth()

  if (loading) {
    return (
      <div className="loading-shell" aria-live="polite">
        <div className="loading-card">
          <p>Checking your vendor access…</p>
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

  if (!profile || profile.role !== 'vendor') {
    return <Navigate to="/unauthorized" replace />
  }

  if (!vendorApplication) {
    return <VendorStatusPage status="missing" />
  }

  if (['pending', 'under_review', 'rejected', 'suspended'].includes(vendorApplication.status)) {
    return <VendorStatusPage status={vendorApplication.status} />
  }

  return (
    <div className="vendor-shell">
      <aside className="vendor-sidebar">
        <div className="vendor-sidebar-brand">
          <span>FaBRIQUE</span>
          <small>Vendor hub</small>
        </div>
        <nav className="vendor-sidebar-nav" aria-label="Vendor navigation">
          <NavLink to="/vendor">Dashboard</NavLink>
          <NavLink to="/vendor/products">Products</NavLink>
          <NavLink to="/vendor/orders">Orders</NavLink>
          <NavLink to="/vendor/store">Store</NavLink>
          <NavLink to="/vendor/earnings">Earnings</NavLink>
        </nav>
      </aside>
      <div className="vendor-content">
        <Outlet />
      </div>
    </div>
  )
}

export { VendorAccessGate }
