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

// ══════════════════════════════════════════════════════════════
// END-TO-END FLOW: Reviews API
// ══════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────────────────────┐
// │  POST /api/reviews                                      │
// │  Submit a review for a completed session                │
// │                                                         │
// │  BODY: { booking_id, rating (1-5), comment? }           │
// │  CALLER: Authenticated user who owns the booking        │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  FRONTEND (User Dashboard — Completed Sessions)         │
// │                                                         │
// │  1. User navigates to /user (account page)              │
// │  2. Completed bookings shown with "Rate Session" button │
// │  3. User clicks "Rate Session" → modal opens            │
// │  4. User selects rating (1-5 stars) + optional comment  │
// │  5. Frontend calls:                                     │
// │     fetch('/api/reviews', {                             │
// │       method: 'POST',                                   │
// │       body: JSON.stringify({                            │
// │         booking_id: '...',                              │
// │         rating: 5,                                      │
// │         comment: 'Great session!'                       │
// │       })                                                │
// │     })                                                  │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  POST HANDLER STEPS                                     │
// │                                                         │
// │  Step 1:  Auth check → supabase.auth.getUser()          │
// │           └─ 401 if not logged in                       │
// │                                                         │
// │  Step 2:  Zod validates booking_id (uuid),              │
// │           rating (int 1-5), comment (max 1000, optional)│
// │           └─ 400 if invalid                             │
// │                                                         │
// │  Step 3:  Resolve user_profiles.id from auth.uid()      │
// │           └─ 404 if no user profile                     │
// │                                                         │
// │  Step 4:  Fetch booking by booking_id                   │
// │           └─ 404 if not found                           │
// │                                                         │
// │  Step 5:  Ownership check                               │
// │           booking.user_profile_id === userProfile.id    │
// │           └─ 403 if not owner                           │
// │                                                         │
// │  Step 6:  Status check → booking.status === 'completed' │
// │           └─ 400 if not completed                       │
// │                                                         │
// │  Step 7:  INSERT into reviews table                     │
// │           DB UNIQUE(booking_id) prevents duplicates     │
// │           └─ 409 if already reviewed (code 23505)       │
// │           └─ 500 if other DB error                      │
// │                                                         │
// │  Step 8:  Return 201                                    │
// │           { success, review_id, message }               │
// └─────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────┐
// │  GET /api/reviews?professional_profile_id=<uuid>        │
// │  Fetch reviews for a professional                       │
// │                                                         │
// │  CALLER: Any authenticated user (with param)            │
// │          Admin can omit param to fetch ALL reviews      │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  FRONTEND                                               │
// │                                                         │
// │  A) Professional Public Page (/experts/[id])            │
// │     → GET /api/reviews?professional_profile_id=xxx      │
// │     → Displays review cards with rating, comment,       │
// │       reviewer name, photo, and avg_rating              │
// │                                                         │
// │  B) Admin Dashboard (/admin)                            │
// │     → GET /api/reviews (no param)                       │
// │     → Lists ALL reviews across the platform             │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  GET HANDLER STEPS                                      │
// │                                                         │
// │  Step 1:  Auth check                                    │
// │           └─ 401 if not logged in                       │
// │                                                         │
// │  Step 2:  Check role + query param                      │
// │           └─ 400 if non-admin omits param               │
// │                                                         │
// │  Step 3:  Build Supabase query                          │
// │           SELECT reviews + user_profiles.profiles       │
// │           (name, photo) + professional_profiles         │
// │           (id, job_title, name)                         │
// │           Optional .eq() filter by professional_id      │
// │                                                         │
// │  Step 4:  Compute avg_rating + total count              │
// │           Return 200 { reviews[], total, avg_rating }   │
// └─────────────────────────────────────────────────────────┘
//
// DATABASE TABLES:
//   READ:   profiles         → check role (admin or user)
//   READ:   user_profiles    → resolve user_profile.id
//   READ:   bookings         → verify status + ownership
//   READ:   reviews          → fetch existing reviews
//   WRITE:  reviews          → insert new review
//
// DB CONSTRAINTS:
//   UNIQUE(booking_id) on reviews → one review per booking
//   CHECK(rating >= 1 AND rating <= 5) → rating range
//   FK(booking_id) → bookings.id
//   FK(user_profile_id) → user_profiles.id
//   FK(professional_profile_id) → professional_profiles.id
//
// ERROR RESPONSES (POST):
//   401 — Not authenticated
//   400 — Invalid body OR booking not completed
//   403 — Not the booking owner
//   404 — User profile or booking not found
//   409 — Already reviewed (DB unique violation)
//   500 — DB error or internal error
//
// ERROR RESPONSES (GET):
//   401 — Not authenticated
//   400 — Non-admin missing professional_profile_id param
//   500 — DB error or internal error
//
// ══════════════════════════════════════════════════════════════
