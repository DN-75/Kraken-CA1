'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Tables, Enums } from '@/types/database.types'

// ─── BookingWithDetails ───────────────────────────────────────────────────────
export type BookingWithDetails = Tables<'bookings'> & {
  time_slots: Pick<
    Tables<'time_slots'>,
    'id' | 'day_of_week' | 'start_time' | 'end_time'
  >
  professional_profiles: Pick<
    Tables<'professional_profiles'>,
    'id' | 'job_title' | 'price_per_hour'
  > & {
    profiles: Pick<Tables<'profiles'>, 'name' | 'profile_photo'> | null
  }
}

// ─── Return type ─────────────────────────────────────────────────────────────
interface UseBookingsReturn {
  pending:      BookingWithDetails[]
  approved:     BookingWithDetails[]
  completed:    BookingWithDetails[]
  rejected:     BookingWithDetails[]
  cancelled:    BookingWithDetails[]
  loading:      boolean
  error:        string | null
  refetch:      () => void
  cancelBooking:(bookingId: string) => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useBookings(): UseBookingsReturn {
  const [allBookings, setAllBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Read from local auth session first to avoid an extra auth round-trip.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user

      if (!user) {
        setError('Not authenticated')
        setAllBookings([])
        return
      }

      // Step 2 — Check if user is admin (admins don't have user_profiles)
      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileCheckError) {
        setError('Could not load profile')
        setAllBookings([])
        return
      }

      // Admin users don't have bookings - return empty arrays
      if (profile.role === 'admin') {
        setAllBookings([])
        return
      }

      // Step 3 — resolve auth UID → user_profiles.id
      // bookings.user_profile_id references user_profiles.id, not auth.users.id
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (profileError || !userProfile) {
        setError('Could not load user profile')
        setAllBookings([])
        return
      }

      // Step 3 — fetch bookings with all joined relations in one query
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .select(`
        *,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        professional_profiles (
          id,
          job_title,
          price_per_hour,
          profiles (
            name,
            profile_photo
          )
        )
      `)
        .eq('user_profile_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (bookingError) {
        setError(bookingError.message)
        setAllBookings([])
        return
      }

      setAllBookings((data as BookingWithDetails[]) ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAllBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings()
  }, [fetchBookings])

  // ── cancelBooking ──────────────────────────────────────────────────────────
  const cancelBooking = async (bookingId: string): Promise<void> => {
    // const supabase = createClient()

    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' as Enums<'booking_status'> })
      .eq('id', bookingId)

    if (cancelError) {
      throw new Error(cancelError.message)
    }

    await fetchBookings()
  }

  // ── Group by status in-memory ──────────────────────────────────────────────
  const pending   = allBookings.filter(b => b.status === 'pending')
  const approved  = allBookings.filter(b => b.status === 'approved')
  const completed = allBookings.filter(b => b.status === 'completed')
  const rejected  = allBookings.filter(b => b.status === 'rejected')
  const cancelled = allBookings.filter(b => b.status === 'cancelled')

  return {
    pending,
    approved,
    completed,
    rejected,
    cancelled,
    loading,
    error,
    refetch: fetchBookings,
    cancelBooking,
  }
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT HAPPENS AT THE END OF THIS HOOK
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The hook always returns this object to /account/page.tsx:
 *
 *   return { pending, approved, completed, rejected, cancelled,
 *            loading, error, refetch, cancelBooking }
 *
 * ── NORMAL END STATE (success) ───────────────────────────────────────────────
 *
 *   loading = false, error = null
 *
 *   allBookings[] has been split into 5 filtered arrays in memory:
 *
 *   pending[]   → status = 'pending'
 *                 These show in the Pending tab with a Cancel button.
 *                 User can still cancel these — professional hasn't responded.
 *
 *   approved[]  → status = 'approved'
 *                 These show in the Approved tab.
 *                 If is_paid = false  → shows "Pay Now" button
 *                                       → window.open(booking.payment_link)
 *                 If is_paid = true   → shows "Join Session" button
 *                                       → routes to /session/[bookingId]
 *
 *   completed[] → status = 'completed'
 *                 These show in the Completed tab with a "Rate Session" button.
 *                 Clicking opens RateSessionModal to submit a review.
 *
 *   rejected[]  → status = 'rejected'
 *                 Professional declined the request.
 *                 Shown in a Rejected tab (informational only).
 *
 *   cancelled[] → status = 'cancelled'
 *                 User cancelled the booking themselves.
 *                 The DB trigger trg_booking_free_slot already flipped
 *                 time_slots.is_booked back to false when this happened.
 *
 * ── ERROR END STATES ─────────────────────────────────────────────────────────
 *
 *   1. No session cookie found:
 *      error = 'Not authenticated', all arrays = []
 *      → middleware should have already blocked this page, but if it
 *        somehow reaches here, redirect to /login.
 *
 *   2. user_profiles row not found:
 *      error = 'Could not load user profile', all arrays = []
 *      → The auth user exists but their user_profiles row is missing.
 *        This means registration did not complete correctly.
 *
 *   3. Supabase query failed:
 *      error = <Supabase error message>, all arrays = []
 *      → Network issue, RLS policy rejection, or DB error.
 *      → /account/page.tsx should show: toast.error(error)
 *
 * ── WHAT cancelBooking() DOES AT THE END ─────────────────────────────────────
 *
 *   When the user clicks Cancel on a pending booking:
 *
 *   1. Sends UPDATE bookings SET status = 'cancelled' WHERE id = bookingId
 *   2. Supabase DB trigger fires automatically:
 *        trg_booking_free_slot → sets time_slots.is_booked = false
 *        → that slot is now available for other users to book again
 *   3. fetchBookings() runs again → allBookings[] is refreshed from DB
 *   4. The cancelled booking disappears from pending[] and appears in cancelled[]
 *   5. UI re-renders — the Pending tab no longer shows that booking
 *
 *   If the UPDATE fails, cancelBooking() throws an Error.
 *   The calling component catches it and shows a toast:
 *     try { await cancelBooking(id) }
 *     catch(e) { toast.error('Could not cancel booking') }
 *
 * ── refetch() ────────────────────────────────────────────────────────────────
 *
 *   Exposed so /account/page.tsx can manually trigger a refresh.
 *   Used after submitting a review (RateSessionModal) so the completed
 *   booking reflects the new review state immediately.
 *
 * ── WHAT THIS HOOK DOES NOT DO ───────────────────────────────────────────────
 *
 *   - Does NOT handle payment. Payment happens externally via payment_link.
 *     The hook simply reads is_paid from the DB — your backend sets it true
 *     after confirming payment.
 *   - Does NOT handle approve/reject. That is the professional's action,
 *     handled in /api/professional/bookings/[id]/route.ts.
 *   - Does NOT poll for real-time updates. Call refetch() manually after
 *     any action that changes booking state.
 * ─────────────────────────────────────────────────────────────────────────────
 */