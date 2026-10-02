import { MapPin, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { getVendorBySlug, getVendorProducts } from '../services/vendorService.js'

function VendorPage() {
  const { slug } = useParams()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadVendor() {
      setLoading(true)
      setError('')

      try {
        const { data: vendorData } = await getVendorBySlug(slug)

        if (!isMounted) {
          return
        }

        if (!vendorData) {
          setVendor(null)
          setProducts([])
          setLoading(false)
          return
        }

        setVendor(vendorData)

        const { data: vendorProducts } = await getVendorProducts(vendorData.id, { limit: 12 })
        setProducts(vendorProducts ?? [])
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load this vendor storefront.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadVendor()

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return <div className="loading-shell"><div className="loading-card"><p>Loading storefront…</p></div></div>
  }

  if (error) {
    return <div className="error-state" role="alert"><h3>Storefront unavailable</h3><p>{error}</p></div>
  }

  if (!vendor) {
    return (
      <main className="page-shell">
        <div className="content-card narrow-card">
          <p className="eyebrow">FaBRIQUE</p>
          <h1>Vendor not found</h1>
          <p className="supporting-copy">This vendor is not currently visible in the marketplace.</p>
          <Link className="primary-link" to="/explore">Browse fabrics</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-page-shell">
      <section className="vendor-hero">
        <div className="vendor-brand-mark">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={`${vendor.store_name} logo`} />
          ) : (
            <div className="vendor-card-fallback">FaBRIQUE</div>
          )}
        </div>

        <div className="vendor-header-copy">
          <p className="eyebrow">Approved vendor</p>
          <h1>{vendor.store_name}</h1>
          <div className="vendor-status-row">
            <span className="status-badge approved"><ShieldCheck size={13} aria-hidden="true" /> Approved</span>
            {vendor.city || vendor.state ? (
              <span className="meta-line"><MapPin size={14} aria-hidden="true" /> {vendor.city || ''}{vendor.city && vendor.state ? ', ' : ''}{vendor.state || ''}</span>
            ) : null}
          </div>
          <p className="supporting-copy">{vendor.description || 'This retailer is an approved FaBRIQUE marketplace partner.'}</p>
        </div>
      </section>

      <section className="vendor-products-section">
        <div className="section-header">
          <h2>Latest from {vendor.store_name}</h2>
          <Link to="/explore">Browse all fabrics</Link>
        </div>

        <ProductGrid products={products} loading={loading} error={error} emptyTitle="No fabrics yet" emptyMessage="This storefront has not published any marketplace listings yet." />
      </section>
    </main>
  )
}

export { VendorPage }
