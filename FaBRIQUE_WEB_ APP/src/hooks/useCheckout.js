import { useState } from 'react'
import { createOrderFromCart } from '../services/orderService.js'

function useCheckout() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitOrder({ userId, addressId, deliveryInstructions }) {
    if (!userId || !addressId) {
      throw new Error('Please choose a delivery address before continuing.')
    }

    setSubmitting(true)
    setError('')

    try {
      const { data, error: submitError } = await createOrderFromCart({ userId, addressId, deliveryInstructions })
      if (submitError) {
        throw submitError
      }
      return data
    } catch (submitError) {
      setError(submitError.message || 'Order could not be created.')
      throw submitError
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, submitOrder }
}

export { useCheckout }
