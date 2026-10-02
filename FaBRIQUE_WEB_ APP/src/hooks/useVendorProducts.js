import { useEffect, useState } from 'react'
import { getVendorProducts } from '../services/productService.js'

function useVendorProducts(vendorId, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      if (!vendorId) {
        setData([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const { data: products, error: loadError } = await getVendorProducts(vendorId, options)
        if (loadError) {
          throw loadError
        }
        setData(products ?? [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load vendor products.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [vendorId, options])

  return { data, loading, error }
}

export { useVendorProducts }
