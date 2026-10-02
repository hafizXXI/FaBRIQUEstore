import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

function formatCondition(value) {
  if (!value) {
    return 'Fabric'
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatCurrency(value) {
  const numericValue = Number(value ?? 0)
  return `₦${numericValue.toLocaleString('en-NG')}`
}

function ProductCard({ product, isSaved = false, onToggleWishlist }) {
  if (!product) {
    return null
  }

  const vendorName = product.vendor?.storeName || 'FaBRIQUE fabric seller'
  const availability = product.quantity > 0 ? (product.quantity <= 8 ? 'Limited Stock' : 'In Stock') : 'Sold out'

  return (
    <article className="product-card" aria-label={product.name}>
      <Link className="product-card-media" to={`/products/${product.slug}`} aria-label={`Open ${product.name}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-card-fallback" aria-label="No product image available">
            FaBRIQUE
          </div>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-topline">
          <span className="product-condition">{formatCondition(product.condition)}</span>
          <button
            type="button"
            className={`wishlist-button ${isSaved ? 'active' : ''}`}
            aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onToggleWishlist?.(product)
            }}
          >
            <Heart size={16} aria-hidden="true" />
          </button>
        </div>

        <Link className="product-card-title" to={`/products/${product.slug}`}>
          {product.name}
        </Link>

        <p className="product-card-vendor">{vendorName}</p>

        <div className="product-card-price-row">
          <strong>{formatCurrency(product.price)}</strong>
          <span>/ {product.unit || 'yard'}</span>
        </div>

        <div className="product-card-meta-row">
          <span>{product.category?.name || 'Fabric'}</span>
          <span className={`stock-pill ${product.quantity > 0 ? 'in-stock' : 'out'}`}>
            {availability}
          </span>
        </div>

        <div className="product-card-footer">
          <button type="button" className="secondary-action" disabled>
            <ShoppingBag size={15} aria-hidden="true" />
            View details
          </button>
        </div>
      </div>
    </article>
  )
}

export { ProductCard }
