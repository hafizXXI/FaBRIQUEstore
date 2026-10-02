import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured in this environment.')
  }
}

function normalizeCartProduct(product) {
  if (!product) {
    return null
  }

  const imageList = Array.isArray(product.product_images) ? product.product_images : []
  const primaryImage = imageList.find((image) => image.is_primary) || imageList[0] || null

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    unit: product.unit || 'yard',
    price: Number(product.price ?? 0),
    quantity: Number(product.quantity ?? 0),
    status: product.status,
    imageUrl: primaryImage ? product.product_images?.[0]?.storage_path : null,
    vendor: product.vendors ? {
      id: product.vendors.id,
      storeName: product.vendors.store_name,
      status: product.vendors.status,
    } : null,
  }
}

async function getOrCreateCart(userId) {
  assertSupabaseConfigured()

  if (!userId) {
    return { data: null, error: null }
  }

  const { data: existingCart, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (cartError && cartError.code !== 'PGRST116') {
    throw cartError
  }

  if (existingCart) {
    return { data: existingCart, error: null }
  }

  const { data: newCart, error: insertError } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select()
    .single()

  if (insertError) {
    throw insertError
  }

  return { data: newCart, error: null }
}

async function getCart(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: { cart: null, items: [], summary: { subtotal: 0, itemCount: 0, vendorCount: 0 } }, error: null }
  }

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (cartError && cartError.code !== 'PGRST116') {
    throw cartError
  }

  if (!cart) {
    return { data: { cart: null, items: [], summary: { subtotal: 0, itemCount: 0, vendorCount: 0 } }, error: null }
  }

  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select('*, products(*, vendors(*), product_images(*))')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: false })

  if (itemsError) {
    throw itemsError
  }

  const normalizedItems = (items ?? []).map((row) => {
    const product = row.products
    const productMeta = normalizeCartProduct(product)

    return {
      id: row.id,
      cartId: row.cart_id,
      productId: row.product_id,
      quantity: Number(row.quantity ?? 0),
      variantId: row.variant_id,
      createdAt: row.created_at,
      product: productMeta,
      lineTotal: productMeta ? productMeta.price * Number(row.quantity ?? 0) : 0,
    }
  })

  const summary = normalizedItems.reduce((totals, item) => {
    if (!item.product) {
      return totals
    }

    const nextSubtotal = totals.subtotal + item.lineTotal
    const nextItemCount = totals.itemCount + item.quantity
    const vendorKey = item.product.vendor?.id || 'unassigned'

    return {
      subtotal: nextSubtotal,
      itemCount: nextItemCount,
      vendorCount: totals.vendorCount + (totals.vendorIds.includes(vendorKey) ? 0 : 1),
      vendorIds: [...totals.vendorIds, vendorKey],
    }
  }, { subtotal: 0, itemCount: 0, vendorCount: 0, vendorIds: [] })

  return {
    data: {
      cart,
      items: normalizedItems,
      summary: {
        subtotal: summary.subtotal,
        itemCount: summary.itemCount,
        vendorCount: summary.vendorCount,
      },
    },
    error: null,
  }
}

async function getCartSummary(userId) {
  const { data } = await getCart(userId)
  return { data: data?.summary ?? { subtotal: 0, itemCount: 0, vendorCount: 0 }, error: null }
}

async function getCartItems(userId) {
  const { data } = await getCart(userId)
  return { data: data?.items ?? [], error: null }
}

async function addToCart({ userId, productId, quantity = 1, variantId = null }) {
  assertSupabaseConfigured()

  if (!userId || !productId) {
    return { data: null, error: null }
  }

  const requestedQuantity = Number(quantity ?? 1)
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    throw new Error('Please enter a valid quantity.')
  }

  const { data: cart } = await getOrCreateCart(userId)
  if (!cart) {
    throw new Error('Unable to create your cart.')
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, vendors(*), product_images(*)')
    .eq('id', productId)
    .maybeSingle()

  if (productError) {
    throw productError
  }

  if (!product) {
    throw new Error('This fabric is no longer available.')
  }

  if (product.status !== 'published') {
    throw new Error('This fabric cannot be added to the cart right now.')
  }

  if (product.vendors?.status !== 'approved') {
    throw new Error('This vendor is not currently approved to sell on FaBRIQUE.')
  }

  if (Number(product.quantity ?? 0) <= 0) {
    throw new Error('This fabric is currently out of stock.')
  }

  const { data: existingItem, error: existingError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError
  }

  const nextQuantity = Number(existingItem?.quantity ?? 0) + requestedQuantity

  if (nextQuantity > Number(product.quantity ?? 0)) {
    throw new Error(`Only ${Number(product.quantity ?? 0)} units are available for this fabric.`)
  }

  if (existingItem) {
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq('id', existingItem.id)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    return { data: updatedItem, error: null }
  }

  const { data: insertedItem, error: insertError } = await supabase
    .from('cart_items')
    .insert({ cart_id: cart.id, product_id: productId, variant_id: variantId, quantity: requestedQuantity })
    .select('*')
    .single()

  if (insertError) {
    throw insertError
  }

  return { data: insertedItem, error: null }
}

async function updateCartItemQuantity({ userId, itemId, quantity }) {
  assertSupabaseConfigured()

  if (!userId || !itemId) {
    return { data: null, error: null }
  }

  const nextQuantity = Number(quantity)
  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    throw new Error('Quantity must be greater than zero.')
  }

  const { data: cart } = await getOrCreateCart(userId)
  if (!cart) {
    throw new Error('Unable to load your cart.')
  }

  const { data: existingItem, error: itemError } = await supabase
    .from('cart_items')
    .select('*, products(quantity, status, vendors(status))')
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .maybeSingle()

  if (itemError && itemError.code !== 'PGRST116') {
    throw itemError
  }

  if (!existingItem) {
    throw new Error('This item is no longer in your cart.')
  }

  const availableQuantity = Number(existingItem.products?.quantity ?? 0)
  if (nextQuantity > availableQuantity) {
    throw new Error(`Only ${availableQuantity} units are available for this fabric.`)
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select('*')
    .single()

  if (updateError) {
    throw updateError
  }

  return { data: updatedItem, error: null }
}

async function removeCartItem({ userId, itemId }) {
  assertSupabaseConfigured()

  if (!userId || !itemId) {
    return { data: null, error: null }
  }

  const { data: cart } = await getOrCreateCart(userId)
  if (!cart) {
    return { data: null, error: null }
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cart.id)

  if (error) {
    throw error
  }

  return { data: true, error: null }
}

async function clearCart(userId) {
  assertSupabaseConfigured()

  if (!userId) {
    return { data: false, error: null }
  }

  const { data: cart } = await getOrCreateCart(userId)
  if (!cart) {
    return { data: false, error: null }
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id)

  if (error) {
    throw error
  }

  return { data: true, error: null }
}

export {
  addToCart,
  clearCart,
  getCart,
  getCartItems,
  getCartSummary,
  getOrCreateCart,
  removeCartItem,
  updateCartItemQuantity,
}
