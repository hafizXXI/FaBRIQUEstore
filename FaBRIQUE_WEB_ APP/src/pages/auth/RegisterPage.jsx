import { ArrowRight, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

function RegisterPage() {
  const { signUp, isSupabaseConfigured } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      })

      setSuccess('Your account has been created. If Supabase email verification is enabled, check your inbox to confirm it.')
      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      })
    } catch (submitError) {
      setError(submitError.message || 'Unable to create your account right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Create your account</p>
          <h1>Register</h1>
          <p>Join FaBRIQUE as a customer today.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="setup-notice auth-notice" role="status">
            <CircleAlert size={18} aria-hidden="true" />
            <div>
              <strong>Authentication is not live yet</strong>
              <p>Supabase credentials are required before account creation can be verified in a browser.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>Full name</span>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              required
              disabled={isSubmitting || !isSupabaseConfigured}
            />
          </label>

          <div className="two-column-fields">
            <label className="form-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={isSubmitting || !isSupabaseConfigured}
              />
            </label>

            <label className="form-field">
              <span>Phone</span>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                disabled={isSubmitting || !isSupabaseConfigured}
              />
            </label>
          </div>

          <div className="two-column-fields">
            <label className="form-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={isSubmitting || !isSupabaseConfigured}
              />
            </label>

            <label className="form-field">
              <span>Confirm password</span>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={isSubmitting || !isSupabaseConfigured}
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="primary-link auth-button" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="auth-links">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </main>
  )
}

export { RegisterPage }
