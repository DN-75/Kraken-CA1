// app/api/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
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
    // const supabase = await createClient()
    const { id: bookingId } = await params

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // ── Step 2: Validate request body ───────────────────
    const body = await req.json()
    const parsed = updateBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
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

    // ── Step 4: Fetch the booking ────────────────────────
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

    // ── Step 5: Ownership check ──────────────────────────
    // Make sure this booking belongs to the logged-in user
    // Prevents one user from cancelling another user's booking
    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this booking' },
        { status: 403 }
      )
    }

    // ── Step 6: Status check ─────────────────────────────
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

    // ── Step 7: Update booking status to cancelled ───────
    // DB trigger (trg_booking_free_slot) automatically sets
    // time_slots.is_booked = false when status = 'cancelled'
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Booking cancel error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel booking. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 8: Return success ───────────────────────────
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


// ══════════════════════════════════════════════════════
// GET /api/bookings/[id]
// Get a single booking's full details
// ══════════════════════════════════════════════════════
export async function GET(
  _req:    NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const supabase  = await createClient()
    const { id: bookingId } = await params

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Step 2: Get user_profile id ─────────────────────
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

    // ── Step 3: Fetch booking with all related data ──────
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

    // ── Step 4: Ownership check ──────────────────────────
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