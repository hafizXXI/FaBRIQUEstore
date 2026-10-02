import { useEffect, useState } from 'react'
import { getProducts, searchProducts } from '../services/productService.js'

function useProducts(options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const service = options.searchTerm ? searchProducts : getProducts
        const { data: products, error: loadError } = await service(options)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setData(products)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load products.')
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

export { useProducts }
