import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <main className="page-shell">
      <div className="content-card narrow-card">
        <p className="eyebrow">Access denied</p>
        <h1>You do not have permission to view this page.</h1>
        <p className="supporting-copy">Use the correct account role or return to your dashboard.</p>
        <div className="auth-links">
          <Link to="/home">Return home</Link>
          <Link to="/account">Your account</Link>
        </div>
      </div>
    </main>
  )
}

export { UnauthorizedPage }
