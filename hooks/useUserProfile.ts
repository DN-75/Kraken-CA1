// hooks/useUserProfile.ts
//Return all the details of the current user
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate, Enums } from '@/types/database.types'


export interface FullUserProfile {
  // from profiles table
  id:            string
  name:          string
  email:         string
  profile_photo: string | null
  bio:           string | null
  time_zone:     string
  role:          string
  // from user_profiles table (only present when role === 'user')
  user_profile_id: string | null
  status:          'undergraduate' | 'school_student' | 'job' | null
}

interface UseUserProfileReturn {
  data:     FullUserProfile | null
  loading:  boolean
  error:    string | null
  update:   (fields: Partial<UpdateUserPayload>) => Promise<boolean>
  refetch:  () => Promise<void>
}

export interface UpdateUserPayload {
  // profiles fields
  name:          string
  bio:           string
  time_zone:     Enums<'time_zone'>
  profile_photo: string
  // user_profiles fields
  status: 'undergraduate' | 'school_student' | 'job'
}

// ── Hook ───────────────────────────────────────────────
export function useUserProfile(): UseUserProfileReturn {
  // const supabase = createClient()

  const [data,    setData]    = useState<FullUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  async function fetchProfile() {
    setLoading(true)
    setError(null)

    try {
      // Step 1: get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Step 2: fetch profile from profiles table (not the view)
      // profiles_with_email view joins auth.users which may be blocked by
      // security_invoker, so we read email from the auth user instead.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw new Error(profileError.message)

      // Step 3: fetch user_profiles row (only exists for role = 'user')
      let userProfileId: string | null = null
      let userStatus: 'undergraduate' | 'school_student' | 'job' | null = null

      if (profile.role === 'user') {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('id, status')
          .eq('profile_id', user.id)
          .single()

        if (userProfileError) throw new Error(userProfileError.message)
        userProfileId = userProfile.id
        userStatus = userProfile.status
      }

      // Step 4: merge into one flat object
      // Email comes from auth user (step 1), not from the profiles table
      setData({
        id:              profile.id,
        name:            profile.name,
        email:           user.email ?? '',
        profile_photo:   profile.profile_photo,
        bio:             profile.bio,
        time_zone:       profile.time_zone,
        role:            profile.role,
        user_profile_id: userProfileId,
        status:          userStatus,
      })

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // ── Update function ─────────────────────────────────
  async function update(fields: Partial<UpdateUserPayload>): Promise<boolean> {
    if (!data) return false

    try {
      // Fields that go into profiles table
      const profileFields: TablesUpdate<'profiles'> = {}
      if (fields.name          !== undefined) profileFields.name          = fields.name
      if (fields.bio           !== undefined) profileFields.bio           = fields.bio
      if (fields.time_zone     !== undefined) profileFields.time_zone     = fields.time_zone
      if (fields.profile_photo !== undefined) profileFields.profile_photo = fields.profile_photo

      // Fields that go into user_profiles table
      const userProfileFields: TablesUpdate<'user_profiles'> = {}
      if (fields.status !== undefined) userProfileFields.status = fields.status

      // Run both updates in parallel if needed
      const updates: PromiseLike<{ error: { message: string } | null }>[] = []

      if (Object.keys(profileFields).length > 0) {
        updates.push(
          supabase
            .from('profiles')
            .update(profileFields)
            .eq('id', data.id)
        )
      }

      if (Object.keys(userProfileFields).length > 0 && data.user_profile_id) {
        updates.push(
          supabase
            .from('user_profiles')
            .update(userProfileFields)
            .eq('id', data.user_profile_id)
        )
      }

      const results = await Promise.all(updates)
      const failed  = results.find(r => r.error)
      if (failed?.error) throw new Error(failed.error.message)

      // Apply updates locally so UI responds immediately even on slower networks.
      setData((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          ...(fields.name !== undefined ? { name: fields.name } : {}),
          ...(fields.bio !== undefined ? { bio: fields.bio } : {}),
          ...(fields.time_zone !== undefined ? { time_zone: fields.time_zone } : {}),
          ...(fields.profile_photo !== undefined ? { profile_photo: fields.profile_photo } : {}),
          ...(fields.status !== undefined ? { status: fields.status } : {}),
        }
      })

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
 * ── useUserProfile() Return Values ──────────────────────────────
 *
 * Returns an object with:
 *
 * 1. data: FullUserProfile | null
 *    - id              → user's UUID (from profiles table, matches auth.users.id)
 *    - name            → user's display name (from profiles)
 *    - email           → user's email (from profiles_with_email view, sourced from auth.users)
 *    - profile_photo   → URL to profile picture in Supabase Storage, or null (from profiles)
 *    - bio             → short bio text, or null (from profiles)
 *    - time_zone       → user's selected Asia timezone, e.g. 'Asia/Colombo' (from profiles)
 *    - role            → 'user' | 'professional' | 'admin' (from profiles)
 *    - user_profile_id → UUID of the user_profiles row (from user_profiles)
 *    - status          → 'undergraduate' | 'school_student' | 'job' (from user_profiles)
 *
 * 2. loading: boolean
 *    - true while fetching profile data from Supabase
 *    - false once fetch completes (success or error)
 *
 * 3. error: string | null
 *    - null if no error occurred
 *    - contains the error message string if auth, fetch, or update failed
 *
 * 4. update: (fields: Partial<UpdateUserPayload>) => Promise<boolean>
 *    - accepts partial fields to update (name, bio, time_zone, profile_photo, status)
 *    - splits fields into profiles table updates and user_profiles table updates
 *    - runs both updates in parallel
 *    - returns true on success, false on failure
 *    - automatically refetches profile data after a successful update
 *
 * 5. refetch: () => Promise<void>
 *    - manually re-fetches the user's profile data from Supabase
 *    - useful after external changes (e.g. profile photo upload)
 *
 * ── Data Flow ───────────────────────────────────────────────────
 *
 *   auth.users (email)
 *       ↓
 *   profiles_with_email (view) → id, name, email, profile_photo, bio, time_zone, role
 *       ↓
 *   user_profiles (table)      → user_profile_id, status
 *       ↓
 *   Merged into FullUserProfile (flat object returned as `data`)
 *
 * ────────────────────────────────────────────────────────────────
 */
