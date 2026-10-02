import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { updateProfile } from '../../services/customerService.js'

function AccountPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      await updateProfile(user.id, { fullName, phone, avatarUrl: profile?.avatar_url ?? null })
      await refreshProfile(user)
      setSuccess('Your profile has been updated.')
    } catch (submitError) {
      setError(submitError.message || 'Unable to update your profile right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page-shell">
      <div className="content-card">
        <p className="eyebrow">Your account</p>
        <h1>Account settings</h1>

        <div className="account-summary">
          <div>
            <strong>Role</strong>
            <span>{profile?.role ?? 'customer'}</span>
          </div>
          <div>
            <strong>Email</strong>
            <span>{user?.email ?? 'Not available'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-field">
            <span>Full name</span>
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>

          <label className="form-field">
            <span>Phone</span>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="primary-link auth-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </main>
  )
}

export { AccountPage }
