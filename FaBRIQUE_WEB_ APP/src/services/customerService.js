import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { normalizeProduct } from './productService.js'

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured in this environment.')
  }
}

async function getProfile(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function updateProfile(userId, updates) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      phone: updates.phone,
      avatar_url: updates.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function getWishlistForUser(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (wishlistError && wishlistError.code !== 'PGRST116') {
    throw wishlistError
  }

  if (!wishlist) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id, products(*, categories(*), vendors(*), product_images(*))')
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return {
    data: (data ?? [])
      .map((entry) => entry?.products)
      .filter(Boolean)
      .filter((product) => product?.vendors?.status === 'approved')
      .map(normalizeProduct),
    error: null,
  }
}

async function getWishlistProductIds(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data) {
    return { data: [], error: null }
  }

  const { data: items, error: itemError } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('wishlist_id', data.id)

  if (itemError) {
    throw itemError
  }

  return {
    data: (items ?? []).map((item) => item.product_id),
    error: null,
  }
}

async function getAddresses(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return { data: data ?? [], error: null }
}

async function createAddress({ userId, label, recipient_name, phone, address, city, state, postal_code, latitude = null, longitude = null, instructions = null, is_default = false }) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const payload = {
    user_id: userId,
    label,
    recipient_name,
    phone,
    address,
    city,
    state,
    postal_code,
    latitude,
    longitude,
    instructions,
    is_default,
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function updateAddress(addressId, updates) {
  if (!addressId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('addresses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addressId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function deleteAddress(addressId) {
  if (!addressId || !isSupabaseConfigured || !supabase) {
    return { error: null }
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)

  if (error) {
    throw error
  }

  return { error: null }
}

async function setDefaultAddress({ userId, addressId }) {
  if (!userId || !addressId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { error: clearError } = await supabase
    .from('addresses')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (clearError) {
    throw clearError
  }

  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function toggleWishlist({ userId, productId }) {
  if (!userId || !productId || !isSupabaseConfigured || !supabase) {
    return { added: false, error: null }
  }

  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (wishlistError && wishlistError.code !== 'PGRST116') {
    throw wishlistError
  }

  let activeWishlist = wishlist

  if (!activeWishlist) {
    const { data: createdWishlist, error: createError } = await supabase
      .from('wishlists')
      .insert({ user_id: userId })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    activeWishlist = createdWishlist
  }

  const { data: existingItem, error: existingError } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', activeWishlist.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError
  }

  if (existingItem) {
    const { error: removeError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', existingItem.id)

    if (removeError) {
      throw removeError
    }

    return { added: false, error: null }
  }

  const { error: addError } = await supabase
    .from('wishlist_items')
    .insert({ wishlist_id: activeWishlist.id, product_id: productId })

  if (addError) {
    throw addError
  }

  return { added: true, error: null }
}

export {
  createAddress,
  deleteAddress,
  getAddresses,
  getProfile,
  getWishlistForUser,
  getWishlistProductIds,
  setDefaultAddress,
  toggleWishlist,
  updateAddress,
  updateProfile,
}
