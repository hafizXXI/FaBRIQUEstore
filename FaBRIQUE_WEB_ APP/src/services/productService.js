import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { getCategoryBySlug } from './categoryService.js'

function getPublicStorageUrl(bucketName, pathValue) {
  if (!bucketName || !pathValue || !supabase) {
    return null
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(pathValue)
  return data?.publicUrl ?? null
}

function normalizeProduct(record) {
  if (!record) {
    return null
  }

  const images = Array.isArray(record.product_images) ? record.product_images : []
  const primaryImage = images.find((image) => image.is_primary) || images[0] || null
  const vendor = record.vendors ?? record.vendor ?? null
  const category = record.categories ?? record.category ?? null

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    price: Number(record.price ?? 0),
    quantity: Number(record.quantity ?? 0),
    unit: record.unit ?? 'yard',
    color: record.color,
    pattern: record.pattern,
    condition: record.condition,
    status: record.status,
    location: record.location,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    imageUrl: primaryImage ? getPublicStorageUrl('product-images', primaryImage.storage_path) : null,
    images: images.map((image) => ({
      ...image,
      url: getPublicStorageUrl('product-images', image.storage_path),
    })),
    vendor: vendor
      ? {
          id: vendor.id,
          storeName: vendor.store_name ?? vendor.storeName,
          slug: vendor.slug,
          city: vendor.city,
          state: vendor.state,
          status: vendor.status,
          logoUrl: vendor.logo_url ?? vendor.logoUrl,
        }
      : null,
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
        }
      : null,
  }
}

async function getProducts(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  let categoryId = options.categoryId ?? null

  if (!categoryId && options.categorySlug) {
    const { getCategoryBySlug } = await import('./categoryService.js')
    const { data: category } = await getCategoryBySlug(options.categorySlug)
    categoryId = category?.id ?? null
  }

  let query = supabase
    .from('products')
    .select('*, categories(*), vendors(*), product_images(*)')
    .eq('status', 'published')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (options.vendorId) {
    query = query.eq('vendor_id', options.vendorId)
  }

  if (options.condition) {
    const conditions = Array.isArray(options.condition) ? options.condition : [options.condition]
    query = query.in('condition', conditions)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.searchTerm) {
    const cleanedTerm = options.searchTerm.trim().replace(/'/g, "''")
    if (cleanedTerm) {
      query = query.or(
        `name.ilike.%${cleanedTerm}%,description.ilike.%${cleanedTerm}%,color.ilike.%${cleanedTerm}%,pattern.ilike.%${cleanedTerm}%`
      )
    }
  }

  if (options.minPrice !== undefined) {
    query = query.gte('price', Number(options.minPrice))
  }

  if (options.maxPrice !== undefined) {
    query = query.lte('price', Number(options.maxPrice))
  }

  if (options.sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (options.sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (options.sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return {
    data: (data ?? []).filter((record) => record?.vendors?.status === 'approved').map(normalizeProduct),
    error: null,
  }
}

async function getProductBySlug(slug) {
  if (!slug || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), vendors(*), product_images(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data || data?.vendors?.status !== 'approved') {
    return { data: null, error: null }
  }

  return { data: normalizeProduct(data), error: null }
}

async function searchProducts(options = {}) {
  return getProducts(options)
}

async function getProductsByCategory(categorySlug, options = {}) {
  if (!categorySlug) {
    return { data: [], error: null }
  }

  const { data: category } = await getCategoryBySlug(categorySlug)

  if (!category) {
    return { data: [], error: null }
  }

  return getProducts({ ...options, categoryId: category.id })
}

async function getFeaturedProducts(limit = 6) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('featured_products')
    .select('sort_order, products(*, categories(*), vendors(*), product_images(*))')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(limit)

  if (error) {
    throw error
  }

  const products = (data ?? [])
    .map((entry) => entry?.products)
    .filter(Boolean)
    .filter((product) => product?.vendors?.status === 'approved' && product?.status === 'published')

  return { data: products.map(normalizeProduct), error: null }
}

async function getNewArrivals(limit = 6) {
  return getProducts({ limit, sort: 'newest' })
}

async function getLimitedStockProducts(limit = 6) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), vendors(*), product_images(*)')
    .eq('status', 'published')
    .gt('quantity', 0)
    .lt('quantity', 11)
    .order('quantity', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return {
    data: (data ?? []).filter((record) => record?.vendors?.status === 'approved').map(normalizeProduct),
    error: null,
  }
}

async function getProductsByCondition(conditions, limit = 6) {
  if (!conditions || !conditions.length) {
    return { data: [], error: null }
  }

  return getProducts({ condition: conditions, limit, sort: 'newest' })
}

async function getVendorProducts(vendorId, options = {}) {
  if (!vendorId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  let query = supabase
    .from('products')
    .select('*, categories(*), product_images(*)')
    .eq('vendor_id', vendorId)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.searchTerm) {
    const term = options.searchTerm.trim().replace(/'/g, "''")
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    }
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  // Only order the list intentionally, with newest first by default.
  const direction = options.sort === 'oldest' ? { ascending: true } : { ascending: false }
  query = query.order('updated_at', direction)

  const { data, error } = await query

  if (error) {
    throw error
  }

  return { data: (data ?? []).map(normalizeProduct), error: null }
}

async function getVendorProductById(productId) {
  if (!productId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), product_images(*)')
    .eq('id', productId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data) {
    return { data: null, error: null }
  }

  return { data: normalizeProduct(data), error: null }
}

async function createProduct(payload) {
  if (!payload || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        vendor_id: payload.vendorId,
        category_id: payload.categoryId,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        price: Number(payload.price),
        quantity: Number(payload.quantity ?? 0),
        unit: payload.unit || 'yard',
        color: payload.color || null,
        pattern: payload.pattern || null,
        condition: payload.condition || 'new',
        status: payload.status || 'draft',
        location: payload.location || null,
      },
    ])
    .select('*, categories(*), product_images(*)')
    .single()

  if (error) {
    throw error
  }

  return { data: normalizeProduct(data), error: null }
}

async function updateProduct(productId, payload) {
  if (!productId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const nextPayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  if (payload.price !== undefined) {
    nextPayload.price = Number(payload.price)
  }

  if (payload.quantity !== undefined) {
    nextPayload.quantity = Number(payload.quantity)
  }

  const { data, error } = await supabase
    .from('products')
    .update(nextPayload)
    .eq('id', productId)
    .select('*, categories(*), product_images(*)')
    .single()

  if (error) {
    throw error
  }

  return { data: normalizeProduct(data), error: null }
}

async function updateProductStatus(productId, status) {
  return updateProduct(productId, { status })
}

async function updateInventory(productId, quantity) {
  return updateProduct(productId, { quantity: Number(quantity) })
}

async function publishProduct(productId) {
  return updateProductStatus(productId, 'published')
}

async function deleteProduct(productId) {
  if (!productId || !isSupabaseConfigured || !supabase) {
    return { error: null }
  }

  const { data: orderItems, error: countError } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (countError) {
    throw countError
  }

  if ((orderItems?.length ?? 0) > 0 || (orderItems?.count ?? 0) > 0) {
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  }

  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) {
    throw error
  }

  return { data: true, error: null }
}

export {
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getLimitedStockProducts,
  getNewArrivals,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getProductsByCondition,
  getPublicStorageUrl,
  getVendorProductById,
  getVendorProducts,
  normalizeProduct,
  publishProduct,
  searchProducts,
  updateInventory,
  updateProduct,
  updateProductStatus,
}
