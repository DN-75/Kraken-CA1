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

  async function fetchProfile() {
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
      await fetchProfile()
      return true

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  useEffect(() => { fetchProfile() }, [])

  return { data, loading, error, update, refetch: fetchProfile }
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
