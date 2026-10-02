import { ArrowLeft, CircleAlert, Heart, ShoppingBag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProductGallery } from '../components/ProductGallery.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { LoadingState } from '../components/LoadingState.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { addToCart } from '../services/cartService.js'
import { getProductsByCategory, getProductBySlug } from '../services/productService.js'
import { getWishlistProductIds, toggleWishlist } from '../services/customerService.js'

function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [savedProductIds, setSavedProductIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let isMounted = true

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        const { data: detail } = await getProductBySlug(slug)

        if (!isMounted) {
          return
        }

        if (!detail) {
          setProduct(null)
          setRelatedProducts([])
          setLoading(false)
          return
        }

        setProduct(detail)

        if (detail.category?.slug) {
          const { data: categoryProducts } = await getProductsByCategory(detail.category.slug, { limit: 4 })
          setRelatedProducts((categoryProducts ?? []).filter((item) => item.id !== detail.id))
        }

        if (user?.id) {
          const { data: savedIds } = await getWishlistProductIds(user.id)
          setSavedProductIds(savedIds ?? [])
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load this fabric.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      isMounted = false
    }
  }, [slug, user?.id])

  async function handleWishlistToggle() {
    if (!isAuthenticated || !user?.id || !product) {
      navigate('/login')
      return
    }

    try {
      const { added } = await toggleWishlist({ userId: user.id, productId: product.id })
      setSavedProductIds((current) => {
        if (added) {
          return [...new Set([...current, product.id])]
        }
        return current.filter((item) => item !== product.id)
      })
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update your wishlist.')
    }
  }

  async function handleAddToCart() {
    if (!isAuthenticated || !user?.id || !product) {
      navigate('/login')
      return
    }

    try {
      await addToCart({ userId: user.id, productId: product.id, quantity })
      navigate('/cart')
    } catch (cartError) {
      setError(cartError.message || 'Unable to add this fabric to your cart.')
    }
  }

  if (loading) {
    return <LoadingState message="Loading fabric details…" />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />
  }

  if (!product) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">FaBRIQUE</p>
          <h1>Fabric not found</h1>
          <p className="supporting-copy">This fabric is no longer available in the public marketplace.</p>
          <Link className="primary-link" to="/explore">Back to explore</Link>
        </div>
      </main>
    )
  }

  const description = product.description || 'This fabric is currently available from a trusted FaBRIQUE vendor.'

  return (
    <main className="page-shell product-detail-shell">
      <div className="detail-header">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </div>

      <div className="product-detail-layout">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="product-detail-copy">
          <p className="eyebrow">{product.category?.name || 'Fabric'}</p>
          <h1>{product.name}</h1>

          <div className="price-row">
            <strong>₦{Number(product.price || 0).toLocaleString('en-NG')}</strong>
            <span>/ {product.unit || 'yard'}</span>
          </div>

          <div className="meta-pill-row">
            {product.condition && <span className="chip">{product.condition.replace(/_/g, ' ')}</span>}
            {product.color && <span className="chip">{product.color}</span>}
            {product.pattern && <span className="chip">{product.pattern}</span>}
          </div>

          <div className="detail-actions">
            <button type="button" className="primary-link compact" onClick={handleWishlistToggle}>
              <Heart size={16} aria-hidden="true" />
              {savedProductIds.includes(product.id) ? 'Saved' : 'Save to wishlist'}
            </button>
            <div className="quantity-picker">
              <label htmlFor="detail-quantity">Qty</label>
              <select id="detail-quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <button type="button" className="secondary-button compact" onClick={handleAddToCart} disabled={product.quantity <= 0}>
              <ShoppingBag size={16} aria-hidden="true" />
              {product.quantity > 0 ? 'Add to cart' : 'Out of stock'}
            </button>
          </div>

          <div className="detail-info-box">
            <h2>About this fabric</h2>
            <p>{description}</p>
            <ul className="spec-list">
              <li><span>Vendor</span><strong>{product.vendor?.storeName || 'FaBRIQUE vendor'}</strong></li>
              <li><span>Location</span><strong>{product.location || product.vendor?.city || 'Location available on request'}</strong></li>
              <li><span>Availability</span><strong>{product.quantity > 0 ? `${product.quantity} available` : 'Currently unavailable'}</strong></li>
              <li><span>Condition</span><strong>{product.condition?.replace(/_/g, ' ') || 'New'}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="related-section">
        <div className="section-header">
          <h2>Related fabrics</h2>
          <Link to="/explore">View all</Link>
        </div>

        {relatedProducts.length ? (
          <div className="product-grid compact-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                isSaved={savedProductIds.includes(relatedProduct.id)}
                onToggleWishlist={async (selectedProduct) => {
                  if (!user?.id) return navigate('/login')
                  try {
                    const { added } = await toggleWishlist({ userId: user.id, productId: selectedProduct.id })
                    setSavedProductIds((current) => added ? [...new Set([...current, selectedProduct.id])] : current.filter((id) => id !== selectedProduct.id))
                  } catch (toggleError) {
                    setError(toggleError.message || 'Unable to update your wishlist.')
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <h3>More fabrics coming soon</h3>
            <p>Browse the full catalog to discover more options.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export { ProductDetailPage }
