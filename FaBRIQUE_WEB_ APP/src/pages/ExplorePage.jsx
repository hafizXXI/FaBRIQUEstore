import { useEffect, useMemo, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { SearchBar } from '../components/SearchBar.jsx'
import { useCategories } from '../hooks/useCategories.js'
import { useProducts } from '../hooks/useProducts.js'
import { getApprovedVendors } from '../services/vendorService.js'

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [vendors, setVendors] = useState([])
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  const { data: categories, loading: categoriesLoading } = useCategories()

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    color: searchParams.get('color') || '',
    pattern: searchParams.get('pattern') || '',
    vendor: searchParams.get('vendor') || '',
    maxPrice: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
  }), [searchParams])

  useEffect(() => {
    async function loadVendors() {
      try {
        const { data } = await getApprovedVendors()
        setVendors(data ?? [])
      } catch (error) {
        setVendors([])
      }
    }

    loadVendors()
  }, [])

  const queryOptions = useMemo(() => ({
    searchTerm: filters.q,
    categorySlug: filters.category || undefined,
    condition: filters.condition || undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    sort: filters.sort === 'price_asc' ? 'price_asc' : filters.sort === 'price_desc' ? 'price_desc' : 'newest',
  }), [filters])

  const { data: products, loading, error } = useProducts(queryOptions)

  function updateUrl(nextState) {
    const params = new URLSearchParams(searchParams)

    Object.entries(nextState).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    setSearchParams(params)
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
    updateUrl({ q: value })
  }

  function resetFilters() {
    setSearchTerm('')
    setSearchParams({})
  }

  const activeCategory = categories.find((category) => category.slug === filters.category)

  return (
    <main className="page-shell explore-shell">
      <div className="explore-header">
        <div>
          <p className="eyebrow">FaBRIQUE marketplace</p>
          <h1>Explore fabrics</h1>
        </div>
        <button type="button" className="filter-toggle" onClick={() => setShowFilters((value) => !value)}>
          <Filter size={16} aria-hidden="true" />
          Filters
        </button>
      </div>

      <div className="search-panel">
        <SearchBar value={searchTerm} onChange={handleSearchChange} />
      </div>

      <div className="explore-layout">
        <aside className={`filter-panel ${showFilters ? 'open' : ''}`}>
          <div className="filter-panel-header">
            <h2>Filters</h2>
            <button type="button" className="mini-icon-button" onClick={resetFilters} aria-label="Reset all filters">
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select id="category-filter" value={filters.category} onChange={(event) => updateUrl({ category: event.target.value })}>
              <option value="">All categories</option>
              {!categoriesLoading && categories.map((category) => (
                <option key={category.id} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="condition-filter">Condition</label>
            <select id="condition-filter" value={filters.condition} onChange={(event) => updateUrl({ condition: event.target.value })}>
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="old_stock">Old Stock</option>
              <option value="vintage">Vintage</option>
              <option value="pre_owned">Pre-owned</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="price-filter">Maximum price</label>
            <select id="price-filter" value={filters.maxPrice} onChange={(event) => updateUrl({ max_price: event.target.value })}>
              <option value="">Any price</option>
              <option value="30000">₦30,000</option>
              <option value="50000">₦50,000</option>
              <option value="100000">₦100,000</option>
              <option value="200000">₦200,000</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="vendor-filter">Vendor</label>
            <select id="vendor-filter" value={filters.vendor} onChange={(event) => updateUrl({ vendor: event.target.value })}>
              <option value="">All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.slug}>{vendor.store_name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort</label>
            <select id="sort-filter" value={filters.sort} onChange={(event) => updateUrl({ sort: event.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        <section className="explore-results">
          <div className="results-summary">
            {activeCategory ? <span>{activeCategory.name}</span> : <span>All fabrics</span>}
            <strong>{products.length} result{products.length === 1 ? '' : 's'}</strong>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            emptyTitle="No fabrics found"
            emptyMessage="Try adjusting your search or filters."
          />
        </section>
      </div>
    </main>
  )
}

export { ExplorePage }
