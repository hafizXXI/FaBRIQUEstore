import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../hooks/useCart.js'

function formatCurrency(value) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG')}`
}

function CartPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { items, summary, loading, error, updateQuantity, removeItem, clearCart } = useCart(user?.id)
  const [busyItemId, setBusyItemId] = useState('')

  const groupedByVendor = useMemo(() => {
    return items.reduce((groups, item) => {
      const vendorName = item.product?.vendor?.storeName || 'FaBRIQUE seller'
      if (!groups[vendorName]) {
        groups[vendorName] = []
      }
      groups[vendorName].push(item)
      return groups
    }, {})
  }, [items])

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Your bag</p>
          <h1>Sign in to continue</h1>
          <p className="supporting-copy">Your cart is stored securely in your FaBRIQUE account.</p>
          <Link className="primary-link" to="/login">Sign in</Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return <LoadingState message="Loading your cart…" />
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Your bag</p>
          <h1>Unable to load your cart</h1>
          <p className="supporting-copy">{error}</p>
          <button type="button" className="primary-link" onClick={() => navigate(0)}>Retry</button>
        </div>
      </main>
    )
  }

  if (!items.length) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Your bag</p>
          <h1>Your cart is empty.</h1>
          <p className="supporting-copy">Browse the marketplace to add fabrics to your cart.</p>
          <Link className="primary-link" to="/explore">Continue shopping</Link>
        </div>
      </main>
    )
  }

  async function handleQuantity(itemId, nextQuantity) {
    if (nextQuantity <= 0) {
      return
    }

    setBusyItemId(itemId)

    try {
      await updateQuantity({ itemId, quantity: nextQuantity })
    } catch (updateError) {
      window.alert(updateError.message || 'Unable to update quantity.')
    } finally {
      setBusyItemId('')
    }
  }

  return (
    <main className="page-shell cart-shell">
      <div className="cart-header">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1>Cart summary</h1>
        </div>
        <button type="button" className="link-button danger" onClick={() => clearCart().catch((clearError) => window.alert(clearError.message || 'Unable to clear your cart.'))}>
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-groups">
          {Object.entries(groupedByVendor).map(([vendorName, vendorItems]) => (
            <section key={vendorName} className="cart-vendor-block">
              <div className="vendor-block-header">
                <h2>{vendorName}</h2>
                <span>{vendorItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>

              {vendorItems.map((item) => (
                <article key={item.id} className="cart-item-card">
                  <div className="cart-item-media">
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} />
                    ) : (
                      <div className="fabric-fallback">FaBRIQUE</div>
                    )}
                  </div>

                  <div className="cart-item-copy">
                    <div className="cart-item-row">
                      <div>
                        <strong>{item.product?.name || 'Fabric'}</strong>
                        <small>{item.product?.unit || 'yard'} • {item.product?.status === 'published' ? 'Ready to ship' : 'Availability check required'}</small>
                      </div>
                      <button type="button" className="icon-button danger" aria-label={`Remove ${item.product?.name ?? 'item'} from cart`} onClick={() => removeItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cart-item-meta">
                      <span>{formatCurrency(item.product?.price ?? 0)}</span>
                      <span>Subtotal {formatCurrency(item.lineTotal)}</span>
                    </div>

                    <div className="quantity-control" aria-label={`Quantity for ${item.product?.name ?? 'item'}`}>
                      <button type="button" className="icon-button" onClick={() => handleQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={busyItemId === item.id}>
                        <Minus size={14} />
                      </button>
                      <strong>{item.quantity}</strong>
                      <button type="button" className="icon-button" onClick={() => handleQuantity(item.id, item.quantity + 1)} disabled={busyItemId === item.id}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>

        <aside className="cart-summary-panel">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Products subtotal</span>
            <strong>{formatCurrency(summary.subtotal)}</strong>
          </div>
          <div className="summary-row muted"> 
            <span>Delivery</span>
            <strong>Calculated later</strong>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>{formatCurrency(summary.subtotal)}</strong>
          </div>
          <button type="button" className="primary-link checkout-button" onClick={() => navigate('/checkout')}>
            <ShoppingBag size={16} />
            Proceed to checkout
          </button>
        </aside>
      </div>
    </main>
  )
}

export { CartPage }
