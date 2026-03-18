// app/api/professional/time-slots/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// ══════════════════════════════════════════════════════
// DELETE /api/professional/time-slots/[id]
// Remove a time slot — only if not currently booked
// ══════════════════════════════════════════════════════
export async function DELETE(
  req:    NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!accessToken) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()
    const { id: slotId } = await params

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // ── Step 2: Get professional_profile id ─────────────
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

    // ── Step 3: Fetch the slot ───────────────────────────
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('id, is_booked, professional_profile_id')
      .eq('id', slotId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      )
    }

    // ── Step 4: Ownership check ──────────────────────────
    if (slot.professional_profile_id !== proProfile.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this slot' },
        { status: 403 }
      )
    }

    // ── Step 5: Block deletion if slot is booked ─────────
    // Cannot delete a slot that has an active booking
    if (slot.is_booked) {
      return NextResponse.json(
        {
          error: 'Cannot delete a booked time slot. Wait for the booking to complete or be cancelled first.'
        },
        { status: 400 }
      )
    }

    // ── Step 6: Delete the slot ──────────────────────────
    const { error: deleteError } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) {
      console.error('Delete slot error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete time slot. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        slot_id: slotId,
        message: 'Time slot deleted successfully',
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in DELETE /api/professional/time-slots/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// ══════════════════════════════════════════════════════════════════════
// API ROUTE DESCRIPTION — /api/professional/time-slots/[id]
// ══════════════════════════════════════════════════════════════════════
//
// Base URL:  /api/professional/time-slots/[id]
// Auth:      Required (must be logged in as a professional)
// Param:     id — the time slot UUID (passed as a URL segment)
//
// ── DELETE /api/professional/time-slots/[id] ────────────────────────
//
//   Description:  Deletes a single time slot. Only the professional who
//                 owns the slot can delete it. Booked slots cannot be
//                 deleted — the booking must be completed or cancelled
//                 first.
//
//   Request body: None
//
//   Success response (200):
//     {
//       "success": true,
//       "slot_id": "uuid",
//       "message": "Time slot deleted successfully"
//     }
//
//   Error responses:
//     401 — Not logged in
//     400 — Slot is currently booked (cannot delete)
//     403 — Professional does not own this slot
//     404 — Professional profile or time slot not found
//     500 — Failed to delete / Internal server error
//
// ══════════════════════════════════════════════════════════════════════
