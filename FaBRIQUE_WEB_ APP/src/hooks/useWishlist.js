import { useEffect, useState } from 'react'
import { getWishlistForUser } from '../services/customerService.js'

function useWishlist(userId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data: wishlist, error: loadError } = await getWishlistForUser(userId)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setData(wishlist)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load wishlist.')
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
  }, [userId])

  return { data, loading, error }
}

export { useWishlist }
