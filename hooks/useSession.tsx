// hooks/useSession.tsx
// Global auth context — session is fetched ONCE and cached.
// No loading flash on client‑side navigation.
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface SessionProfile extends ProfileRow {
  email: string
}

interface SessionContextValue {
  profile: SessionProfile | null
  loading: boolean
  error: string | null
  isUser: boolean
  isProfessional: boolean
  isAdmin: boolean
  refetch: () => Promise<void>
}

// ── Session‑storage helpers ────────────────────────────
const CACHE_KEY = 'ec_session_profile'

function getCachedProfile(): SessionProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCachedProfile(p: SessionProfile | null) {
  try {
    if (p) sessionStorage.setItem(CACHE_KEY, JSON.stringify(p))
    else sessionStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}

// ── Context ────────────────────────────────────────────
const SessionContext = createContext<SessionContextValue | null>(null)

// ── Provider (mount once in layout) ────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start with null / loading — matches server HTML (no hydration mismatch).
  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const initialised = useRef(false)

  function applyProfile(p: SessionProfile | null) {
    setProfile(p)
    setCachedProfile(p)
  }

  async function fetchProfile() {
    // After the first successful load, don't flash the skeleton on refetch.
    if (!initialised.current) setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        applyProfile(null)
        return
      }

      const user = session.user

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw new Error(profileError.message)

      applyProfile({ ...data, email: user.email ?? '' } as SessionProfile)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      applyProfile(null)
    } finally {
      initialised.current = true
      setLoading(false)
    }
  }

  useEffect(() => {
    // ── Hydrate from cache instantly (client only, after hydration) ──
    const cached = getCachedProfile()
    if (cached) {
      setProfile(cached)
      setLoading(false)
      initialised.current = true
    }

    // ── Subscribe to auth changes ──
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        await fetchProfile()
      }
      if (event === 'SIGNED_OUT') {
        applyProfile(null)
        initialised.current = true
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: SessionContextValue = {
    profile,
    loading,
    error,
    isUser:         profile?.role === 'user',
    isProfessional: profile?.role === 'professional',
    isAdmin:        profile?.role === 'admin',
    refetch:        fetchProfile,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used inside <AuthProvider>')
  }
  return ctx
}
