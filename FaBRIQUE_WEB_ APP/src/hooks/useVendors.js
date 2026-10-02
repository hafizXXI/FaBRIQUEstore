import { useEffect, useState } from 'react'
import { getApprovedVendors } from '../services/vendorService.js'

function useVendors(options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data: vendors, error: loadError } = await getApprovedVendors(options)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setData(vendors)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load vendors.')
          setData([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [JSON.stringify(options)])

  return { data, loading, error }
}

export { useVendors }
