import { ProductCard } from './ProductCard.jsx'
import { LoadingState } from './LoadingState.jsx'
import { EmptyState } from './EmptyState.jsx'
import { ErrorState } from './ErrorState.jsx'

function ProductGrid({ products, loading, error, isSaved, onToggleWishlist, emptyTitle = 'No fabrics found', emptyMessage = 'Try adjusting your search or filters.' }) {
  if (loading) {
    return <LoadingState message="Loading fabrics…" />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  if (!products || !products.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSaved={Boolean(isSaved && isSaved[product.id])}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  )
}

export { ProductGrid }
