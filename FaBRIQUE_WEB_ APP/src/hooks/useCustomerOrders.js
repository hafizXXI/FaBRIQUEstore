import { useEffect, useState } from 'react'
import { getCustomerOrder, getCustomerOrders } from '../services/orderService.js'

function useCustomerOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }

    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error: loadError } = await getCustomerOrders(userId)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setOrders(data ?? [])
      } catch (loadError) {
        if (isMounted) {
          setOrders([])
          setError(loadError.message || 'Unable to load your orders.')
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

  return { orders, loading, error }
}

function useCustomerOrder(userId, orderId) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(Boolean(userId) && Boolean(orderId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !orderId) {
      setOrder(null)
      setLoading(false)
      return
    }

    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error: loadError } = await getCustomerOrder(userId, orderId)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setOrder(data ?? null)
      } catch (loadError) {
        if (isMounted) {
          setOrder(null)
          setError(loadError.message || 'Unable to load this order.')
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
  }, [orderId, userId])

  return { order, loading, error }
}

export { useCustomerOrder, useCustomerOrders }
