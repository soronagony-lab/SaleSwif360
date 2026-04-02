import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { insforge } from '@/lib/insforgeClient'
import { isAdminEmail } from '@/lib/adminAccess'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const configured = Boolean(insforge)

  const refreshSession = useCallback(async () => {
    if (!insforge) {
      setSession(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await insforge.auth.getCurrentSession()
      setSession(data?.session ?? null)
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const signIn = useCallback(async (email, password) => {
    if (!insforge) return { error: new Error('InsForge non configuré') }
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error }
    await refreshSession()
    return { data }
  }, [refreshSession])

  const signUp = useCallback(async (email, password, name) => {
    if (!insforge) return { data: null, error: new Error('InsForge non configuré') }
    return insforge.auth.signUp({ email, password, name })
  }, [])

  const signOut = useCallback(async () => {
    if (!insforge) return
    await insforge.auth.signOut()
    setSession(null)
  }, [])

  const verifyEmail = useCallback(async (email, otp) => {
    if (!insforge) return { data: null, error: new Error('InsForge non configuré') }
    const { data, error } = await insforge.auth.verifyEmail({ email, otp })
    if (!error && data?.accessToken) await refreshSession()
    return { data, error }
  }, [refreshSession])

  const resendVerification = useCallback(async (email) => {
    if (!insforge) return { data: null, error: new Error('InsForge non configuré') }
    return insforge.auth.resendVerificationEmail({ email })
  }, [])

  const user = session?.user ?? null
  const isAdmin = Boolean(user && isAdminEmail(user.email))

  const value = useMemo(
    () => ({
      insforgeConfigured: configured,
      loading,
      session,
      user,
      isAdmin,
      refreshSession,
      signIn,
      signUp,
      signOut,
      verifyEmail,
      resendVerification,
    }),
    [
      configured,
      loading,
      session,
      user,
      isAdmin,
      refreshSession,
      signIn,
      signUp,
      signOut,
      verifyEmail,
      resendVerification,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
