// hooks/useProfessionals.ts
//Returns professionals details for card elements
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────
type ProfessionalRow = Database['public']['Tables']['professional_profiles']['Row']
type ProfileRow      = Database['public']['Tables']['profiles']['Row']
type SkillRow        = Database['public']['Tables']['professional_skills']['Row']
type ReviewRow       = Database['public']['Tables']['reviews']['Row']

export interface ProfessionalWithDetails extends ProfessionalRow {
  profiles: Pick<ProfileRow, 'name' | 'profile_photo'>
  professional_skills: Pick<SkillRow, 'skill' | 'skill_other_label'>[]
  reviews: Pick<ReviewRow, 'rating'>[]
  // computed
  avg_rating: number
  review_count: number
  skill_labels: string[]
}

interface UseProfessionalsOptions {
  search?: string   // filter by name or skill
  limit?: number    // default: all
}

// ── Hook ───────────────────────────────────────────────
export function useProfessionals({ search = '', limit }: UseProfessionalsOptions = {}) {
  // const supabase = supabase();

  const [professionals, setProfessionals] = useState<ProfessionalWithDetails[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false  // prevent stale state on fast re-renders

    async function fetchProfessionals() {
      setLoading(true)
      setError(null)

      try {
        // ── Base query — always fetch approved professionals ──
        let query = supabase
          .from('professional_profiles')
          .select(`
            *,
            profiles ( name, profile_photo ),
            professional_skills ( skill, skill_other_label ),
            reviews ( rating )
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        // ── Apply limit if provided (e.g. 6 for home page) ──
        if (limit) query = query.limit(limit)

        const { data, error: dbError } = await query

        if (dbError) throw new Error(dbError.message)
        if (cancelled) return

        // ── Post-process: compute avg rating, skill labels ──
        let processed: ProfessionalWithDetails[] = (data || []).map(pro => {
          const reviews = (pro.reviews ?? []) as Pick<ReviewRow, 'rating'>[]
          const avg_rating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

          const skill_labels = ((pro.professional_skills ?? []) as Pick<SkillRow, 'skill' | 'skill_other_label'>[]).map((s) =>
            s.skill === 'Other' ? s.skill_other_label : s.skill
          )

          return {
            ...pro,
            avg_rating: Math.round(avg_rating * 10) / 10,  // e.g. 4.3
            review_count: reviews.length,
            skill_labels,
          }
        })

        // ── Client-side search filter ──
        // Filters by professional name OR any skill label
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          processed = processed.filter(pro => {
            const nameMatch  = pro.profiles?.name?.toLowerCase().includes(q)
            const skillMatch = pro.skill_labels.some(s => s.toLowerCase().includes(q))
            const titleMatch = pro.job_title?.toLowerCase().includes(q)
            return nameMatch || skillMatch || titleMatch
          })
        }

        setProfessionals(processed)

      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProfessionals()

    // cleanup on re-render or unmount
    return () => { cancelled = true }

  }, [search, limit])  // re-fetch when search or limit changes

  return { professionals, loading, error }
}