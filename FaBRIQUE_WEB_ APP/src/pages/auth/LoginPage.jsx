import { ArrowRight, CircleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

function determineRoleRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'vendor':
      return '/vendor'
    case 'rider':
      return '/rider'
    default:
      return '/home'
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isAuthenticated, profile, loading, isSupabaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = new URLSearchParams(location.search).get('redirect') || null

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      const nextPath = redirectPath || determineRoleRoute(profile.role)
      navigate(nextPath, { replace: true })
    }
  }, [loading, isAuthenticated, profile, navigate, redirectPath])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn({ email, password })
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in</h1>
          <p>Continue to your FaBRIQUE account.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="setup-notice auth-notice" role="status">
            <CircleAlert size={18} aria-hidden="true" />
            <div>
              <strong>Authentication is not configured</strong>
              <p>Add your Supabase project URL and anon key to enable real sign in flows.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-link auth-button" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </main>
  )
}

export { LoginPage }
