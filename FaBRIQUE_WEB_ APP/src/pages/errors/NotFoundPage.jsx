import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="content-card narrow-card">
        <p className="eyebrow">Page not found</p>
        <h1>We could not find that page.</h1>
        <p className="supporting-copy">The route may not exist yet, or it may have moved.</p>
        <div className="auth-links">
          <Link to="/">Return home</Link>
          <Link to="/explore">Explore</Link>
        </div>
      </div>
    </main>
  )
}

export { NotFoundPage }
