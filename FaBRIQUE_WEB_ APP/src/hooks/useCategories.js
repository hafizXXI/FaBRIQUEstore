import { useEffect, useState } from 'react'
import { getCategories } from '../services/categoryService.js'

function useCategories(options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data: categories, error: loadError } = await getCategories(options)
        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setData(categories)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load categories.')
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

export { useCategories }
