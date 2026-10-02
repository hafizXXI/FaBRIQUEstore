import { Search } from 'lucide-react'

function SearchBar({ value = '', onChange = () => {}, placeholder = 'Search fabrics, colors, vendors...', ariaLabel = 'Search products' }) {
  return (
    <label className="search-bar" aria-label={ariaLabel}>
      <Search size={17} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  )
}

export { SearchBar }
