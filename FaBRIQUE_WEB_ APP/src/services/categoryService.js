import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

async function getCategories(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (options.activeOnly !== false) {
    query = query.eq('is_active', true)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return { data: data ?? [], error: null }
}

async function getCategoryBySlug(slug) {
  if (!slug || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { data, error: null }
}

export { getCategories, getCategoryBySlug }
