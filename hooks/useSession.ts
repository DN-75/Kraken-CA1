// hooks/useSession.ts
//Return role and some basic details about user(Data in table profiles with email)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface SessionProfile extends ProfileRow {
  email: string   // from auth.users via profiles_with_email view
}

interface UseSessionReturn {
  profile:     SessionProfile | null
  loading:     boolean
  error:       string | null
  isUser:          boolean
  isProfessional:  boolean
  isAdmin:         boolean
  refetch:     () => Promise<void>
}

// ── Hook ───────────────────────────────────────────────
export function useSession(): UseSessionReturn {
  // const supabase = createClient()

  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  async function fetchSession() {
    setLoading(true)
    setError(null)

    try {
      // Step 1: get current auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setProfile(null)
        return
      }

      // Step 2: fetch profile row + email via the view
      // profiles_with_email = profiles JOIN auth.users (gives us email safely)
      const { data, error: profileError } = await supabase
        .from('profiles_with_email')   // use the view, not profiles directly
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw new Error(profileError.message)

      setProfile(data as SessionProfile)

    } catch (err: any) {
      setError(err.message)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchSession()

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchSession()
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // Cleanup listener on unmount
    return () => subscription.unsubscribe()
  }, [])

  return {
    profile,
    loading,
    error,
    // ── Convenience role booleans ──
    isUser:         profile?.role === 'user',
    isProfessional: profile?.role === 'professional',
    isAdmin:        profile?.role === 'admin',
    refetch:        fetchSession,
  }
}