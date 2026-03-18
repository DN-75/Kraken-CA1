// hooks/useProfessionalsContext.tsx
// Global professionals context — data is fetched ONCE and cached.
// No refetching on page navigation.
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────
type ProfessionalRow = Database['public']['Tables']['professional_profiles']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type SkillRow = Database['public']['Tables']['professional_skills']['Row']
type ReviewRow = Database['public']['Tables']['reviews']['Row']

export interface ProfessionalWithDetails extends ProfessionalRow {
  profiles: Pick<ProfileRow, 'name' | 'profile_photo'>
  professional_skills: Pick<SkillRow, 'skill' | 'skill_other_label'>[]
  reviews: Pick<ReviewRow, 'rating'>[]
  // computed
  avg_rating: number
  review_count: number
  skill_labels: string[]
}

interface ProfessionalsContextValue {
  professionals: ProfessionalWithDetails[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastFetched: number | null
}

// ── Session Storage Helpers ────────────────────────────
const CACHE_KEY = 'ec_professionals_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedData {
  professionals: ProfessionalWithDetails[]
  timestamp: number
}

function getCachedProfessionals(): CachedData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: CachedData = JSON.parse(raw)
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
      return parsed
    }
    // Cache expired, remove it
    sessionStorage.removeItem(CACHE_KEY)
    return null
  } catch {
    return null
  }
}

function setCachedProfessionals(professionals: ProfessionalWithDetails[]) {
  if (typeof window === 'undefined') return
  try {
    const data: CachedData = {
      professionals,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch { /* ignore quota errors */ }
}

function clearCachedProfessionals() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}

// ── Context ────────────────────────────────────────────
const ProfessionalsContext = createContext<ProfessionalsContextValue | null>(null)

// ── Provider ───────────────────────────────────────────
export function ProfessionalsProvider({ children }: { children: ReactNode }) {
  const [professionals, setProfessionals] = useState<ProfessionalWithDetails[]>(() => {
    // Initialize from cache if available
    if (typeof window !== 'undefined') {
      const cached = getCachedProfessionals()
      if (cached) return cached.professionals
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    if (typeof window !== 'undefined') {
      const cached = getCachedProfessionals()
      if (cached) return false
    }
    return true
  })
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedProfessionals()
      if (cached) return cached.timestamp
    }
    return null
  })

  const fetchProfessionals = useCallback(async (bypassCache = false) => {
    // Check cache first (unless bypassing)
    if (!bypassCache) {
      const cached = getCachedProfessionals()
      if (cached) {
        setProfessionals(cached.professionals)
        setLastFetched(cached.timestamp)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles ( name, profile_photo ),
          professional_skills ( skill, skill_other_label ),
          reviews ( rating )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (dbError) throw new Error(dbError.message)

      // Post-process: compute avg rating, skill labels
      const processed: ProfessionalWithDetails[] = (data || []).map(pro => {
        const reviews = (pro.reviews ?? []) as Pick<ReviewRow, 'rating'>[]
        const avg_rating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0

        const skill_labels = ((pro.professional_skills ?? []) as Pick<SkillRow, 'skill' | 'skill_other_label'>[]).map((s) =>
          s.skill === 'Other' ? s.skill_other_label : s.skill
        ).filter((s): s is string => s !== null)

        return {
          ...pro,
          avg_rating: Math.round(avg_rating * 10) / 10,
          review_count: reviews.length,
          skill_labels,
        }
      })

      setProfessionals(processed)
      setCachedProfessionals(processed)
      setLastFetched(Date.now())

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  // Refetch function (bypasses cache)
  const refetch = useCallback(async () => {
    clearCachedProfessionals()
    await fetchProfessionals(true)
  }, [fetchProfessionals])

  return (
    <ProfessionalsContext.Provider
      value={{
        professionals,
        loading,
        error,
        refetch,
        lastFetched,
      }}
    >
      {children}
    </ProfessionalsContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────
export function useProfessionalsContext() {
  const ctx = useContext(ProfessionalsContext)
  if (!ctx) {
    throw new Error('useProfessionalsContext must be used within ProfessionalsProvider')
  }
  return ctx
}

// ── Convenience Hook (drop-in replacement for useProfessionals) ──
// This provides the same interface as the old hook for easy migration
export function useCachedProfessionals() {
  const { professionals, loading, error, refetch } = useProfessionalsContext()
  return { professionals, loading, error, refetch }
}
