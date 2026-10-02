import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Heart, House, Package, Search, ShoppingBag, UserRound } from 'lucide-react'
import fabriqueLogo from '../assets/fabrique-logo.svg'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getCartSummary } from '../services/cartService.js'
import '../styles/shell.css'

const customerLinks = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Search },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/wishlist', label: 'Saved', icon: Heart },
  { to: '/account', label: 'Account', icon: UserRound },
]

function MarketplaceLayout() {
  const { user, isAuthenticated } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCartCount(0)
      return
    }

    let isMounted = true

    async function loadCartCount() {
      try {
        const { data } = await getCartSummary(user.id)
        if (!isMounted) {
          return
        }
        setCartCount(data?.itemCount ?? 0)
      } catch (error) {
        if (isMounted) {
          setCartCount(0)
        }
      }
    }

    loadCartCount()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user?.id])

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand-wrap" to="/" aria-label="FaBRIQUE home">
            <img className="brand-logo" src={fabriqueLogo} alt="FaBRIQUE logo" />
          </NavLink>
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/explore">Explore</NavLink>
            <NavLink to="/orders">Orders</NavLink>
          </nav>
          <div className="header-actions">
            <NavLink to="/cart" aria-label="Shopping bag" className="cart-link-wrap">
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Bag</span>
              {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
            </NavLink>
            <NavLink className="sign-in" to="/login">Sign in</NavLink>
          </div>
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <NavLink className="brand-wrap footer-brand" to="/">
            <img className="brand-logo" src={fabriqueLogo} alt="FaBRIQUE logo" />
          </NavLink>
          <p>Your fabrics, delivered.</p>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Customer navigation">
        {customerLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export { MarketplaceLayout }