import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useAddresses } from '../hooks/useAddresses.js'
import { useCart } from '../hooks/useCart.js'
import { useCheckout } from '../hooks/useCheckout.js'

function formatCurrency(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG')}`
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { items, summary, loading: cartLoading, error: cartError } = useCart(user?.id)
  const { addresses, loading: addressesLoading, saveAddress } = useAddresses(user?.id)
  const { submitting, submitOrder } = useCheckout()
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    label: '',
    recipient_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  })
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId('')
      return
    }

    const defaultAddress = addresses.find((address) => address.is_default) || addresses[0]
    setSelectedAddressId(defaultAddress.id)
  }, [addresses])

  const groupedByVendor = useMemo(() => Object.entries(items.reduce((groups, item) => {
    const vendorName = item.product?.vendor?.storeName || 'FaBRIQUE vendor'
    if (!groups[vendorName]) {
      groups[vendorName] = []
    }
    groups[vendorName].push(item)
    return groups
  }, {})), [items])

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Checkout</p>
          <h1>Please sign in</h1>
          <p className="supporting-copy">Your order details are tied to your FaBRIQUE account.</p>
          <Link className="primary-link" to="/login">Sign in</Link>
        </div>
      </main>
    )
  }

  if (cartLoading || addressesLoading) {
    return <LoadingState message="Preparing your checkout…" />
  }

  if (cartError) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Checkout</p>
          <h1>Unable to load your cart</h1>
          <p className="supporting-copy">{cartError}</p>
          <Link className="primary-link" to="/cart">Back to cart</Link>
        </div>
      </main>
    )
  }

  if (!items.length) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Checkout</p>
          <h1>Your cart is empty</h1>
          <p className="supporting-copy">Add fabrics to your bag before you continue to checkout.</p>
          <Link className="primary-link" to="/explore">Browse fabrics</Link>
        </div>
      </main>
    )
  }

  async function handleCreateAddress(event) {
    event.preventDefault()
    setAddressError('')

    const requiredFields = ['label', 'recipient_name', 'phone', 'address', 'city', 'state']
    const missing = requiredFields.some((field) => !String(addressForm[field] ?? '').trim())

    if (missing) {
      setAddressError('Please complete the required address fields.')
      return
    }

    try {
      await saveAddress({
        userId: user.id,
        label: addressForm.label,
        recipient_name: addressForm.recipient_name,
        phone: addressForm.phone,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        instructions: '',
        is_default: !addresses.length,
      })
      setShowAddressForm(false)
      setAddressForm({
        label: '',
        recipient_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
      })
    } catch (addressSaveError) {
      setAddressError(addressSaveError.message || 'Unable to save this address.')
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      window.alert('Please choose a delivery address.')
      return
    }

    try {
      const result = await submitOrder({
        userId: user.id,
        addressId: selectedAddressId,
        deliveryInstructions,
      })

      const orderId = result?.id || result?.order?.id || result?.data?.id || result?.order_id
      if (orderId) {
        navigate(`/orders/${orderId}`)
      } else {
        navigate('/orders')
      }
    } catch (orderError) {
      window.alert(orderError.message || 'Order could not be created.')
    }
  }

  return (
    <main className="page-shell checkout-shell">
      <div className="checkout-header">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Prepare your order</h1>
        </div>
        <Link className="secondary-link" to="/cart">Back to cart</Link>
      </div>

      <div className="checkout-grid">
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="panel-header">
              <h2>Delivery address</h2>
              {!showAddressForm && <button type="button" className="link-button" onClick={() => setShowAddressForm(true)}>Add address</button>}
            </div>

            {addresses.length ? (
              <div className="address-list">
                {addresses.map((address) => (
                  <label key={address.id} className={`address-option ${selectedAddressId === address.id ? 'selected' : ''}`}>
                    <input type="radio" name="delivery-address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} />
                    <span>
                      <strong>{address.label}</strong>
                      <small>{address.recipient_name} • {address.phone}</small>
                      <small>{address.address}, {address.city}, {address.state} {address.postal_code}</small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No delivery addresses saved yet. Add one to continue.</p>
            )}

            {showAddressForm && (
              <form onSubmit={handleCreateAddress} className="address-form">
                <div className="address-form-grid">
                  <label className="form-field">
                    <span>Label</span>
                    <input value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>Recipient name</span>
                    <input value={addressForm.recipient_name} onChange={(event) => setAddressForm((current) => ({ ...current, recipient_name: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>Phone</span>
                    <input value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>Postal code</span>
                    <input value={addressForm.postal_code} onChange={(event) => setAddressForm((current) => ({ ...current, postal_code: event.target.value }))} />
                  </label>
                  <label className="form-field full-width">
                    <span>Address</span>
                    <textarea value={addressForm.address} onChange={(event) => setAddressForm((current) => ({ ...current, address: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>City</span>
                    <input value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>State</span>
                    <input value={addressForm.state} onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))} />
                  </label>
                </div>
                {addressError && <p className="form-error-block">{addressError}</p>}
                <div className="inline-actions">
                  <button type="submit" className="primary-link compact">Save address</button>
                  <button type="button" className="ghost-button" onClick={() => setShowAddressForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </section>

          <section className="checkout-card">
            <div className="panel-header">
              <h2>Order items</h2>
            </div>
            {groupedByVendor.map(([vendorName, vendorItems]) => (
              <div key={vendorName} className="vendor-order-breakdown">
                <h3>{vendorName}</h3>
                {vendorItems.map((item) => (
                  <div key={item.id} className="checkout-line-item">
                    <div>
                      <strong>{item.product?.name}</strong>
                      <small>{item.quantity} × {formatCurrency(item.product?.price ?? 0)}</small>
                    </div>
                    <strong>{formatCurrency(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="checkout-card">
            <div className="panel-header">
              <h2>Delivery notes</h2>
            </div>
            <label className="form-field full-width">
              <span>Delivery instructions</span>
              <textarea value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} placeholder="Add any delivery notes for the vendor or rider." />
            </label>
            <div className="payment-placeholder">
              <strong>Payment method</strong>
              <span>Online payment placeholder — not yet live in Phase 6.</span>
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Price summary</h2>
          <div className="summary-row">
            <span>Products subtotal</span>
            <strong>{formatCurrency(summary.subtotal)}</strong>
          </div>
          <div className="summary-row muted">
            <span>Delivery fee</span>
            <strong>Calculated later</strong>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>{formatCurrency(summary.subtotal)}</strong>
          </div>

          <button type="button" className="primary-link checkout-button" disabled={submitting || !selectedAddressId} onClick={handlePlaceOrder}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </main>
  )
}

export { CheckoutPage }
