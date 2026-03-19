// hooks/useProProfile.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database, TablesUpdate, Enums } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────
type SkillTag = Database['public']['Enums']['skill_tag']

export interface SkillEntry {
  id:                string
  skill:             SkillTag
  skill_other_label: string | null
}

export interface FullProfessionalProfile {
  // from profiles
  id:            string
  name:          string
  email:         string
  profile_photo: string | null
  bio:           string | null
  time_zone:     string
  // from professional_profiles
  professional_profile_id: string
  national_id:    string | null
  linkedin:       string | null
  instagram:      string | null
  facebook:       string | null
  field:          string
  university:     string | null
  degree:         string | null
  job:            string | null
  job_title:      string | null
  phone_number:   string | null
  portfolio:      string | null
  price_per_hour: number
  status:         string
  verify_time_id: number | null
  // from professional_skills
  skills: SkillEntry[]
}

export interface UpdateProPayload {
  // profiles
  name?:          string
  bio?:           string
  time_zone?:     Enums<'time_zone'>
  profile_photo?: string
  // professional_profiles
  national_id?:   string
  linkedin?:      string
  instagram?:     string
  facebook?:      string
  field?:         string
  university?:    string
  degree?:        string
  job?:           string
  job_title?:     string
  phone_number?:  string
  portfolio?:     string
  price_per_hour?: number
  verify_time_id?: number
  // skills (full replace)
  skills?: { skill: SkillTag; skill_other_label?: string }[]
}

interface UseProProfileReturn {
  data:    FullProfessionalProfile | null
  loading: boolean
  error:   string | null
  update:  (fields: UpdateProPayload) => Promise<boolean>
  refetch: () => Promise<void>
}

// ── Hook ───────────────────────────────────────────────
export function useProProfile(): UseProProfileReturn {
  // const supabase = createClient()

  const [data,    setData]    = useState<FullProfessionalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Refetch function that can be called externally
  async function refetch() {
    setLoading(true)
    setError(null)

    try {
      // Step 1: get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Step 2: fetch profiles + email
      const { data: profile, error: profileError } = await supabase
        .from('profiles_with_email')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw new Error(profileError.message)

      // Step 3: fetch professional_profiles + skills in one query
      const { data: proProfile, error: proError } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          professional_skills (
            id,
            skill,
            skill_other_label
          )
        `)
        .eq('profile_id', user.id)
        .single()

      if (proError) throw new Error(proError.message)

      // Step 4: merge into one flat object
      setData({
        // profiles fields
        id:            profile.id,
        name:          profile.name,
        email:         profile.email,
        profile_photo: profile.profile_photo,
        bio:           profile.bio,
        time_zone:     profile.time_zone,
        // professional_profiles fields
        professional_profile_id: proProfile.id,
        national_id:    proProfile.national_id,
        linkedin:       proProfile.linkedin,
        instagram:      proProfile.instagram,
        facebook:       proProfile.facebook,
        field:          proProfile.field,
        university:     proProfile.university,
        degree:         proProfile.degree,
        job:            proProfile.job,
        job_title:      proProfile.job_title,
        phone_number:   proProfile.phone_number,
        portfolio:      proProfile.portfolio,
        price_per_hour: proProfile.price_per_hour,
        status:         proProfile.status,
        verify_time_id: proProfile.verify_time_id,
        // skills array
        skills: proProfile.professional_skills ?? [],
      })

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch with cancellation support for React Strict Mode
  useEffect(() => {
    let cancelled = false

    async function fetchProfile() {
      if (cancelled) return
      setLoading(true)
      setError(null)

      try {
        // Step 1: get auth user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (cancelled) return
        if (authError || !user) throw new Error('Not authenticated')

        // Step 2: fetch profiles + email
        const { data: profile, error: profileError } = await supabase
          .from('profiles_with_email')
          .select('*')
          .eq('id', user.id)
          .single()

        if (cancelled) return
        if (profileError) throw new Error(profileError.message)

        // Step 3: fetch professional_profiles + skills in one query
        const { data: proProfile, error: proError } = await supabase
          .from('professional_profiles')
          .select(`
            *,
            professional_skills (
              id,
              skill,
              skill_other_label
            )
          `)
          .eq('profile_id', user.id)
          .single()

        if (cancelled) return
        if (proError) throw new Error(proError.message)

        // Step 4: merge into one flat object
        setData({
          // profiles fields
          id:            profile.id,
          name:          profile.name,
          email:         profile.email,
          profile_photo: profile.profile_photo,
          bio:           profile.bio,
          time_zone:     profile.time_zone,
          // professional_profiles fields
          professional_profile_id: proProfile.id,
          national_id:    proProfile.national_id,
          linkedin:       proProfile.linkedin,
          instagram:      proProfile.instagram,
          facebook:       proProfile.facebook,
          field:          proProfile.field,
          university:     proProfile.university,
          degree:         proProfile.degree,
          job:            proProfile.job,
          job_title:      proProfile.job_title,
          phone_number:   proProfile.phone_number,
          portfolio:      proProfile.portfolio,
          price_per_hour: proProfile.price_per_hour,
          status:         proProfile.status,
          verify_time_id: proProfile.verify_time_id,
          // skills array
          skills: proProfile.professional_skills ?? [],
        })

      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Update function ─────────────────────────────────
  async function update(fields: UpdateProPayload): Promise<boolean> {
    if (!data) return false

    try {
      const updates: PromiseLike<{ error: { message: string } | null }>[] = []

      // ── Update profiles table ──
      const profileFields: TablesUpdate<'profiles'> = {}
      if (fields.name          !== undefined) profileFields.name          = fields.name
      if (fields.bio           !== undefined) profileFields.bio           = fields.bio
      if (fields.time_zone     !== undefined) profileFields.time_zone     = fields.time_zone
      if (fields.profile_photo !== undefined) profileFields.profile_photo = fields.profile_photo

      if (Object.keys(profileFields).length > 0) {
        updates.push(
          supabase.from('profiles').update(profileFields).eq('id', data.id).select().then(res => res)
        )
      }

      // ── Update professional_profiles table ──
      const proFields: TablesUpdate<'professional_profiles'> = {}
      if (fields.national_id    !== undefined) proFields.national_id    = fields.national_id
      if (fields.linkedin       !== undefined) proFields.linkedin       = fields.linkedin
      if (fields.instagram      !== undefined) proFields.instagram      = fields.instagram
      if (fields.facebook       !== undefined) proFields.facebook       = fields.facebook
      if (fields.field          !== undefined) proFields.field          = fields.field
      if (fields.university     !== undefined) proFields.university     = fields.university
      if (fields.degree         !== undefined) proFields.degree         = fields.degree
      if (fields.job            !== undefined) proFields.job            = fields.job
      if (fields.job_title      !== undefined) proFields.job_title      = fields.job_title
      if (fields.phone_number   !== undefined) proFields.phone_number   = fields.phone_number
      if (fields.portfolio      !== undefined) proFields.portfolio      = fields.portfolio
      if (fields.price_per_hour !== undefined) proFields.price_per_hour = fields.price_per_hour
      if (fields.verify_time_id !== undefined) proFields.verify_time_id = fields.verify_time_id

      if (Object.keys(proFields).length > 0) {
        updates.push(
          supabase
            .from('professional_profiles')
            .update(proFields)
            .eq('id', data.professional_profile_id)
            .select()
            .then(res => res)
        )
      }

      // ── Update skills (delete all → re-insert) ──
      // This is the cleanest approach for multi-select fields
      if (fields.skills !== undefined) {
        updates.push(
          // delete existing skills first
          supabase
            .from('professional_skills')
            .delete()
            .eq('professional_profile_id', data.professional_profile_id)
            .then(() =>
              // then insert the new set
              supabase.from('professional_skills').insert(
                fields.skills!.map(s => ({
                  professional_profile_id: data.professional_profile_id,
                  skill:             s.skill,
                  skill_other_label: s.skill === 'Other' ? s.skill_other_label ?? null : null,
                }))
              ).then(res => res)
            )
        )
      }

      const results = await Promise.all(updates)
      const failed  = results.find(r => r.error)
      if (failed?.error) throw new Error(failed.error.message)

      // Refresh data after save
      await refetch()
      return true

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  return { data, loading, error, update, refetch }
}

// ── Public Profile Hook (fetch by ID) ──────────────────────────
export interface PublicProfessionalProfile {
  // professional_profiles fields
  id: string
  job_title: string | null
  job: string | null
  field: string
  price_per_hour: number
  linkedin: string | null
  instagram: string | null
  facebook: string | null
  portfolio: string | null
  // from profiles
  profile_id: string
  name: string
  profile_photo: string | null
  bio: string | null
  time_zone: string
  // from professional_skills
  skills: {
    skill: string
    skill_other_label: string | null
  }[]
  // from time_slots
  time_slots: {
    id: string
    day_of_week: string
    start_time: string
    end_time: string
    is_booked: boolean
  }[]
  // from reviews
  reviews: {
    id: string
    rating: number
    comment: string | null
    created_at: string
    reviewer_name: string
    reviewer_photo: string | null
  }[]
  // computed
  avg_rating: number | null
  review_count: number
}

interface UseProProfileByIdReturn {
  data: PublicProfessionalProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProProfileById(professionalProfileId: string | null): UseProProfileByIdReturn {
  const [data, setData] = useState<PublicProfessionalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchProfile() {
    if (!professionalProfileId) {
      setLoading(false)
      setError('No professional ID provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetching all related data in a single Supabase query
      // Using maybeSingle() to avoid error when no rows found
      const { data: proData, error: proError } = await supabase
        .from('professional_profiles')
        .select(`
          id,
          job_title,
          job,
          field,
          price_per_hour,
          linkedin,
          instagram,
          facebook,
          portfolio,
          profile_id,
          profiles (
            name,
            profile_photo,
            bio,
            time_zone
          ),
          professional_skills (
            skill,
            skill_other_label
          ),
          time_slots (
            id,
            day_of_week,
            start_time,
            end_time,
            is_booked
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            user_profiles (
              profiles (
                name,
                profile_photo
              )
            )
          )
        `)
        .eq('id', professionalProfileId)
        .maybeSingle()

      if (proError) {
        console.error('[useProProfileById] Supabase error:', proError)
        throw new Error(proError.message)
      }
      
      if (!proData) {
        console.error('[useProProfileById] No data found for ID:', professionalProfileId)
        throw new Error('Professional not found')
      }

      // Type assertions for nested data - using unknown first for safe casting
      const profiles = proData.profiles as unknown as { name: string; profile_photo: string | null; bio: string | null; time_zone: string } | null
      const skills = (proData.professional_skills ?? []) as unknown as { skill: string; skill_other_label: string | null }[]
      const timeSlots = (proData.time_slots ?? []) as unknown as { id: string; day_of_week: string; start_time: string; end_time: string; is_booked: boolean }[]
      const reviews = (proData.reviews ?? []) as unknown as { 
        id: string; 
        rating: number; 
        comment: string | null; 
        created_at: string;
        user_profiles: { profiles: { name: string; profile_photo: string | null } | null } | null
      }[]

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : null

      // Transform reviews to include reviewer info
      const transformedReviews = reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer_name: r.user_profiles?.profiles?.name ?? 'Anonymous',
        reviewer_photo: r.user_profiles?.profiles?.profile_photo ?? null
      }))

      setData({
        id: proData.id,
        job_title: proData.job_title,
        job: proData.job,
        field: proData.field,
        price_per_hour: proData.price_per_hour,
        linkedin: proData.linkedin,
        instagram: proData.instagram,
        facebook: proData.facebook,
        portfolio: proData.portfolio,
        profile_id: proData.profile_id,
        name: profiles?.name ?? 'Unknown',
        profile_photo: profiles?.profile_photo ?? null,
        bio: profiles?.bio ?? null,
        time_zone: profiles?.time_zone ?? 'Asia/Colombo',
        skills,
        time_slots: timeSlots,
        reviews: transformedReviews,
        avg_rating: avgRating,
        review_count: reviews.length
      })

    } catch (err: unknown) {
      console.error('[useProProfileById] Error:', err)
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String(err.message))
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [professionalProfileId])

  return { data, loading, error, refetch: fetchProfile }
}

// ── Hook for fetching multiple professionals (home page) ──────────────
export interface ProfessionalCardData {
  id: string
  name: string
  profile_photo: string | null
  job_title: string | null
  job: string | null
  price_per_hour: number
  avg_rating: number | null
  session_count: number
}

interface UseProfessionalsReturn {
  data: ProfessionalCardData[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple in-memory cache for professionals data
interface ProfessionalsCache {
  data: ProfessionalCardData[]
  timestamp: number
  limit: number
}

let professionalsCache: ProfessionalsCache | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProfessionals(limit: number = 3): UseProfessionalsReturn {
  const [data, setData] = useState<ProfessionalCardData[]>(() => {
    // Initialize from cache if valid
    if (
      professionalsCache &&
      professionalsCache.limit === limit &&
      Date.now() - professionalsCache.timestamp < CACHE_DURATION
    ) {
      return professionalsCache.data
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have valid cached data
    if (
      professionalsCache &&
      professionalsCache.limit === limit &&
      Date.now() - professionalsCache.timestamp < CACHE_DURATION
    ) {
      return false
    }
    return true
  })
  const [error, setError] = useState<string | null>(null)

  async function fetchProfessionals(bypassCache: boolean = false) {
    // Check cache first (unless bypassing)
    if (
      !bypassCache &&
      professionalsCache &&
      professionalsCache.limit === limit &&
      Date.now() - professionalsCache.timestamp < CACHE_DURATION
    ) {
      setData(professionalsCache.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch approved professionals ordered by created_at DESC, limited
      const { data: professionals, error: proError } = await supabase
        .from('professional_profiles')
        .select(`
          id,
          job_title,
          job,
          price_per_hour,
          created_at,
          profiles (
            name,
            profile_photo
          ),
          reviews (
            rating
          ),
          bookings (
            id
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (proError) {
        console.error('[useProfessionals] Supabase error:', proError)
        throw new Error(proError.message)
      }

      if (!professionals) {
        setData([])
        professionalsCache = { data: [], timestamp: Date.now(), limit }
        return
      }

      // Transform data
      const transformedData: ProfessionalCardData[] = professionals.map((pro) => {
        // Type assertions for nested data
        const profiles = pro.profiles as unknown as { name: string; profile_photo: string | null } | null
        const reviews = (pro.reviews ?? []) as unknown as { rating: number }[]
        const bookings = (pro.bookings ?? []) as unknown as { id: string }[]

        // Calculate average rating
        const avgRating = reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : null

        return {
          id: pro.id,
          name: profiles?.name ?? 'Unknown',
          profile_photo: profiles?.profile_photo ?? null,
          job_title: pro.job_title,
          job: pro.job,
          price_per_hour: pro.price_per_hour,
          avg_rating: avgRating,
          session_count: bookings.length
        }
      })

      // Update cache
      professionalsCache = {
        data: transformedData,
        timestamp: Date.now(),
        limit
      }

      setData(transformedData)

    } catch (err: unknown) {
      console.error('[useProfessionals] Error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfessionals()
  }, [limit])

  return { data, loading, error, refetch: () => fetchProfessionals(true) }
}

/*
 * ── useProProfile() Return Values ───────────────────────────────
 *
 * Returns an object with:
 *
 * 1. data: FullProfessionalProfile | null
 *    ── From profiles table (via profiles_with_email view) ──
 *    - id                      → user's UUID (matches auth.users.id)
 *    - name                    → display name
 *    - email                   → email address (from auth.users via view)
 *    - profile_photo           → URL to profile picture in Supabase Storage, or null
 *    - bio                     → short bio text, or null
 *    - time_zone               → Asia timezone string, e.g. 'Asia/Colombo'
 *
 *    ── From professional_profiles table ──
 *    - professional_profile_id → UUID of the professional_profiles row
 *    - national_id             → national ID string, or null
 *    - linkedin                → LinkedIn URL, or null
 *    - instagram               → Instagram URL, or null
 *    - facebook                → Facebook URL, or null
 *    - field                   → professional field (e.g. 'Software Engineering')
 *    - university              → university name, or null
 *    - degree                  → degree name, or null
 *    - job                     → current job/company, or null
 *    - job_title               → job title, or null
 *    - phone_number            → contact number, or null
 *    - portfolio               → portfolio URL, or null
 *    - price_per_hour          → hourly rate (number)
 *    - status                  → 'pending_approval' | 'approved' | 'rejected'
 *    - verify_time_id          → FK to verify_time_options (preferred verification slot), or null
 *
 *    ── From professional_skills table ──
 *    - skills                  → array of SkillEntry objects:
 *        - id                  → skill row UUID
 *        - skill               → skill_tag enum value (e.g. 'Web Development', 'Other')
 *        - skill_other_label   → custom label when skill is 'Other', or null
 *
 * 2. loading: boolean
 *    - true while fetching profile data from Supabase
 *    - false once fetch completes (success or error)
 *
 * 3. error: string | null
 *    - null if no error occurred
 *    - contains the error message string if auth, fetch, or update failed
 *
 * 4. update: (fields: UpdateProPayload) => Promise<boolean>
 *    - accepts fields to update (name, bio, time_zone, profile_photo,
 *      national_id, linkedin, instagram, facebook, field, university,
 *      degree, job, job_title, phone_number, portfolio, price_per_hour,
 *      verify_time_id, skills)
 *    - splits fields into profiles table updates and professional_profiles table updates
 *    - skills are fully replaced (delete all existing → insert new set)
 *    - runs all updates in parallel
 *    - returns true on success, false on failure
 *    - automatically refetches profile data after a successful update
 *
 * 5. refetch: () => Promise<void>
 *    - manually re-fetches the professional's profile data from Supabase
 *    - useful after external changes (e.g. profile photo upload, admin approval)
 *
 * ── Data Flow ───────────────────────────────────────────────────
 *
 *   auth.users (email)
 *       ↓
 *   profiles_with_email (view) → id, name, email, profile_photo, bio, time_zone
 *       ↓
 *   professional_profiles (table) → professional_profile_id, national_id, linkedin,
 *       │                           instagram, facebook, field, university, degree,
 *       │                           job, job_title, phone_number, portfolio,
 *       │                           price_per_hour, status, verify_time_id
 *       ↓
 *   professional_skills (table) → skills[] (id, skill, skill_other_label)
 *       ↓
 *   Merged into FullProfessionalProfile (flat object returned as `data`)
 *
 * ────────────────────────────────────────────────────────────────
 */
