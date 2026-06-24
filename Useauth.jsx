import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id)
      else { setBusiness(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchBusiness(userId) {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single()
    setBusiness(data)
    setLoading(false)
  }

  async function signUp(email, password, businessName, ownerName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    if (data.user) {
      const { error: bizError } = await supabase.from('businesses').insert({
        user_id: data.user.id,
        business_name: businessName,
        owner_name: ownerName,
        email,
        plan: 'free',
        leads_limit: 10
      })
      if (bizError) return { error: bizError }
    }
    return { data }
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshBusiness() {
    if (user) await fetchBusiness(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, signUp, signIn, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
