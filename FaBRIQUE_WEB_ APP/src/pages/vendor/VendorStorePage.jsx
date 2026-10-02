import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getVendorByUserId, updateVendorStore } from '../../services/vendorService.js'

function VendorStorePage() {
  const { user, isSupabaseConfigured } = useAuth()
  const [vendor, setVendor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      store_name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      offers_delivery: true,
    },
  })

  useEffect(() => {
    async function loadVendor() {
      if (!user || !isSupabaseConfigured) {
        return
      }

      const { data } = await getVendorByUserId(user.id)
      setVendor(data)
      if (data) {
        reset({
          store_name: data.store_name || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          offers_delivery: Boolean(data.offers_delivery),
        })
      }
    }

    loadVendor()
  }, [user, isSupabaseConfigured, reset])

  async function onSubmit(formData) {
    if (!vendor) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')
      await updateVendorStore(vendor.id, {
        store_name: formData.store_name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        offers_delivery: formData.offers_delivery,
      })
      setMessage('Store profile updated.')
    } catch (submitError) {
      setError(submitError.message || 'Unable to save your store profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <strong>Supabase is not configured.</strong>
          <p>Store profile editing requires the marketplace backend to be connected.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Store</p>
          <h1>Edit your storefront</h1>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="form-error-block">{error}</div>}

      <form className="vendor-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="vendor-form-grid">
          <label className="form-field">
            <span>Store name</span>
            <input {...register('store_name', { required: true })} />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input type="email" {...register('email')} />
          </label>

          <label className="form-field">
            <span>Phone</span>
            <input {...register('phone')} />
          </label>

          <label className="form-field checkbox-field">
            <input type="checkbox" {...register('offers_delivery')} />
            <span>Offers delivery</span>
          </label>

          <label className="form-field full-width">
            <span>Description</span>
            <textarea rows={5} {...register('description')} />
          </label>

          <label className="form-field">
            <span>Address</span>
            <input {...register('address')} />
          </label>

          <label className="form-field">
            <span>City</span>
            <input {...register('city')} />
          </label>

          <label className="form-field">
            <span>State</span>
            <input {...register('state')} />
          </label>

          <label className="form-field">
            <span>Postal code</span>
            <input {...register('postal_code')} />
          </label>
        </div>

        <div className="vendor-form-actions">
          <button type="submit" className="primary-link" disabled={saving}>
            {saving ? 'Saving…' : 'Save store details'}
          </button>
        </div>
      </form>
    </main>
  )
}

export { VendorStorePage }
