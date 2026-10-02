import { ArrowRight, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, isSupabaseConfigured } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword(password)
      setSuccess('Your password has been updated. Redirecting to sign in…')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (submitError) {
      setError(submitError.message || 'Unable to update your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Update password</p>
          <h1>Choose a new password</h1>
          <p>Use a secure password you have not used before.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="setup-notice auth-notice" role="status">
            <CircleAlert size={18} aria-hidden="true" />
            <div>
              <strong>Live password updates are unavailable</strong>
              <p>Supabase credentials are required before password reset flows can be tested.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          <label className="form-field">
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="primary-link auth-button" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
            {isSubmitting ? 'Updating…' : 'Update password'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </div>
    </main>
  )
}

export { ResetPasswordPage }
