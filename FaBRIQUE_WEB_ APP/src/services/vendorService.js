import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { getProducts } from './productService.js'

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured in this environment.')
  }
}

async function getVendorApplication(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

async function getApprovedVendors(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  let query = supabase
    .from('vendors')
    .select('*')
    .eq('status', 'approved')

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.searchTerm) {
    const term = options.searchTerm.trim().replace(/'/g, "''")
    if (term) {
      query = query.or(`store_name.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
    }
  }

  query = query.order('store_name', { ascending: true })

  const { data, error } = await query

  if (error) {
    throw error
  }

  return { data: data ?? [], error: null }
}

async function getVendorBySlug(slug) {
  if (!slug || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

async function getVendorProducts(vendorId, options = {}) {
  return getProducts({ ...options, vendorId, sort: options.sort || 'newest' })
}

async function applyVendor(payload) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from('vendors')
    .insert([
      {
        owner_id: payload.userId,
        store_name: payload.storeName,
        slug: payload.storeSlug,
        description: payload.description,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        postal_code: payload.postalCode,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function getVendorByUserId(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

async function getCurrentVendor() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return { data: null, error: null }
  }

  return getVendorByUserId(user.id)
}

async function updateVendorProfile(vendorId, updates) {
  if (!vendorId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function updateVendorStore(vendorId, updates) {
  return updateVendorProfile(vendorId, updates)
}

async function getVendorDashboardStats(vendorId) {
  if (!vendorId || !isSupabaseConfigured || !supabase) {
    return {
      data: {
        todaySales: 0,
        totalSales: 0,
        ordersCount: 0,
        pendingOrders: 0,
        productCount: 0,
        lowStockProducts: 0,
        recentOrders: [],
      },
      error: null,
    }
  }

  const [productCountResult, lowStockResult, orderCountResult, pendingOrderResult, totalSalesResult, todaySalesResult] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).lt('quantity', 5),
    supabase.from('vendor_orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('vendor_orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'new'),
    supabase.from('vendor_orders').select('subtotal').eq('vendor_id', vendorId),
    supabase.from('vendor_orders').select('subtotal, created_at').eq('vendor_id', vendorId).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  const totalSales = totalSalesResult.data?.reduce((sum, row) => sum + Number(row.subtotal ?? 0), 0) ?? 0
  const todaySales = todaySalesResult.data?.reduce((sum, row) => sum + Number(row.subtotal ?? 0), 0) ?? 0

  const { data: recentOrders, error: recentOrdersError } = await supabase
    .from('vendor_orders')
    .select('*, orders(order_number, customer_id, created_at, profiles(full_name))')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentOrdersError) {
    throw recentOrdersError
  }

  return {
    data: {
      todaySales,
      totalSales,
      ordersCount: orderCountResult.count ?? 0,
      pendingOrders: pendingOrderResult.count ?? 0,
      productCount: productCountResult.count ?? 0,
      lowStockProducts: lowStockResult.count ?? 0,
      recentOrders: recentOrders ?? [],
    },
    error: null,
  }
}

export {
  applyVendor,
  getApprovedVendors,
  getCurrentVendor,
  getVendorApplication,
  getVendorBySlug,
  getVendorByUserId,
  getVendorDashboardStats,
  getVendorProducts,
  updateVendorProfile,
  updateVendorStore,
}
