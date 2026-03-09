// app/api/bookings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
// import { sendBookingRequestEmail } from '@/lib/email/sendEmail'
import { z } from 'zod'

// ── Validation Schema ───────────────────────────────────
const bookingSchema = z.object({
  time_slot_id:            z.string().uuid('Invalid time slot ID'),
  professional_profile_id: z.string().uuid('Invalid professional ID'),
})

// ══════════════════════════════════════════════════════
// POST /api/bookings
// Creates a new booking request from user to professional
// ══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // const supabase = await createClient()

    // ── Step 1: Verify user is authenticated ────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to book a session' },
        { status: 401 }
      )
    }

    // ── Step 2: Validate request body ───────────────────
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { time_slot_id, professional_profile_id } = parsed.data

    // ── Step 3: Get user_profile id ─────────────────────
    // We need user_profiles.id (not auth user id) for the booking
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

    // ── Step 4: Verify the time slot exists and is available ──
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('id, is_booked, professional_profile_id')
      .eq('id', time_slot_id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      )
    }

    // Check slot belongs to the correct professional
    if (slot.professional_profile_id !== professional_profile_id) {
      return NextResponse.json(
        { error: 'Time slot does not belong to this professional' },
        { status: 400 }
      )
    }

    // Check slot is not already booked (app-level check before DB insert)
    if (slot.is_booked) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // ── Step 5: Verify professional is approved ──────────
    const { data: professional, error: proError } = await supabase
      .from('professional_profiles')
      .select(`
        id,
        status,
        profiles (
          name
        )
      `)
      .eq('id', professional_profile_id)
      .single()

    if (proError || !professional) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      )
    }

    if (professional.status !== 'approved') {
      return NextResponse.json(
        { error: 'This professional is not available for bookings' },
        { status: 400 }
      )
    }

    // ── Step 6: Prevent user booking their own profile ───
    // (in case a professional also has a user account)
    const { data: proProfileCheck } = await supabase
      .from('professional_profiles')
      .select('profile_id')
      .eq('id', professional_profile_id)
      .single()

    if (proProfileCheck?.profile_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot book your own profile' },
        { status: 400 }
      )
    }

    // ── Step 7: Insert the booking ───────────────────────
    // UNIQUE(time_slot_id) constraint at DB level is the
    // final safety net against race conditions
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_profile_id:         userProfile.id,
        professional_profile_id: professional_profile_id,
        time_slot_id:            time_slot_id,
        status:                  'pending',
        is_paid:                 false,
      })
      .select()
      .single()

    if (bookingError) {
      // ── Handle DB unique violation (race condition) ────
      // Error code 23505 = unique_violation in PostgreSQL
      if (bookingError.code === '23505') {
        return NextResponse.json(
          { error: 'Slot already taken — someone else just booked it' },
          { status: 409 }
        )
      }

      console.error('Booking insert error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 8: Fetch professional email for notification ─
    // const { data: proEmailData } = await supabase
    //   .from('profiles_with_email')
    //   .select('email, name')
    //   .eq('id', proProfileCheck?.profile_id)
    //   .single()
    //
    // // ── Step 9: Fetch slot details for email ─────────────
    // const { data: slotDetails } = await supabase
    //   .from('time_slots')
    //   .select('day_of_week, start_time, end_time')
    //   .eq('id', time_slot_id)
    //   .single()
    //
    // // ── Step 10: Fetch user name for email ───────────────
    // const { data: userData } = await supabase
    //   .from('profiles')
    //   .select('name')
    //   .eq('id', user.id)
    //   .single()

    // ── Step 11: Send email to professional ──────────────
    // Non-blocking — don't fail the booking if email fails
    // if (proEmailData?.email && slotDetails) {
    //   sendBookingRequestEmail({
    //     to:               proEmailData.email,
    //     professionalName: proEmailData.name,
    //     userName:         userData?.name ?? 'A user',
    //     day:              slotDetails.day_of_week,
    //     startTime:        slotDetails.start_time,
    //     endTime:          slotDetails.end_time,
    //     bookingId:        booking.id,
    //   }).catch(err => console.error('Email send failed (non-critical):', err))
    // }

    // ── Step 12: Log the email ────────────────────────────
    // if (proEmailData?.email) {
    //   await supabase.from('email_logs').insert({
    //     recipient:  proEmailData.email,
    //     subject:    'New booking request',
    //     related_id: booking.id,
    //     type:       'booking_request',
    //   })
    // }

    // ── Step 13: Return success ───────────────────────────
    return NextResponse.json(
      {
        success:    true,
        booking_id: booking.id,
        message:    'Booking request sent successfully',
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error('Unexpected error in POST /api/bookings:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════
// GET /api/bookings
// Returns all bookings for the currently logged-in user
// ══════════════════════════════════════════════════════
export async function GET() {
  try {
    // const supabase = await createClient()

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

    // ── Step 3: Fetch all bookings with joined data ──────
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
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

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // ── Step 4: Group by status ──────────────────────────
    const grouped = {
      pending:   bookings?.filter(b => b.status === 'pending')   ?? [],
      approved:  bookings?.filter(b => b.status === 'approved')  ?? [],
      completed: bookings?.filter(b => b.status === 'completed') ?? [],
      rejected:  bookings?.filter(b => b.status === 'rejected')  ?? [],
      cancelled: bookings?.filter(b => b.status === 'cancelled') ?? [],
    }

    return NextResponse.json(
      {
        bookings: bookings ?? [],
        grouped,
        total: bookings?.length ?? 0,
      },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Unexpected error in GET /api/bookings:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}