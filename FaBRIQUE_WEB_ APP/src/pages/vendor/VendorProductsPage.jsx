import { Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getVendorProducts, updateProductStatus } from '../../services/productService.js'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value ?? 0))
}

function VendorProductsPage() {
  const { vendorApplication, isSupabaseConfigured } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return products
    }
    return products.filter((product) => (product.name || '').toLowerCase().includes(term))
  }, [products, search])

  async function loadProducts() {
    if (!vendorApplication || !isSupabaseConfigured) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const { data, error: loadError } = await getVendorProducts(vendorApplication.id)
      if (loadError) {
        throw loadError
      }
      setProducts(data ?? [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [vendorApplication, isSupabaseConfigured])

  async function handleStatusToggle(product) {
    const nextStatus = product.status === 'published' ? 'unpublished' : 'published'
    try {
      await updateProductStatus(product.id, nextStatus)
      await loadProducts()
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update product status.')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <strong>Supabase is not configured.</strong>
          <p>Product management is unavailable until the marketplace backend is configured.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Products</p>
          <h1>Manage your catalog</h1>
        </div>
        <Link className="primary-link" to="/vendor/products/new">Add product</Link>
      </div>

      <section className="vendor-control-row">
        <label className="search-field compact-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={search}
            placeholder="Search products"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {error && <div className="form-error-block">{error}</div>}

      {loading ? (
        <div className="loading-card"><p>Loading your products…</p></div>
      ) : filteredProducts.length ? (
        <div className="vendor-table-wrap">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="vendor-product-cell">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="vendor-product-thumb">FaBRIQUE</div>}
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.condition}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || 'Uncategorized'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.quantity}</td>
                  <td><span className="status-pill">{product.status}</span></td>
                  <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-stack">
                      <Link to={`/products/${product.slug}`}>View</Link>
                      <Link to={`/vendor/products/${product.id}/edit`}>Edit</Link>
                      <button type="button" onClick={() => handleStatusToggle(product)}>
                        {product.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className="danger-button" aria-label={`Delete ${product.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-panel">
          <h2>No products yet</h2>
          <p>Create your first fabric listing to start selling in the marketplace.</p>
          <Link className="primary-link" to="/vendor/products/new">Create product</Link>
        </div>
      )}
    </main>
  )
}

export { VendorProductsPage }
