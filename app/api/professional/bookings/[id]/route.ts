// app/api/professional/bookings/[id]/route.ts

import {NextRequest, NextResponse} from 'next/server'
import {createSupabaseServerClient} from '@/lib/supabaseServer'
import {sendApprovalEmail, sendRejectionEmail} from '@/lib/email/sendEmail'
import {z} from 'zod'

// ── Validation Schema ───────────────────────────────────
const updateSchema = z.object({
    action: z.enum(['approve', 'reject'], {
        error: "Action must be 'approve' or 'reject'"
    }),
    zoom_link: z.string().url().optional(),  // optional — can add later
    payment_link: z.string().url().optional(),  // optional — override generated one
})

function getAccessToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '').trim()
        : null

    if (bearerToken) {
        return bearerToken
    }

    return req.cookies.get('ec_access_token')?.value ?? null
}

// ══════════════════════════════════════════════════════
// PATCH /api/professional/bookings/[id]
// Professional approves or rejects a booking request
// ══════════════════════════════════════════════════════
export async function PATCH(
    req: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = getAccessToken(req)
        if (!accessToken) {
            return NextResponse.json(
                {error: 'You must be logged in'},
                {status: 401}
            )
        }

        const supabase = createSupabaseServerClient()
        const { id: bookingId } = await params

        // ── Step 1: Verify authentication ───────────────────
        const {data: {user}, error: authError} = await supabase.auth.getUser(accessToken)

        if (authError || !user) {
            return NextResponse.json(
                {error: 'You must be logged in'},
                {status: 401}
            )
        }

        // ── Step 2: Validate request body ───────────────────
        const body = await req.json()
        const parsed = updateSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                {error: 'Invalid request', details: parsed.error.flatten()},
                {status: 400}
            )
        }

        const {action, zoom_link, payment_link} = parsed.data

        // ── Step 3: Verify caller is a professional ──────────
        const {data: callerProfile, error: callerError} = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (callerError || !callerProfile) {
            return NextResponse.json(
                {error: 'Profile not found'},
                {status: 404}
            )
        }

        if (callerProfile.role !== 'professional') {
            return NextResponse.json(
                {error: 'Only professionals can approve or reject bookings'},
                {status: 403}
            )
        }

        // ── Step 4: Get professional_profile id ─────────────
        const {data: proProfile, error: proProfileError} = await supabase
            .from('professional_profiles')
            .select('id, price_per_hour')
            .eq('profile_id', user.id)
            .single()

        if (proProfileError || !proProfile) {
            return NextResponse.json(
                {error: 'Professional profile not found'},
                {status: 404}
            )
        }

        // ── Step 5: Fetch the booking with full details ──────
        const {data: booking, error: bookingError} = await supabase
            .from('bookings')
            .select(`
        id,
        status,
        is_paid,
        user_profile_id,
        professional_profile_id,
        time_slot_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        user_profiles (
          id,
          profile_id,
          profiles (
            name
          )
        )
      `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json(
                {error: 'Booking not found'},
                {status: 404}
            )
        }

        // ── Step 6: Ownership check ──────────────────────────
        // Make sure this booking is FOR this professional
        // Prevents professional A from approving professional B's bookings
        if (booking.professional_profile_id !== proProfile.id) {
            return NextResponse.json(
                {error: 'You are not authorized to manage this booking'},
                {status: 403}
            )
        }

        // ── Step 7: Status check ─────────────────────────────
        // Can only approve or reject a PENDING booking
        if (booking.status !== 'pending') {
            const messages: Record<string, string> = {
                approved: 'This booking has already been approved.',
                rejected: 'This booking has already been rejected.',
                cancelled: 'This booking was cancelled by the user.',
                completed: 'This session has already been completed.',
            }

            return NextResponse.json(
                {
                    error: messages[booking.status] ?? 'This booking cannot be modified'
                },
                {status: 400}
            )
        }

        // ── Step 8: Get user email for notification ──────────
        type BookingUserProfileRef = { profile_id: string | null } | null
        type BookingSlotRef = {
            day_of_week: string
            start_time: string
            end_time: string
        } | null

        const userProfileId = (booking.user_profiles as unknown as BookingUserProfileRef)?.profile_id
        const {data: userEmailData} = await supabase
            .from('profiles_with_email')
            .select('email, name')
            .eq('id', userProfileId)
            .single()

        // ── Step 9: Get professional name for email ──────────
        const {data: proEmailData} = await supabase
            .from('profiles_with_email')
            .select('name')
            .eq('id', user.id)
            .single()

        const slotDetails = booking.time_slots as unknown as BookingSlotRef

        // ══════════════════════════════════════════════════
        // APPROVE FLOW
        // ══════════════════════════════════════════════════
        if (action === 'approve') {

            // ── Generate payment link ────────────────────────
            // In production replace with real payment gateway
            // e.g. Stripe, PayHere, PayPal
            const generatedPaymentLink = payment_link
                ?? `${process.env.NEXT_PUBLIC_SITE_URL}/payment/${bookingId}`

            // ── Update booking to approved ───────────────────
            const {error: updateError} = await supabase
                .from('bookings')
                .update({
                    status: 'approved',
                    payment_link: generatedPaymentLink,
                    zoom_link: zoom_link ?? null,    // can be added now or later
                })
                .eq('id', bookingId)

            if (updateError) {
                console.error('Approve update error:', updateError)
                return NextResponse.json(
                    {error: 'Failed to approve booking. Please try again.'},
                    {status: 500}
                )
            }

            // ── Send approval email to user ──────────────────
            // Non-blocking — booking is saved even if email fails
            if (userEmailData?.email && slotDetails) {
                sendApprovalEmail({
                    to: userEmailData.email,
                    userName: userEmailData.name,
                    professionalName: proEmailData?.name ?? 'Your expert',
                    day: slotDetails.day_of_week,
                    startTime: slotDetails.start_time,
                    endTime: slotDetails.end_time,
                    paymentLink: generatedPaymentLink,
                    bookingId,
                }).catch(err =>
                    console.error('Approval email failed (non-critical):', err)
                )
            }

            // ── Log email ────────────────────────────────────
            if (userEmailData?.email) {
                await supabase.from('email_logs').insert({
                    recipient: userEmailData.email,
                    subject: `Your booking has been approved`,
                    related_id: bookingId,
                    type: 'booking_approved',
                })
            }

            return NextResponse.json(
                {
                    success: true,
                    action: 'approved',
                    booking_id: bookingId,
                    payment_link: generatedPaymentLink,
                    message: 'Booking approved. Payment link sent to user.',
                },
                {status: 200}
            )
        }

        // ══════════════════════════════════════════════════
        // REJECT FLOW
        // ══════════════════════════════════════════════════
        if (action === 'reject') {

            // ── Update booking to rejected ───────────────────
            // DB trigger (trg_booking_free_slot) automatically
            // sets time_slots.is_booked = false on rejection
            const {error: updateError} = await supabase
                .from('bookings')
                .update({status: 'rejected'})
                .eq('id', bookingId)

            if (updateError) {
                console.error('Reject update error:', updateError)
                return NextResponse.json(
                    {error: 'Failed to reject booking. Please try again.'},
                    {status: 500}
                )
            }

            // ── Send rejection email to user ─────────────────
            if (userEmailData?.email && slotDetails) {
                sendRejectionEmail({
                    to: userEmailData.email,
                    userName: userEmailData.name,
                    professionalName: proEmailData?.name ?? 'The professional',
                    day: slotDetails.day_of_week,
                    startTime: slotDetails.start_time,
                    bookingId,
                }).catch(err =>
                    console.error('Rejection email failed (non-critical):', err)
                )
            }

            // ── Log email ────────────────────────────────────
            if (userEmailData?.email) {
                await supabase.from('email_logs').insert({
                    recipient: userEmailData.email,
                    subject: `Your booking request was not accepted`,
                    related_id: bookingId,
                    type: 'booking_rejected',
                })
            }

            return NextResponse.json(
                {
                    success: true,
                    action: 'rejected',
                    booking_id: bookingId,
                    message: 'Booking rejected. User has been notified. Time slot is now free.',
                },
                {status: 200}
            )
        }

    } catch (err: unknown) {
        console.error('Unexpected error in PATCH /api/professional/bookings/[id]:', err)
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        )
    }
}


// ══════════════════════════════════════════════════════════════════════
// API ROUTE DESCRIPTION — /api/professional/bookings/[id]
// ══════════════════════════════════════════════════════════════════════
//
// Base URL:  /api/professional/bookings/[id]
// Auth:      Required (must be logged in as a professional)
// Param:     id — the booking UUID (passed as a URL segment)
//
// ── PATCH /api/professional/bookings/[id] ───────────────────────────
//
//   Description:  Allows a professional to approve or reject a PENDING
//                 booking. On approval, a payment link is generated
//                 (or uses a custom one if provided) and an approval
//                 email is sent to the user. On rejection, a DB trigger
//                 (trg_booking_free_slot) frees the time slot and a
//                 rejection email is sent. Emails are non-blocking —
//                 the booking update succeeds even if email fails.
//
//   Request body (JSON):
//     {
//       "action":       "approve" | "reject",   // required
//       "zoom_link":    "https://...",           // optional — Zoom meeting URL
//       "payment_link": "https://..."            // optional — overrides auto-generated link
//     }
//
//   Success response — Approve (200):
//     {
//       "success":      true,
//       "action":       "approved",
//       "booking_id":   "uuid",
//       "payment_link": "https://...",
//       "message":      "Booking approved. Payment link sent to user."
//     }
//
//   Success response — Reject (200):
//     {
//       "success":    true,
//       "action":     "rejected",
//       "booking_id": "uuid",
//       "message":    "Booking rejected. User has been notified. Time slot is now free."
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Invalid body / booking is not in 'pending' status
//     403 — Caller is not a professional / does not own this booking
//     404 — Profile, professional profile, or booking not found
//     500 — Failed to update / Internal server error
//
//
// ── GET /api/professional/bookings/[id] ─────────────────────────────
//
//   Description:  Returns full details of a single booking from the
//                 professional's perspective. Includes the user's name,
//                 profile photo, bio, timezone, and time slot info.
//                 Only the professional who owns the booking can view it.
//
//   Request body: None
//
//   Success response (200):
//     {
//       "booking": {
//         "id":                       "uuid",
//         "status":                   "pending" | "approved" | "completed" | "rejected" | "cancelled",
//         "is_paid":                  false,
//         "payment_link":             "https://..." | null,
//         "zoom_link":                "https://..." | null,
//         "created_at":               "ISO timestamp",
//         "updated_at":               "ISO timestamp",
//         "professional_profile_id":  "uuid",
//         "time_slots": {
//           "id":          "uuid",
//           "day_of_week": "Monday",
//           "start_time":  "09:00:00",
//           "end_time":    "10:00:00"
//         },
//         "user_profiles": {
//           "id":     "uuid",
//           "status": "active",
//           "profiles": {
//             "name":          "Jane Smith",
//             "profile_photo": "https://...",
//             "bio":           "Student looking for guidance...",
//             "time_zone":     "Asia/Colombo"
//           }
//         }
//       }
//     }
//
//   Error responses:
//     401 — Not logged in
//     403 — Professional does not own this booking
//     404 — Professional profile or booking not found
//     500 — Internal server error
//
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════
// GET /api/professional/bookings/[id]
// Get a single booking detail — for professional's view
// ══════════════════════════════════════════════════════
export async function GET(
    req: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const accessToken = getAccessToken(req)
        if (!accessToken) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        const supabase = createSupabaseServerClient()
        const { id: bookingId } = await params

        // ── Step 1: Verify authentication ───────────────────
        const {data: {user}, error: authError} = await supabase.auth.getUser(accessToken)

        if (authError || !user) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        // ── Step 2: Get professional_profile id ─────────────
        const {data: proProfile, error: proError} = await supabase
            .from('professional_profiles')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (proError || !proProfile) {
            return NextResponse.json(
                {error: 'Professional profile not found'},
                {status: 404}
            )
        }

        // ── Step 3: Fetch booking with user details ──────────
        const {data: booking, error: bookingError} = await supabase
            .from('bookings')
            .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
        professional_profile_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        user_profiles (
          id,
          status,
          profiles (
            name,
            profile_photo,
            bio,
            time_zone
          )
        )
      `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json(
                {error: 'Booking not found'},
                {status: 404}
            )
        }

        // ── Step 4: Ownership check ──────────────────────────
        if (booking.professional_profile_id !== proProfile.id) {
            return NextResponse.json(
                {error: 'You are not authorized to view this booking'},
                {status: 403}
            )
        }

        return NextResponse.json({booking}, {status: 200})

    } catch (err: unknown) {
        console.error('Unexpected error in GET /api/professional/bookings/[id]:', err)
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        )
    }
}
