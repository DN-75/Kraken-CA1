// app/api/admin/professionals/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Validation Schema ───────────────────────────────────
const updateStatusSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    message: "Action must be 'approve' or 'reject'",
  }),
})

// ── Helper: Verify caller is admin ──────────────────────
async function verifyAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin'
}

// ══════════════════════════════════════════════════════
// PATCH /api/admin/professionals/[id]
// Admin approves or rejects a professional
// ══════════════════════════════════════════════════════
export async function PATCH(
  req:     NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: professionalProfileId } = await params

    // ── Step 1: Verify authentication ───────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Step 2: Verify caller is admin ──────────────────
    const admin = await verifyAdmin(user.id)

    if (!admin) {
      return NextResponse.json(
        { error: 'Only admins can approve or reject professionals' },
        { status: 403 }
      )
    }

    // ── Step 3: Validate request body ───────────────────
    const body = await req.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // ── Step 4: Fetch professional profile ──────────────
    const { data: professional, error: fetchError } = await supabase
      .from('professional_profiles')
      .select('id, status, job_title, profile_id')
      .eq('id', professionalProfileId)
      .single()

    if (fetchError || !professional) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Check current status ────────────────────
    if (professional.status !== 'pending_approval') {
      return NextResponse.json(
        { error: `This professional has already been ${professional.status}` },
        { status: 400 }
      )
    }

    // ── Step 6: Update status ───────────────────────────
    const { error: updateError } = await supabase
      .from('professional_profiles')
      .update({ status: newStatus })
      .eq('id', professionalProfileId)

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update professional status' },
        { status: 500 }
      )
    }

    // ── Step 7: Get professional's name and email ───────
    const { data: profileData } = await supabase
      .from('profiles_with_email')
      .select('name, email')
      .eq('id', professional.profile_id)
      .single()

    const recipientEmail = profileData?.email
    const professionalName = profileData?.name ?? 'Professional'

    // ── Step 8: Send email via Resend ───────────────────
    const emailSubject = action === 'approve'
      ? 'ExpertConnect — Your Account Has Been Approved!'
      : 'ExpertConnect — Account Application Update'

    const emailBody = action === 'approve'
      ? `Hi ${professionalName},\n\nGreat news! Your professional account on ExpertConnect has been approved.\n\nYou can now log in and start setting up your time slots to receive booking requests.\n\nWelcome aboard!\n— The ExpertConnect Team`
      : `Hi ${professionalName},\n\nThank you for your interest in joining ExpertConnect as a professional.\n\nAfter reviewing your application, we are unable to approve your account at this time.\n\nIf you believe this was a mistake or would like more information, please reach out to our support team.\n\n— The ExpertConnect Team`

    let emailSent = false

    if (recipientEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'ExpertConnect <noreply@expertconnect.com>',
          to:   recipientEmail,
          subject: emailSubject,
          text:    emailBody,
        })
        emailSent = true
      } catch (emailErr) {
        // Email failure should not block the status update
        console.error('Resend email error:', emailErr)
      }
    }

    // ── Step 9: Log email in email_logs ─────────────────
    if (recipientEmail) {
      await supabase.from('email_logs').insert({
        recipient:  recipientEmail,
        subject:    emailSubject,
        body:       emailBody,
        related_id: professionalProfileId,
        type:       action === 'approve' ? 'pro_approved' : 'pro_rejected',
      })
    }

    // ── Step 10: Return success ─────────────────────────
    return NextResponse.json(
      {
        success:         true,
        professional_id: professionalProfileId,
        status:          newStatus,
        email_sent:      emailSent,
        message:         `Professional ${newStatus} successfully`,
      },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('Unexpected error in PATCH /api/admin/professionals/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// END-TO-END FLOW: Admin Approves / Rejects a Professional
// ══════════════════════════════════════════════════════════════
//
// ROUTE:   PATCH /api/admin/professionals/[id]
// BODY:    { action: "approve" | "reject" }
// CALLER:  Admin only (role = 'admin' in profiles table)
//
// ┌─────────────────────────────────────────────────────────┐
// │  FRONTEND (Admin Dashboard)                             │
// │                                                         │
// │  1. Admin logs in → middleware redirects to /admin       │
// │  2. Admin page fetches pending professionals:           │
// │     GET professional_profiles WHERE status =            │
// │     'pending_approval'                                  │
// │  3. Admin clicks "Approve" or "Reject" on a card        │
// │  4. Frontend calls:                                     │
// │     fetch('/api/admin/professionals/{id}', {             │
// │       method: 'PATCH',                                  │
// │       body: JSON.stringify({ action: 'approve' })       │
// │     })                                                  │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  THIS API ROUTE                                         │
// │                                                         │
// │  Step 1:  Auth check → supabase.auth.getUser()          │
// │           └─ 401 if not logged in                       │
// │                                                         │
// │  Step 2:  Admin check → profiles.role === 'admin'       │
// │           └─ 403 if not admin                           │
// │                                                         │
// │  Step 3:  Zod validates { action: 'approve'|'reject' }  │
// │           └─ 400 if invalid                             │
// │                                                         │
// │  Step 4:  Fetch professional_profiles by [id]           │
// │           Selects: id, status, job_title, profile_id    │
// │           └─ 404 if not found                           │
// │                                                         │
// │  Step 5:  Guard: status must be 'pending_approval'      │
// │           └─ 400 if already approved/rejected           │
// │                                                         │
// │  Step 6:  UPDATE professional_profiles                  │
// │           SET status = 'approved' | 'rejected'          │
// │           └─ 500 if DB error                            │
// │                                                         │
// │  Step 7:  Get name + email from profiles_with_email     │
// │           (view joining profiles ↔ auth.users)          │
// │                                                         │
// │  Step 8:  Send email via Resend                         │
// │           ├─ Approve → "Your Account Has Been Approved" │
// │           └─ Reject  → "Account Application Update"    │
// │           (failure is non-blocking, logged to console)  │
// │                                                         │
// │  Step 9:  INSERT into email_logs                        │
// │           type = 'pro_approved' | 'pro_rejected'        │
// │           related_id = professional_profile.id          │
// │                                                         │
// │  Step 10: Return 200                                    │
// │           { success, professional_id, status,           │
// │             email_sent, message }                       │
// └────────────────────────┬────────────────────────────────┘
//                          │
//                          ▼
// ┌─────────────────────────────────────────────────────────┐
// │  DATABASE TABLES AFFECTED                               │
// │                                                         │
// │  READ:   profiles          → verify admin role          │
// │  READ:   professional_profiles → fetch current status   │
// │  READ:   profiles_with_email   → get name + email       │
// │  WRITE:  professional_profiles → update status          │
// │  WRITE:  email_logs            → log sent email         │
// └─────────────────────────────────────────────────────────┘
//
// ENV VARIABLES REQUIRED:
//   RESEND_API_KEY       — Resend API key (re_xxxxxxxxx)
//   RESEND_FROM_EMAIL    — Sender address (e.g. "ExpertConnect <noreply@yourdomain.com>")
//
// ERROR RESPONSES:
//   401 — Not authenticated
//   403 — Not an admin
//   400 — Invalid action OR professional already approved/rejected
//   404 — Professional profile not found
//   500 — DB write failure or internal error
//
// ══════════════════════════════════════════════════════════════
