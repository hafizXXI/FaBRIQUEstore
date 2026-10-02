import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase authentication is not configured in this environment.')
  }
}

async function signUp({ email, password, fullName, phone }) {
  assertSupabaseConfigured()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}

async function signIn({ email, password }) {
  assertSupabaseConfigured()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

async function getCurrentSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { session: null }, error: null }
  }

  return supabase.auth.getSession()
}

async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { user: null }, error: null }
  }

  return supabase.auth.getUser()
}

async function resetPassword({ email }) {
  assertSupabaseConfigured()

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw error
  }

  return data
}

async function updatePassword(newPassword) {
  assertSupabaseConfigured()

  const { data, error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw error
  }

  return data
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

async function getRole(userId) {
  const { data } = await getProfile(userId)
  return data?.role ?? null
}

export {
  getCurrentSession,
  getCurrentUser,
  getProfile,
  getRole,
  resetPassword,
  signIn,
  signOut,
  signUp,
  updatePassword,
}
