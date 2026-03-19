// app/api/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase as adminSupabase, createSupabaseServerClient } from '@/lib/supabaseServer'
import { z } from 'zod'

// ── Validation Schema ───────────────────────────────────
const updateBookingSchema = z.object({
  action: z.enum(['cancel'], {
    message: "Action must be 'cancel'"
  })
})

// ══════════════════════════════════════════════════════
// PATCH /api/bookings/[id]
// User cancels their own pending booking
// ══════════════════════════════════════════════════════
export async function PATCH(
  req:     NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // ── Step 1: Get access token from Authorization header ──
    const authHeader = req.headers.get('Authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // Create Supabase client with the user's access token
    const supabase = createSupabaseServerClient(accessToken)

    // ── Step 2: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // ── Step 3: Validate request body ───────────────────
    const body = await req.json()
    const parsed = updateBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // ── Step 4: Get user_profile id ─────────────────────
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Fetch the booking ────────────────────────
    // Verify it exists AND belongs to this user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        is_paid,
        time_slot_id,
        user_profile_id,
        professional_profiles (
          profiles (
            name
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // ── Step 6: Ownership check ──────────────────────────
    // Make sure this booking belongs to the logged-in user
    // Prevents one user from cancelling another user's booking
    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this booking' },
        { status: 403 }
      )
    }

    // ── Step 7: Status check ─────────────────────────────
    // Can only cancel a PENDING booking
    // Approved/completed/rejected bookings cannot be cancelled
    if (booking.status !== 'pending') {
      const messages: Record<string, string> = {
        approved:  'This booking has already been approved. Contact the professional to cancel.',
        completed: 'This session has already been completed.',
        rejected:  'This booking has already been rejected.',
        cancelled: 'This booking is already cancelled.',
      }

      return NextResponse.json(
        {
          error: messages[booking.status] ?? 'This booking cannot be cancelled'
        },
        { status: 400 }
      )
    }

    // ── Step 7: Delete the booking ─────────────────────────
    // We delete instead of updating status because:
    // - The bookings table has UNIQUE(time_slot_id) constraint
    // - Keeping cancelled bookings would prevent rebooking the same slot
    // - The time slot will be freed when the booking is deleted
    console.log('Attempting to delete booking:', bookingId)
    
    const { data: deletedBooking, error: deleteError } = await adminSupabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      .select()

    console.log('Delete result:', { deletedBooking, deleteError })

    if (deleteError) {
      console.error('Booking delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel booking. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 8: Explicitly free the time slot ────────────
    // Use admin client to bypass RLS and ensure the slot is freed
    // This is critical for making the slot available again on the professional's page
    if (booking.time_slot_id) {
      console.log('Freeing time slot:', booking.time_slot_id)
      
      const { data: updatedSlot, error: slotError } = await adminSupabase
        .from('time_slots')
        .update({ is_booked: false })
        .eq('id', booking.time_slot_id)
        .select()

      if (slotError) {
        console.error('Failed to free time slot:', slotError)
      } else {
        console.log('Time slot freed successfully:', updatedSlot)
      }
    } else {
      console.warn('No time_slot_id found on booking:', bookingId)
    }

    // ── Step 9: Return success ───────────────────────────
    return NextResponse.json(
      {
        success:    true,
        booking_id: bookingId,
        message:    'Booking cancelled successfully. The time slot is now available again.',
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in PATCH /api/bookings/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════════════════════
// API ROUTE DESCRIPTION — /api/bookings/[id]
// ══════════════════════════════════════════════════════════════════════
//
// Base URL:  /api/bookings/[id]
// Auth:      Required (user must be logged in via Supabase session)
// Param:     id — the booking UUID (passed as a URL segment)
//
// ── PATCH /api/bookings/[id] ────────────────────────────────────────
//
//   Description:  Allows a user to cancel their own PENDING booking.
//                 Only the booking owner can cancel. Only pending bookings
//                 can be cancelled. The time slot is explicitly freed
//                 (is_booked = false) so it becomes available again on
//                 the professional's page. A DB trigger (trg_booking_free_slot)
//                 also fires as a backup.
//
//   Request body (JSON):
//     {
//       "action": "cancel"   // required — only "cancel" is accepted
//     }
//
//   Success response (200):
//     {
//       "success":    true,
//       "booking_id": "uuid",
//       "message":    "Booking cancelled successfully. The time slot is now available again."
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Invalid body / booking is not in 'pending' status
//     403 — User does not own this booking
//     404 — User profile or booking not found
//     500 — Failed to cancel / Internal server error
//
//
// ── GET /api/bookings/[id] ──────────────────────────────────────────
//
//   Description:  Returns full details of a single booking for the user.
//                 Includes time slot info and professional profile with
//                 name, photo, bio, job title, and price. Only the
//                 booking owner can view it.
//
//   Request body: None
//
//   Success response (200):
//     {
//       "booking": {
//         "id":              "uuid",
//         "status":          "pending" | "approved" | "completed" | "rejected" | "cancelled",
//         "is_paid":         false,
//         "payment_link":    "https://..." | null,
//         "zoom_link":       "https://..." | null,
//         "created_at":      "ISO timestamp",
//         "updated_at":      "ISO timestamp",
//         "user_profile_id": "uuid",
//         "time_slots": {
//           "id":          "uuid",
//           "day_of_week": "Monday",
//           "start_time":  "09:00:00",
//           "end_time":    "10:00:00"
//         },
//         "professional_profiles": {
//           "id":             "uuid",
//           "job_title":      "Software Engineer",
//           "price_per_hour": 50.00,
//           "profiles": {
//             "name":          "John Doe",
//             "profile_photo": "https://...",
//             "bio":           "Experienced developer..."
//           }
//         }
//       }
//     }
//
//   Error responses:
//     401 — Not logged in
//     403 — User does not own this booking
//     404 — User profile or booking not found
//     500 — Internal server error
//
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════
// GET /api/bookings/[id]
// Get a single booking's full details
// ══════════════════════════════════════════════════════
export async function GET(
  req:    NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // ── Step 1: Get access token from Authorization header ──
    const authHeader = req.headers.get('Authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with the user's access token
    const supabase = createSupabaseServerClient(accessToken)

    // ── Step 2: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Step 3: Get user_profile id ─────────────────────
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // ── Step 4: Fetch booking with all related data ──────
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
        user_profile_id,
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
            profile_photo,
            bio
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Ownership check ──────────────────────────
    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view this booking' },
        { status: 403 }
      )
    }

    return NextResponse.json({ booking }, { status: 200 })

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/bookings/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}