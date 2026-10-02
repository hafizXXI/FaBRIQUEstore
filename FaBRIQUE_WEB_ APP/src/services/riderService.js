import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured in this environment.')
  }
}

async function getRiderApplication(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

async function applyRider(payload) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from('riders')
    .insert([
      {
        profile_id: payload.userId,
        vehicle_type: payload.vehicleType,
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

export { applyRider, getRiderApplication }
