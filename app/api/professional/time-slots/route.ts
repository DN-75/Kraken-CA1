// app/api/professional/time-slots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { z } from 'zod'

// ── Validation Schema ───────────────────────────────────
const timeSlotSchema = z.object({
  day_of_week: z.enum([
    'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday'
  ], {
    message: 'Invalid day of week'
  }),
  start_time: z
    .string()
    .regex(/^([0-1]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
      message: 'Invalid time format. Use HH:MM or HH:MM:SS'
    }),
  end_time: z
    .string()
    .regex(/^([0-1]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
      message: 'Invalid time format. Use HH:MM or HH:MM:SS'
    }),
}).refine(
  data => data.end_time > data.start_time,
  {
    message: 'End time must be after start time',
    path:    ['end_time'],
  }
)

// ══════════════════════════════════════════════════════
// GET /api/professional/time-slots
// Returns all time slots for the logged-in professional
// ══════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!accessToken) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // ── Step 2: Verify role is professional ─────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'professional') {
      return NextResponse.json(
        { error: 'Only professionals can manage time slots' },
        { status: 403 }
      )
    }

    // ── Step 3: Get professional_profile id ─────────────
    const { data: proProfile, error: proError } = await supabase
      .from('professional_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (proError || !proProfile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // ── Step 4: Fetch all time slots ─────────────────────
    // Ordered by day then start_time for clean display
    const { data: slots, error: slotsError } = await supabase
      .from('time_slots')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        is_booked,
        created_at
      `)
      .eq('professional_profile_id', proProfile.id)
      .order('day_of_week',  { ascending: true })
      .order('start_time',   { ascending: true })

    if (slotsError) {
      console.error('Fetch slots error:', slotsError)
      return NextResponse.json(
        { error: 'Failed to fetch time slots' },
        { status: 500 }
      )
    }

    // ── Step 5: Group slots by day for easy frontend use ─
    const grouped = groupSlotsByDay(slots ?? [])

    return NextResponse.json(
      {
        slots:   slots ?? [],
        grouped,
        total:   slots?.length ?? 0,
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/professional/time-slots:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════
// POST /api/professional/time-slots
// Add a new weekly recurring time slot
// ══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!accessToken) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // ── Step 2: Validate request body ───────────────────
    const body   = await req.json()
    const parsed = timeSlotSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid time slot data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { day_of_week, start_time, end_time } = parsed.data

    // ── Step 3: Verify role is professional ─────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'professional') {
      return NextResponse.json(
        { error: 'Only professionals can add time slots' },
        { status: 403 }
      )
    }

    // ── Step 4: Get professional_profile id ─────────────
    const { data: proProfile, error: proError } = await supabase
      .from('professional_profiles')
      .select('id, status')
      .eq('profile_id', user.id)
      .single()

    if (proError || !proProfile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Verify professional is approved ──────────
    // Pending/rejected professionals should not add slots
    if (proProfile.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Your profile must be approved before adding time slots'
        },
        { status: 403 }
      )
    }

    // ── Step 6: Insert the new time slot ─────────────────
    // UNIQUE(professional_profile_id, day_of_week, start_time, end_time)
    // at DB level prevents exact duplicate slots
    const { data: newSlot, error: insertError } = await supabase
      .from('time_slots')
      .insert({
        professional_profile_id: proProfile.id,
        day_of_week,
        start_time,
        end_time,
        is_booked: false,
      })
      .select()
      .single()

    if (insertError) {
      // ── Handle duplicate slot ──────────────────────────
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: `You already have a slot on ${day_of_week} at ${start_time}`
          },
          { status: 409 }
        )
      }

      console.error('Insert slot error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add time slot. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        slot:    newSlot,
        message: `Time slot added: ${day_of_week} ${start_time} — ${end_time}`,
      },
      { status: 201 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in POST /api/professional/time-slots:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════
// HELPER — Group slots by day of week
// ══════════════════════════════════════════════════════
const DAY_ORDER = [
  'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday', 'Sunday'
 ] as const

type DayOfWeek = (typeof DAY_ORDER)[number]

type TimeSlotItem = {
  id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  is_booked: boolean
  created_at: string
}

function groupSlotsByDay(slots: TimeSlotItem[]) {
  // Build empty group for every day
  const grouped: Partial<Record<DayOfWeek, TimeSlotItem[]>> = {}
  DAY_ORDER.forEach(day => { grouped[day] = [] })

  // Fill in slots
  slots.forEach(slot => {
    const daySlots = grouped[slot.day_of_week]
    if (daySlots) {
      daySlots.push(slot)
    }
  })

  // Remove empty days for cleaner response
  DAY_ORDER.forEach(day => {
    if ((grouped[day]?.length ?? 0) === 0) {
      delete grouped[day]
    }
  })

  return grouped
}


// ══════════════════════════════════════════════════════════════════════
// API ROUTE DESCRIPTION — /api/professional/time-slots
// ══════════════════════════════════════════════════════════════════════
//
// Base URL:  /api/professional/time-slots
// Auth:      Required (must be logged in as a professional)
//
// ── GET /api/professional/time-slots ────────────────────────────────
//
//   Description:  Returns all time slots for the logged-in professional,
//                 ordered by day of week then start time. Also provides
//                 slots grouped by day (empty days are omitted).
//
//   Request body: None
//
//   Success response (200):
//     {
//       "slots": [
//         {
//           "id":          "uuid",
//           "day_of_week": "Monday",
//           "start_time":  "09:00:00",
//           "end_time":    "10:00:00",
//           "is_booked":   false,
//           "created_at":  "ISO timestamp"
//         }
//       ],
//       "grouped": {
//         "Monday":    [ ...slots ],
//         "Wednesday": [ ...slots ]
//       },
//       "total": 8
//     }
//
//   Error responses:
//     401 — Not logged in
//     403 — User is not a professional
//     404 — Profile or professional profile not found
//     500 — Failed to fetch / Internal server error
//
//
// ── POST /api/professional/time-slots ───────────────────────────────
//
//   Description:  Adds a new weekly recurring time slot for the professional.
//                 The professional must have an approved profile. A DB
//                 UNIQUE constraint prevents duplicate slots (same day,
//                 start, end for the same professional).
//
//   Request body (JSON):
//     {
//       "day_of_week": "Monday" | "Tuesday" | ... | "Sunday",   // required
//       "start_time":  "09:00",          // required — HH:MM or HH:MM:SS
//       "end_time":    "10:00"           // required — must be after start_time
//     }
//
//   Success response (201):
//     {
//       "success": true,
//       "slot": {
//         "id":                       "uuid",
//         "professional_profile_id":  "uuid",
//         "day_of_week":              "Monday",
//         "start_time":               "09:00:00",
//         "end_time":                 "10:00:00",
//         "is_booked":                false,
//         "created_at":               "ISO timestamp"
//       },
//       "message": "Time slot added: Monday 09:00 — 10:00"
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Invalid body (bad day, time format, or end <= start)
//     403 — User is not a professional / profile not yet approved
//     404 — Profile or professional profile not found
//     409 — Duplicate slot (same day + time already exists)
//     500 — Failed to insert / Internal server error
//
// ══════════════════════════════════════════════════════════════════════
