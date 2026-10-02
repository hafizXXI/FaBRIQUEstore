import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getWishlistForUser, toggleWishlist } from '../services/customerService.js'

function WishlistPage() {
  const { user, isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [savedProductIds, setSavedProductIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setProducts([])
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadWishlist() {
      setLoading(true)
      setError('')

      try {
        const { data } = await getWishlistForUser(user.id)
        if (!isMounted) {
          return
        }

        setProducts(data ?? [])
        setSavedProductIds((data ?? []).map((item) => item.id))
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load your wishlist.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadWishlist()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user?.id])

  async function handleToggleWishlist(product) {
    if (!user?.id) {
      return
    }

    try {
      const { added } = await toggleWishlist({ userId: user.id, productId: product.id })
      setSavedProductIds((current) => added ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id))
      setProducts((current) => (added ? current : current.filter((item) => item.id !== product.id)))
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update your wishlist.')
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">Saved fabrics</p>
          <h1>Your wishlist</h1>
          <p className="supporting-copy">Sign in to save fabrics you love and keep track of your favorites.</p>
          <Link className="primary-link" to="/login">Sign in</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="section-header stacked-header">
        <div>
          <p className="eyebrow">Saved fabrics</p>
          <h1>Your wishlist</h1>
        </div>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        isSaved={savedProductIds.reduce((accumulator, value) => ({ ...accumulator, [value]: true }), {})}
        onToggleWishlist={handleToggleWishlist}
        emptyTitle="No saved fabrics yet"
        emptyMessage="Browse the marketplace and add fabrics you like to your wishlist."
      />
    </main>
  )
}

export { WishlistPage }
