import { useCallback, useEffect, useState } from 'react'
import { addToCart, clearCart, getCart, removeCartItem, updateCartItemQuantity } from '../services/cartService.js'

function useCart(userId) {
  const [cart, setCart] = useState(null)
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ subtotal: 0, itemCount: 0, vendorCount: 0 })
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) {
      setCart(null)
      setItems([])
      setSummary({ subtotal: 0, itemCount: 0, vendorCount: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } = await getCart(userId)

      if (loadError) {
        throw loadError
      }

      setCart(data?.cart ?? null)
      setItems(data?.items ?? [])
      setSummary(data?.summary ?? { subtotal: 0, itemCount: 0, vendorCount: 0 })
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your cart.')
      setCart(null)
      setItems([])
      setSummary({ subtotal: 0, itemCount: 0, vendorCount: 0 })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAddToCart = useCallback(async ({ productId, quantity = 1 }) => {
    if (!userId) {
      throw new Error('Please sign in to continue.')
    }

    const { error: addError } = await addToCart({ userId, productId, quantity })

    if (addError) {
      throw addError
    }

    await refresh()
  }, [refresh, userId])

  const handleUpdateQuantity = useCallback(async ({ itemId, quantity }) => {
    if (!userId) {
      throw new Error('Please sign in to continue.')
    }

    const { error: updateError } = await updateCartItemQuantity({ userId, itemId, quantity })

    if (updateError) {
      throw updateError
    }

    await refresh()
  }, [refresh, userId])

  const handleRemoveItem = useCallback(async (itemId) => {
    if (!userId) {
      throw new Error('Please sign in to continue.')
    }

    const { error: removeError } = await removeCartItem({ userId, itemId })

    if (removeError) {
      throw removeError
    }

    await refresh()
  }, [refresh, userId])

  const handleClearCart = useCallback(async () => {
    if (!userId) {
      throw new Error('Please sign in to continue.')
    }

    const { error: clearError } = await clearCart(userId)

    if (clearError) {
      throw clearError
    }

    await refresh()
  }, [refresh, userId])

  return {
    cart,
    items,
    summary,
    loading,
    error,
    refresh,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    clearCart: handleClearCart,
  }
}

export { useCart }
