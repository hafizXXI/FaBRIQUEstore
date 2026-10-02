import { ArrowRight, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

function ForgotPasswordPage() {
  const { resetPassword, isSupabaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      await resetPassword({ email })
      setSuccess('If an account exists for this email, a password reset link has been sent.')
      setEmail('')
    } catch (submitError) {
      setError(submitError.message || 'Unable to send the password reset email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Need help?</p>
          <h1>Reset password</h1>
          <p>We will send a secure reset link to your email.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="setup-notice auth-notice" role="status">
            <CircleAlert size={18} aria-hidden="true" />
            <div>
              <strong>Password reset is unavailable</strong>
              <p>Supabase credentials are required before reset links can be sent.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="primary-link auth-button" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </main>
  )
}

export { ForgotPasswordPage }
