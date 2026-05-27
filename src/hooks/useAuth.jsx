import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const isConfigured = !!import.meta.env.VITE_SUPABASE_URL

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured) return

    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        // TODO: Remove test user after testing
        const sessionUser = session?.user ?? null
        // Use test user if no session
        if (!sessionUser) {
          setUser({ id: 'test-user-' + Date.now(), email: 'test@example.com' })
        } else {
          setUser(sessionUser)
        }
      })
      .catch(() => {
        // TODO: Remove test user after testing
        setUser({ id: 'test-user-' + Date.now(), email: 'test@example.com' })
      })
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
