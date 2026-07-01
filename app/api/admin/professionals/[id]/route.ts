// app/api/admin/professionals/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

// ── Validation Schema ───────────────────────────────────
const updateStatusSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    message: "Action must be 'approve' or 'reject'",
  }),
})

// Create admin Supabase client with service role key (bypasses RLS)
// This is safe because middleware already verified the user is an admin
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_ANON_KEY!, // Service role key
  )
}

// ══════════════════════════════════════════════════════
// GET /api/admin/professionals/[id]
// Fetches a single professional's full profile for admin review
// Note: Middleware already verifies admin access
// ══════════════════════════════════════════════════════
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: professionalProfileId } = await params

    // Middleware already validated admin access, use service role client
    const supabase = createAdminClient()

    // Fetch professional profile
    const { data: proData, error: fetchError } = await supabase
      .from('professional_profiles')
      .select(`
        id,
        job_title,
        job,
        field,
        national_id,
        phone_number,
        university,
        degree,
        portfolio,
        linkedin,
        instagram,
        facebook,
        status,
        created_at,
        profile_id,
        verify_time_id
      `)
      .eq('id', professionalProfileId)
      .single()

    if (fetchError || !proData) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // Fetch profile data separately (name, photo, bio, timezone)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('name, profile_photo, bio, time_zone')
      .eq('id', proData.profile_id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    // Fetch skills separately
    const { data: skillsData, error: skillsError } = await supabase
      .from('professional_skills')
      .select('skill, skill_other_label')
      .eq('professional_profile_id', professionalProfileId)

    if (skillsError) {
      console.error('Skills fetch error:', skillsError)
    }

    // Fetch verify time slot if exists
    let verifyTimeSlot: string | null = null
    if (proData.verify_time_id) {
      const { data: verifyTimeData } = await supabase
        .from('verify_time_options')
        .select('label')
        .eq('id', proData.verify_time_id)
        .single()
      
      verifyTimeSlot = verifyTimeData?.label ?? null
    }

    const skills = (skillsData ?? []).map((s: { skill: string; skill_other_label: string | null }) => 
      s.skill_other_label ?? s.skill
    )

    const responseData = {
      id: proData.id,
      name: profileData?.name ?? 'Unknown',
      profile_photo: profileData?.profile_photo ?? null,
      bio: profileData?.bio ?? null,
      time_zone: profileData?.time_zone ?? 'UTC',
      job_title: proData.job_title,
      job: proData.job,
      field: proData.field,
      national_id: proData.national_id,
      phone_number: proData.phone_number,
      university: proData.university,
      degree: proData.degree,
      portfolio: proData.portfolio,
      linkedin: proData.linkedin,
      instagram: proData.instagram,
      facebook: proData.facebook,
      status: proData.status,
      created_at: proData.created_at,
      skills,
      verify_time_slot: verifyTimeSlot,
    }

    return NextResponse.json({ data: responseData }, { status: 200 })

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/admin/professionals/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════
// PATCH /api/admin/professionals/[id]
// Admin approves or rejects a professional
// Note: Middleware already verifies admin access
// ══════════════════════════════════════════════════════
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: professionalProfileId } = await params

    // Middleware already validated admin access, use service role client
    const supabase = createAdminClient()

    // Validate request body
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

    // Fetch professional profile
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

    // Check current status
    if (professional.status !== 'pending_approval') {
      return NextResponse.json(
        { error: `This professional has already been ${professional.status}` },
        { status: 400 }
      )
    }

    // Update status
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

    // Get professional's name and email
    const { data: profileData } = await supabase
      .from('profiles_with_email')
      .select('name, email')
      .eq('id', professional.profile_id)
      .single()

    const recipientEmail = profileData?.email
    const professionalName = profileData?.name ?? 'Professional'

    // Send email via Resend
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

    // Log email in email_logs
    if (recipientEmail) {
      await supabase.from('email_logs').insert({
        recipient:  recipientEmail,
        subject:    emailSubject,
        body:       emailBody,
        related_id: professionalProfileId,
        type:       action === 'approve' ? 'pro_approved' : 'pro_rejected',
      })
    }

    // Return success
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
