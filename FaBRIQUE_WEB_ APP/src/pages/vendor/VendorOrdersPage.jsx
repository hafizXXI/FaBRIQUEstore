import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getVendorOrders, updateVendorOrderStatus } from '../../services/orderService.js'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value ?? 0))
}

const allowedTransitions = {
  new: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: ['picked_up'],
  picked_up: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
}

function VendorOrdersPage() {
  const { vendorApplication, user, isSupabaseConfigured } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOrders() {
    if (!vendorApplication || !isSupabaseConfigured) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const { data, error: loadError } = await getVendorOrders(vendorApplication.id)
      if (loadError) {
        throw loadError
      }
      setOrders(data ?? [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [vendorApplication, isSupabaseConfigured])

  const nextStatuses = useMemo(() => {
    return orders.reduce((map, order) => {
      map[order.id] = allowedTransitions[order.status] || []
      return map
    }, {})
  }, [orders])

  async function handleStatusChange(orderId, nextStatus) {
    try {
      await updateVendorOrderStatus({
        vendorOrderId: orderId,
        nextStatus,
        changedBy: user?.id,
      })
      await loadOrders()
    } catch (updateError) {
      setError(updateError.message || 'Unable to update this order status.')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <strong>Supabase is not configured.</strong>
          <p>Vendor order management requires the live backend.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Your vendor orders</h1>
        </div>
      </div>

      {error && <div className="form-error-block">{error}</div>}

      {loading ? (
        <div className="loading-card"><p>Loading vendor orders…</p></div>
      ) : orders.length ? (
        <div className="vendor-orders-grid">
          {orders.map((order) => (
            <article key={order.id} className="vendor-order-card">
              <div className="vendor-order-header">
                <div>
                  <strong>{order.orders?.order_number || 'Order'}</strong>
                  <small>{new Date(order.created_at).toLocaleDateString()}</small>
                </div>
                <span className="status-pill">{order.status}</span>
              </div>

              <div className="vendor-order-body">
                <p>{order.orders?.profiles?.full_name || 'Customer'}</p>
                <ul>
                  {(order.vendor_order_items ?? []).map((item) => (
                    <li key={item.id}>
                      {item.products?.name || 'Product'} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <strong>{formatCurrency(order.subtotal)}</strong>
              </div>

              {nextStatuses[order.id]?.length ? (
                <div className="vendor-order-actions">
                  {nextStatuses[order.id].map((status) => (
                    <button key={status} type="button" onClick={() => handleStatusChange(order.id, status)}>
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state-panel">
          <h2>No orders yet</h2>
          <p>Your customer orders will appear here once they are placed.</p>
        </div>
      )}
    </main>
  )
}

export { VendorOrdersPage }
