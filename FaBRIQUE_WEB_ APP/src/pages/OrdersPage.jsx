import { Link } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCustomerOrders } from '../hooks/useCustomerOrders.js'

function formatCurrency(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG')}`
}

function formatStatus(value) {
  return String(value || 'Pending payment')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const { orders, loading, error } = useCustomerOrders(user?.id)

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Orders</p>
          <h1>Please sign in</h1>
          <p className="supporting-copy">Your orders are private to your FaBRIQUE account.</p>
          <Link className="primary-link" to="/login">Sign in</Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return <LoadingState message="Loading your orders…" />
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Your orders</p>
          <h1>Unable to load your orders</h1>
          <p className="supporting-copy">{error}</p>
        </div>
      </main>
    )
  }

  if (!orders.length) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Orders</p>
          <h1>Your order history is empty.</h1>
          <p className="supporting-copy">You haven’t placed any orders yet.</p>
          <Link className="primary-link" to="/explore">Browse fabrics</Link>
        </div>
      </main>
    )
  }

  const currentOrders = orders.filter((order) => !['completed', 'cancelled', 'refunded'].includes(order.status))
  const pastOrders = orders.filter((order) => ['completed', 'cancelled', 'refunded'].includes(order.status))

  return (
    <main className="page-shell orders-shell">
      <div className="order-page-header">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Your orders</h1>
        </div>
      </div>

      <div className="orders-section">
        <h2>Current</h2>
        {currentOrders.length ? (
          <div className="order-list">
            {currentOrders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <strong>{order.order_number}</strong>
                    <small>{new Date(order.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                  </div>
                  <span className="status-pill">{formatStatus(order.status)}</span>
                </div>
                <div className="order-card-meta">
                  <span>{order.order_items?.length ?? 0} items</span>
                  <span>{order.vendor_count ?? 0} vendors</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <Link className="secondary-link" to={`/orders/${order.id}`}>View order</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-panel">
            <h3>No active orders</h3>
            <p className="empty-copy">Your active order updates will appear here.</p>
          </div>
        )}
      </div>

      <div className="orders-section">
        <h2>Past</h2>
        {pastOrders.length ? (
          <div className="order-list">
            {pastOrders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <strong>{order.order_number}</strong>
                    <small>{new Date(order.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                  </div>
                  <span className="status-pill">{formatStatus(order.status)}</span>
                </div>
                <div className="order-card-meta">
                  <span>{order.order_items?.length ?? 0} items</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <Link className="secondary-link" to={`/orders/${order.id}`}>View details</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-panel">
            <h3>No past orders</h3>
            <p className="empty-copy">Once you place an order, it will appear here.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export { OrdersPage }
