// hooks/useSession.tsx
// Global auth context - session is fetched once and cached.
// No loading flash on client-side navigation.
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'

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
  patchProfile: (fields: Partial<SessionProfile>) => void
}

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

function setCachedProfile(profile: SessionProfile | null) {
  try {
    if (profile) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile))
      return
    }

    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // Ignore storage failures and keep runtime state usable.
  }
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start with null/loading to match server-rendered HTML.
  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialised = useRef(false)

  function applyProfile(nextProfile: SessionProfile | null) {
    setProfile(nextProfile)
    setCachedProfile(nextProfile)
  }

  function patchProfile(fields: Partial<SessionProfile>) {
    setProfile((prev) => {
      if (!prev) return prev

      const next = { ...prev, ...fields }
      setCachedProfile(next)
      return next
    })
  }

  async function fetchProfile(sessionOverride?: Session | null) {
    // After the first successful load, don't flash the skeleton on refetch.
    if (!initialised.current) setLoading(true)
    setError(null)

    try {
      const session =
        sessionOverride ??
        (await supabase.auth.getSession()).data.session

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
    let active = true

    async function bootstrapSession() {
      const cached = getCachedProfile()

      if (cached) {
        setProfile(cached)
        setLoading(false)
        initialised.current = true
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!active) return

        if (!session?.user) {
          applyProfile(null)
          return
        }

        if (cached?.id === session.user.id) {
          return
        }

        await fetchProfile(session)
      } catch (err: unknown) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        applyProfile(null)
      } finally {
        if (!active) return
        initialised.current = true
        setLoading(false)
      }
    }

    function scheduleProfileRefresh(session: Session | null) {
      window.setTimeout(() => {
        if (!active) return
        void fetchProfile(session)
      }, 0)
    }

    void bootstrapSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        applyProfile(null)
        initialised.current = true
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        scheduleProfileRefresh(session)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: SessionContextValue = {
    profile,
    loading,
    error,
    isUser: profile?.role === 'user',
    isProfessional: profile?.role === 'professional',
    isAdmin: profile?.role === 'admin',
    refetch: fetchProfile,
    patchProfile,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)

  if (!ctx) {
    throw new Error('useSession must be used inside <AuthProvider>')
  }

  return ctx
}
