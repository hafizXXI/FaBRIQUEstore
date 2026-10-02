import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState.jsx'
import { OrderTimeline } from '../components/OrderTimeline.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getCustomerOrder, getOrderStatusHistory } from '../services/orderService.js'

function formatCurrency(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG')}`
}

function formatStatus(value) {
  return String(value || 'Pending payment')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function OrderDetailPage() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(Boolean(id) && Boolean(user?.id))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id || !id) {
      setOrder(null)
      setLoading(false)
      return
    }

    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data: orderData, error: orderError } = await getCustomerOrder(user.id, id)
        if (orderError) {
          throw orderError
        }

        if (!orderData) {
          if (isMounted) {
            setOrder(null)
          }
          return
        }

        const { data: historyData, error: historyError } = await getOrderStatusHistory(orderData.id)
        if (historyError) {
          throw historyError
        }

        if (!isMounted) {
          return
        }

        setOrder(orderData)
        setTimeline(historyData ?? [])
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load this order.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [id, user?.id])

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Order details</p>
          <h1>Please sign in</h1>
          <p className="supporting-copy">Orders are private to the customer account that placed them.</p>
          <Link className="primary-link" to="/login">Sign in</Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return <LoadingState message="Loading order details…" />
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Order details</p>
          <h1>Unable to load this order</h1>
          <p className="supporting-copy">{error}</p>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Order details</p>
          <h1>Order not found</h1>
          <p className="supporting-copy">This order cannot be found for your account.</p>
          <Link className="primary-link" to="/orders">Back to orders</Link>
        </div>
      </main>
    )
  }

  const address = order.delivery_address_snapshot || {}

  return (
    <main className="page-shell order-detail-shell">
      <div className="order-detail-header">
        <div>
          <p className="eyebrow">Order details</p>
          <h1>{order.order_number}</h1>
        </div>
        <Link className="secondary-link" to="/orders">Back to orders</Link>
      </div>

      <div className="order-detail-grid">
        <section className="checkout-card">
          <div className="panel-header">
            <h2>Order overview</h2>
          </div>
          <div className="detail-grid-row">
            <span>Placed</span>
            <strong>{new Date(order.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
          </div>
          <div className="detail-grid-row">
            <span>Status</span>
            <strong>{formatStatus(order.status)}</strong>
          </div>
          <div className="detail-grid-row">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </section>

        <section className="checkout-card">
          <div className="panel-header">
            <h2>Delivery address</h2>
          </div>
          <div className="address-overview">
            <strong>{address.recipient_name || 'Delivery recipient'}</strong>
            <small>{address.phone}</small>
            <small>{address.address}</small>
            <small>{address.city}, {address.state}</small>
            <small>{address.postal_code}</small>
            {address.instructions && <small>Instructions: {address.instructions}</small>}
          </div>
        </section>
      </div>

      <div className="order-detail-grid">
        <section className="checkout-card">
          <div className="panel-header">
            <h2>Items</h2>
          </div>
          <div className="order-items-list">
            {(order.order_items ?? []).map((item) => (
              <div key={item.id} className="checkout-line-item">
                <div>
                  <strong>{item.product_name_snapshot}</strong>
                  <small>{item.quantity} × {formatCurrency(item.unit_price)}</small>
                </div>
                <strong>{formatCurrency(item.subtotal)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="checkout-card">
          <div className="panel-header">
            <h2>Status timeline</h2>
          </div>
          <OrderTimeline entries={timeline} />
        </section>
      </div>
    </main>
  )
}

export { OrderDetailPage }
