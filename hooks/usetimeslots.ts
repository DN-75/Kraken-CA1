'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Tables } from '@/types/database.types'

// ─── Exact type from your generated schema ───────────────────────────────────
type TimeSlot = Tables<'time_slots'>

interface UseTimeSlotsReturn {
  slots: TimeSlot[]
  loading: boolean
  error: string | null
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useTimeSlots(professionalId: string): UseTimeSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    const fetchSlots = async () => {
      setLoading(true)
      setError(null)

    //   const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('professional_profile_id', professionalId)
        .eq('is_booked', false)
        .order('day_of_week')
        .order('start_time')

      if (fetchError) {
        setError(fetchError.message)
        setSlots([])
      } else {
        setSlots(data ?? [])
      }

      setLoading(false)
    }

    fetchSlots()
  }, [professionalId])

  return { slots, loading, error }
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT HAPPENS AT THE END OF THIS HOOK
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The hook always returns this object to the calling component:
 *
 *   return { slots, loading, error }
 *
 * There are three possible end states:
 *
 * 1. LOADING STATE
 *    loading = true, slots = [], error = null
 *    → Happens while the Supabase query is still in flight.
 *    → The calling component (BookingModal / experts/[id]) should show
 *      a spinner or skeleton UI at this point.
 *
 * 2. SUCCESS STATE
 *    loading = false, slots = [ ...TimeSlot rows ], error = null
 *    → The query returned available (is_booked = false) slots for this
 *      professional, ordered by day then start_time.
 *    → slots[] contains raw UTC times (start_time, end_time as strings
 *      e.g. "09:00:00"). The component that receives slots[] must call
 *      slotToLocalTime(day, start_time, userTimezone) from
 *      lib/utils/timezone.ts before displaying any time to the user.
 *    → If the professional has no available slots, slots = [] (empty array).
 *      The component should show a "No available slots" message.
 *
 * 3. ERROR STATE
 *    loading = false, slots = [], error = "some error message"
 *    → The Supabase query failed (network issue, RLS rejection, etc.).
 *    → The calling component should show an error toast using Sonner:
 *      toast.error(error)
 *
 * RE-FETCH BEHAVIOUR
 *    If professionalId changes (e.g. user navigates from one expert page to
 *    another), useEffect re-runs automatically because professionalId is in
 *    the dependency array. The hook resets to loading = true and fetches
 *    fresh slots for the new professional.
 *
 * WHAT THIS HOOK DOES NOT DO
 *    - It does NOT convert UTC times to local timezone. That is the
 *      responsibility of TimeSlotPicker.tsx using slotToLocalTime().
 *    - It does NOT include already-booked slots. The DB trigger
 *      trg_booking_mark_slot sets is_booked = true the moment a booking
 *      is inserted, so this query will never return taken slots.
 *    - It does NOT mutate any data. It is read-only.
 * ─────────────────────────────────────────────────────────────────────────────
 * 
[
  {
    id: "a4e1f8a2-72ab-4c2b-9f72-1a32f6d6a111",
    professional_profile_id: "b91c8d2e-2b30-4f4c-8c3e-7c2d3c1a222",
    day_of_week: "Monday",
    start_time: "18:00:00",
    end_time: "19:00:00",
    is_booked: false,
    created_at: "2026-03-12T14:22:30.123Z"
  },
  {
    id: "c332d7e5-66e3-47c1-a0d3-88c4c3b33333",
    professional_profile_id: "b91c8d2e-2b30-4f4c-8c3e-7c2d3c1a222",
    day_of_week: "Monday",
    start_time: "19:00:00",
    end_time: "20:00:00",
    is_booked: false,
    created_at: "2026-03-12T14:22:31.456Z"
  }
]
 */