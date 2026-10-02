import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function CategoryCard({ category }) {
  if (!category) {
    return null
  }

  return (
    <Link className="category-card" to={`/explore?category=${encodeURIComponent(category.slug)}`}>
      <div className="category-card-art" aria-hidden="true" />
      <div className="category-card-copy">
        <span>{category.name}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </Link>
  )
}

export { CategoryCard }
