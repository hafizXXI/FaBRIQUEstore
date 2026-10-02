import { ArrowRight, CircleAlert, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CategoryCard } from '../components/CategoryCard.jsx'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { SearchBar } from '../components/SearchBar.jsx'
import { VendorCard } from '../components/VendorCard.jsx'
import { useCategories } from '../hooks/useCategories.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getFeaturedProducts, getLimitedStockProducts, getNewArrivals, getProductsByCondition } from '../services/productService.js'
import { getApprovedVendors } from '../services/vendorService.js'

function HomePage() {
  const navigate = useNavigate()
  const { data: categories, loading: categoriesLoading } = useCategories()
  const [searchTerm, setSearchTerm] = useState('')
  const [newArrivals, setNewArrivals] = useState([])
  const [rareFinds, setRareFinds] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [limitedStock, setLimitedStock] = useState([])
  const [featuredVendors, setFeaturedVendors] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadMarketplace() {
      setLoading(true)
      setError('')

      try {
        const [newArrivalsResult, rareFindsResult, limitedResult, featuredResult, vendorResult] = await Promise.all([
          getNewArrivals(6),
          getProductsByCondition(['old_stock', 'vintage', 'pre_owned'], 6),
          getLimitedStockProducts(6),
          getFeaturedProducts(6),
          getApprovedVendors({ limit: 4 }),
        ])

        if (!isMounted) {
          return
        }

        setNewArrivals(newArrivalsResult.data ?? [])
        setRareFinds(rareFindsResult.data ?? [])
        setLimitedStock(limitedResult.data ?? [])
        setFeaturedProducts(featuredResult.data ?? [])
        setFeaturedVendors(vendorResult.data ?? [])
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load the marketplace.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMarketplace()

    return () => {
      isMounted = false
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">The fabric marketplace</p>
            <h1 id="home-title">Find the fabric<br />for <em>your story.</em></h1>
            <p className="hero-description">
              Discover independent fabric sellers and the textiles made for events, styling, and everyday creative work.
            </p>
            <Link className="primary-link" to="/explore">
              Explore the marketplace <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="textile-composition" role="img" aria-label="Graphic composition of burgundy and gold woven textile patterns">
            <span className="composition-label">Made for what comes next</span>
          </div>
        </section>
        <aside className="setup-notice home-notice" aria-live="polite">
          <CircleAlert size={19} aria-hidden="true" />
          <div>
            <strong>Marketplace setup required</strong>
            <p>Connect FaBRIQUE to Supabase to load live categories, products, and approved vendor storefronts. No sample catalog is shown.</p>
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">The fabric marketplace</p>
          <h1 id="home-title">Find the fabric<br />for <em>your story.</em></h1>
          <p className="hero-description">
            From event wear to statement tailoring, discover trusted fabrics and approved vendors across the marketplace.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to="/explore">
              Explore the marketplace <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="textile-composition" role="img" aria-label="Graphic composition of burgundy and gold woven fabric">
          <span className="composition-label">Made for what comes next</span>
        </div>
      </section>

      <section className="delivery-banner" aria-label="Delivery location">
        <div className="delivery-badge">
          <MapPin size={16} aria-hidden="true" />
          Deliver to
        </div>
        <div className="delivery-copy">
          <strong>Select your delivery location</strong>
          <span>Add delivery address</span>
        </div>
      </section>

      <section className="marketplace-search-section" aria-label="Market search">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const target = searchTerm.trim()
            navigate(target ? `/explore?q=${encodeURIComponent(target)}` : '/explore')
          }}
        >
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search fabrics, colors, patterns, vendors..." />
        </form>
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Shop by category</h2>
          <Link to="/explore">View all fabrics</Link>
        </div>

        {categoriesLoading ? (
          <div className="loading-shell compact-loading"><div className="loading-card"><p>Loading categories…</p></div></div>
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Featured fabrics</h2>
          <Link to="/explore">Browse all</Link>
        </div>
        <ProductGrid products={featuredProducts} loading={loading} error={error} emptyTitle="No featured fabrics yet" emptyMessage="Featured listings will appear here once a storefront adds them." />
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>New arrivals</h2>
          <Link to="/explore?sort=newest">See more</Link>
        </div>
        <ProductGrid products={newArrivals} loading={loading} error={error} emptyTitle="No new arrivals" emptyMessage="New listings will appear here as vendors publish them." />
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Old & rare fabrics</h2>
          <Link to="/explore?condition=old_stock">See more</Link>
        </div>
        <ProductGrid products={rareFinds} loading={loading} error={error} emptyTitle="No vintage or rare fabrics yet" emptyMessage="This collection updates as vendors publish older or pre-loved pieces." />
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Limited stock</h2>
          <Link to="/explore">View stock</Link>
        </div>
        <ProductGrid products={limitedStock} loading={loading} error={error} emptyTitle="No limited stock items" emptyMessage="Inventory will appear here when available." />
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Featured vendors</h2>
        </div>
        {featuredVendors.length ? (
          <div className="vendor-grid">
            {featuredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No vendors available</h3>
            <p>Approved marketplace vendors will appear here once they are published.</p>
          </div>
        )}
      </section>

      <section className="marketplace-section">
        <div className="section-header">
          <h2>Fabrics near you</h2>
        </div>
        <div className="empty-state">
          <h3>Location-aware listings are not yet available</h3>
          <p>Once vendor locations are active and meaningful, nearby fabric collections will appear here without fake distances.</p>
        </div>
      </section>
    </>
  )
}

export { HomePage }
