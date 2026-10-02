import { Heart } from 'lucide-react'

function WishlistButton({ isSaved, onToggle, productName }) {
  return (
    <button
      type="button"
      className={`wishlist-button ${isSaved ? 'active' : ''}`}
      onClick={onToggle}
      aria-label={isSaved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
    >
      <Heart size={16} aria-hidden="true" />
    </button>
  )
}

export { WishlistButton }
