import { useEffect, useState } from 'react'
import { createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../services/customerService.js'

function useAddresses(userId) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setAddresses([])
      setLoading(false)
      return
    }

    let isMounted = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error: loadError } = await getAddresses(userId)

        if (!isMounted) {
          return
        }

        if (loadError) {
          throw loadError
        }

        setAddresses(data ?? [])
      } catch (loadError) {
        if (isMounted) {
          setAddresses([])
          setError(loadError.message || 'Unable to load your addresses.')
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

  async function refresh() {
    if (!userId) {
      setAddresses([])
      return
    }

    const { data, error: loadError } = await getAddresses(userId)
    if (loadError) {
      throw loadError
    }
    setAddresses(data ?? [])
  }

  async function saveAddress(payload) {
    const { data, error: saveError } = await createAddress({ userId, ...payload })
    if (saveError) {
      throw saveError
    }
    await refresh()
    return data
  }

  async function updateSavedAddress(addressId, payload) {
    const { data, error: updateError } = await updateAddress(addressId, payload)
    if (updateError) {
      throw updateError
    }
    await refresh()
    return data
  }

  async function removeAddress(addressId) {
    const { error: removeError } = await deleteAddress(addressId)
    if (removeError) {
      throw removeError
    }
    await refresh()
  }

  async function makeDefault(addressId) {
    const { data, error: defaultError } = await setDefaultAddress({ userId, addressId })
    if (defaultError) {
      throw defaultError
    }
    await refresh()
    return data
  }

  return { addresses, loading, error, refresh, saveAddress, updateSavedAddress, removeAddress, makeDefault }
}

export { useAddresses }
