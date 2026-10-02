import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

async function getVendorOrders(vendorId) {
  if (!vendorId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*, orders(order_number, status, subtotal, customer_id, profiles(full_name)), vendor_order_items(*, products(name))')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return { data: data ?? [], error: null }
}

async function getVendorOrder(vendorOrderId) {
  if (!vendorOrderId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*, orders(*, profiles(full_name)), vendor_order_items(*, products(*))')
    .eq('id', vendorOrderId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

async function getOrderStatusHistory(orderId, type = 'order') {
  if (!orderId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const tableName = type === 'vendor' ? 'vendor_order_status_history' : 'order_status_history'
  const filterKey = type === 'vendor' ? 'vendor_order_id' : 'order_id'

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq(filterKey, orderId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return { data: data ?? [], error: null }
}

async function updateVendorOrderStatus({ vendorOrderId, nextStatus, changedBy }) {
  if (!vendorOrderId || !nextStatus || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data: currentOrder, error: loadError } = await supabase
    .from('vendor_orders')
    .select('status, id, vendor_id')
    .eq('id', vendorOrderId)
    .maybeSingle()

  if (loadError) {
    throw loadError
  }

  if (!currentOrder) {
    return { data: null, error: null }
  }

  const allowedTransitions = {
    new: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
    ready_for_pickup: ['picked_up'],
    picked_up: ['completed'],
    completed: [],
    rejected: [],
    cancelled: [],
  }

  if (!allowedTransitions[currentOrder.status]?.includes(nextStatus)) {
    throw new Error('This order status transition is not allowed.')
  }

  const { data, error } = await supabase
    .from('vendor_orders')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', vendorOrderId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const { error: historyError } = await supabase
    .from('vendor_order_status_history')
    .insert([
      {
        vendor_order_id: vendorOrderId,
        old_status: currentOrder.status,
        new_status: nextStatus,
        changed_by: changedBy || null,
        note: `Vendor update from ${currentOrder.status} to ${nextStatus}`,
      },
    ])

  if (historyError) {
    throw historyError
  }

  return { data, error: null }
}

async function getVendorEarnings(vendorId) {
  if (!vendorId || !isSupabaseConfigured || !supabase) {
    return {
      data: {
        totalSales: 0,
        pendingPayout: 0,
        netEarnings: 0,
        payouts: [],
        commissions: [],
      },
      error: null,
    }
  }

  const [commissionsResult, payoutsResult] = await Promise.all([
    supabase.from('commissions').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }),
    supabase.from('vendor_payouts').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }),
  ])

  if (commissionsResult.error) {
    throw commissionsResult.error
  }

  if (payoutsResult.error) {
    throw payoutsResult.error
  }

  const totalSales = (commissionsResult.data ?? []).reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0)
  const pendingPayout = (payoutsResult.data ?? []).filter((item) => item.status === 'pending').reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const netEarnings = totalSales - (commissionsResult.data ?? []).reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0)

  return {
    data: {
      totalSales,
      pendingPayout,
      netEarnings,
      payouts: payoutsResult.data ?? [],
      commissions: commissionsResult.data ?? [],
    },
    error: null,
  }
}

async function createOrderFromCart({ userId, addressId, deliveryInstructions = '' }) {
  if (!userId || !addressId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  try {
    const { data, error } = await supabase.rpc('create_customer_order', {
      p_address_id: addressId,
      p_delivery_instructions: deliveryInstructions || null,
    })

    if (error) {
      throw error
    }

    return { data: data ?? null, error: null }
  } catch (rpcError) {
    return { data: null, error: rpcError }
  }
}

async function getCustomerOrders(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(*)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const normalized = (data ?? []).map((order) => {
    const items = order.order_items ?? []
    const vendorSet = new Set(items.map((item) => item.vendor_id).filter(Boolean))

    return {
      ...order,
      order_items: items,
      vendor_count: vendorSet.size,
    }
  })

  return { data: normalized, error: null }
}

async function getCustomerOrder(userId, orderId) {
  if (!userId || !orderId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(*)')
    .eq('customer_id', userId)
    .eq('id', orderId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data: data ?? null, error: null }
}

export {
  createOrderFromCart,
  getCustomerOrder,
  getCustomerOrders,
  getOrderStatusHistory,
  getVendorEarnings,
  getVendorOrder,
  getVendorOrders,
  updateVendorOrderStatus,
}
