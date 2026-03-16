// app/api/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { z } from 'zod'

// ── Validation Schema ───────────────────────────────────
const reviewSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  rating:     z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment:    z.string().max(1000, 'Comment too long').optional(),
})

// ══════════════════════════════════════════════════════
// POST /api/reviews
// Submits a review for a completed booking
// ══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Verify user is authenticated ────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review' },
        { status: 401 }
      )
    }

    // ── Step 2: Validate request body ───────────────────
    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { booking_id, rating, comment } = parsed.data

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

    // ── Step 4: Verify booking exists and belongs to user ──
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, user_profile_id, professional_profile_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Verify ownership ────────────────────────
    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'You can only review your own bookings' },
        { status: 403 }
      )
    }

    // ── Step 6: Verify booking is completed ─────────────
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'You can only review completed sessions' },
        { status: 400 }
      )
    }

    // ── Step 7: Insert the review ───────────────────────
    // UNIQUE(booking_id) constraint at DB level prevents
    // duplicate reviews for the same booking
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id:              booking_id,
        user_profile_id:         userProfile.id,
        professional_profile_id: booking.professional_profile_id,
        rating:                  rating,
        comment:                 comment ?? null,
      })
      .select()
      .single()

    if (insertError) {
      // ── Handle DB unique violation (already reviewed) ──
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this session' },
          { status: 409 }
        )
      }

      console.error('Review insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit review. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 8: Return success ──────────────────────────
    return NextResponse.json(
      {
        success:   true,
        review_id: review.id,
        message:   'Review submitted successfully',
      },
      { status: 201 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in POST /api/reviews:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════
// GET /api/reviews?professional_profile_id=<uuid>
// Returns reviews for a professional (required for users)
// Admin can omit the param to fetch ALL reviews
// ══════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    // ── Step 1: Verify user is authenticated ────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Step 2: Check role and get query param ──────────
    const { searchParams } = new URL(req.url)
    const professionalProfileId = searchParams.get('professional_profile_id')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Non-admin users must provide professional_profile_id
    if (!isAdmin && !professionalProfileId) {
      return NextResponse.json(
        { error: 'professional_profile_id query parameter is required' },
        { status: 400 }
      )
    }

    // ── Step 3: Build query ─────────────────────────────
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        booking_id,
        user_profiles (
          profiles (
            name,
            profile_photo
          )
        ),
        professional_profiles (
          id,
          job_title,
          profiles (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by professional if param is provided
    if (professionalProfileId) {
      query = query.eq('professional_profile_id', professionalProfileId)
    }

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // ── Step 4: Compute average rating ──────────────────
    const total = reviews?.length ?? 0
    const avgRating = total > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / total
      : 0

    return NextResponse.json(
      {
        reviews:    reviews ?? [],
        total,
        avg_rating: Math.round(avgRating * 10) / 10,
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/reviews:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════════════════════
// API ROUTE DESCRIPTION — /api/reviews
// ══════════════════════════════════════════════════════════════════════
//
// Base URL:  /api/reviews
// Auth:      Required (user must be logged in via Supabase session)
//
// ── POST /api/reviews ───────────────────────────────────────────────
//
//   Description:  Submits a review for a completed booking. Only the user
//                 who made the booking can review it. The booking must be
//                 in 'completed' status. A DB UNIQUE constraint on
//                 booking_id prevents duplicate reviews.
//
//   Request body (JSON):
//     {
//       "booking_id": "uuid",             // required — the completed booking
//       "rating":     4,                   // required — integer 1-5
//       "comment":    "Great session!"     // optional — max 1000 chars
//     }
//
//   Success response (201):
//     {
//       "success":   true,
//       "review_id": "uuid",
//       "message":   "Review submitted successfully"
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Invalid body / booking is not 'completed'
//     403 — User does not own this booking
//     404 — User profile or booking not found
//     409 — Already reviewed this booking
//     500 — Failed to insert / Internal server error
//
//
// ── GET /api/reviews?professional_profile_id=<uuid> ─────────────────
//
//   Description:  Returns all reviews for a given professional, ordered
//                 by created_at descending. Includes the reviewer's name
//                 and photo, plus the professional's name and job title.
//                 Also computes and returns the average rating.
//                 Admins can omit the query param to fetch ALL reviews.
//
//   Query params:
//     professional_profile_id  — required for non-admin users (UUID)
//
//   Success response (200):
//     {
//       "reviews": [
//         {
//           "id":         "uuid",
//           "rating":     5,
//           "comment":    "Very helpful session!",
//           "created_at": "ISO timestamp",
//           "booking_id": "uuid",
//           "user_profiles": {
//             "profiles": {
//               "name":          "Jane Smith",
//               "profile_photo": "https://..."
//             }
//           },
//           "professional_profiles": {
//             "id":        "uuid",
//             "job_title": "Software Engineer",
//             "profiles": {
//               "name": "John Doe"
//             }
//           }
//         }
//       ],
//       "total":      3,
//       "avg_rating": 4.3
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Missing professional_profile_id (non-admin)
//     500 — Failed to fetch / Internal server error
//
// ══════════════════════════════════════════════════════════════════════
