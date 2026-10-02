import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getCurrentVendor } from '../services/vendorService.js'

function useVendor() {
  const { user, isSupabaseConfigured } = useAuth()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadVendor() {
      if (!user || !isSupabaseConfigured) {
        setVendor(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const { data, error: loadError } = await getCurrentVendor()
        if (loadError) {
          throw loadError
        }
        setVendor(data)
      } catch (loadError) {
        setError(loadError.message || 'Unable to load your vendor profile.')
      } finally {
        setLoading(false)
      }
    }

    loadVendor()
  }, [user, isSupabaseConfigured])

  return { vendor, loading, error, refresh: () => getCurrentVendor() }
}

export { useVendor }
