import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { getProfile, signIn, signOut, signUp, resetPassword, updatePassword, getCurrentSession } from '../services/authService.js'
import { getVendorApplication } from '../services/vendorService.js'
import { getRiderApplication } from '../services/riderService.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [vendorApplication, setVendorApplication] = useState(null)
  const [riderApplication, setRiderApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshProfile = useCallback(async (nextUser) => {
    if (!nextUser || !isSupabaseConfigured || !supabase) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await getProfile(nextUser.id)
      if (error) {
        throw error
      }
      setProfile(data)
      return data
    } catch (error) {
      setAuthError(error.message)
      setProfile(null)
      return null
    }
  }, [])

  const refreshSupportRecords = useCallback(async (nextUser) => {
    if (!nextUser || !isSupabaseConfigured || !supabase) {
      setVendorApplication(null)
      setRiderApplication(null)
      return
    }

    try {
      const [vendorResult, riderResult] = await Promise.all([
        getVendorApplication(nextUser.id),
        getRiderApplication(nextUser.id),
      ])

      setVendorApplication(vendorResult.data)
      setRiderApplication(riderResult.data)
    } catch (error) {
      setAuthError(error.message)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      setLoading(true)
      setAuthError('')

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
          setVendorApplication(null)
          setRiderApplication(null)
          setLoading(false)
        }
        return
      }

      try {
        const { data: { session: initialSession } } = await getCurrentSession()

        if (!isMounted) {
          return
        }

        const currentUser = initialSession?.user ?? null
        setSession(initialSession)
        setUser(currentUser)

        if (currentUser) {
          await refreshProfile(currentUser)
          await refreshSupportRecords(currentUser)
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(error.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase ? supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      const nextUser = nextSession?.user ?? null
      setUser(nextUser)
      setAuthError('')

      if (nextUser) {
        await refreshProfile(nextUser)
        await refreshSupportRecords(nextUser)
      } else {
        setProfile(null)
        setVendorApplication(null)
        setRiderApplication(null)
      }

      setLoading(false)
    }) : { data: { subscription: null } }

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [refreshProfile, refreshSupportRecords])

  const signInHandler = useCallback(async ({ email, password }) => {
    const { user: signedInUser } = await signIn({ email, password })
    setUser(signedInUser)
    setSession((currentSession) => currentSession ?? { user: signedInUser })
    await refreshProfile(signedInUser)
    await refreshSupportRecords(signedInUser)
    return signedInUser
  }, [refreshProfile, refreshSupportRecords])

  const signUpHandler = useCallback(async ({ email, password, fullName, phone }) => {
    const data = await signUp({ email, password, fullName, phone })
    return data
  }, [])

  const resetPasswordHandler = useCallback(async ({ email }) => {
    return resetPassword({ email })
  }, [])

  const updatePasswordHandler = useCallback(async (newPassword) => {
    return updatePassword(newPassword)
  }, [])

  const signOutHandler = useCallback(async () => {
    await signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setVendorApplication(null)
    setRiderApplication(null)
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    profile,
    vendorApplication,
    riderApplication,
    isSupabaseConfigured,
    loading,
    authError,
    isAuthenticated: Boolean(user && session),
    role: profile?.role ?? null,
    signIn: signInHandler,
    signUp: signUpHandler,
    signOut: signOutHandler,
    resetPassword: resetPasswordHandler,
    updatePassword: updatePasswordHandler,
    refreshProfile,
  }), [user, session, profile, vendorApplication, riderApplication, loading, authError, signInHandler, signUpHandler, signOutHandler, resetPasswordHandler, updatePasswordHandler, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}

export { AuthProvider, useAuth }
