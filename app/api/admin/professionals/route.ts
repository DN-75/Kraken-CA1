// app/api/admin/professionals/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client with service role key (bypasses RLS)
// This is safe because middleware already verified the user is an admin
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_ANON_KEY!, // Service role key
  )
}

// ══════════════════════════════════════════════════════
// GET /api/admin/professionals
// Fetches all professionals with pending_approval status
// Note: Middleware already verifies admin access
// ══════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    // Middleware already validated admin access, use service role client
    const supabase = createAdminClient()

    // Fetch pending professionals
    const { data: professionals, error: fetchError } = await supabase
      .from('professional_profiles')
      .select('id, job_title, created_at, profile_id')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending professionals' },
        { status: 500 }
      )
    }

    // Fetch profile data for each professional
    const profileIds = (professionals ?? []).map(p => p.profile_id)
    
    let profilesData: { id: string; name: string; profile_photo: string | null }[] = []
    
    if (profileIds.length > 0) {
      const { data, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_photo')
        .in('id', profileIds)

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
      } else {
        profilesData = data ?? []
      }
    }

    // Create a map for quick lookup
    const profilesMap = new Map(
      profilesData.map(p => [p.id, p])
    )

    // Transform data
    const transformedData = (professionals ?? []).map((pro) => {
      const profile = profilesMap.get(pro.profile_id)
      
      return {
        id: pro.id,
        name: profile?.name ?? 'Unknown',
        title: pro.job_title ?? 'Professional',
        date: new Date(pro.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        image: profile?.profile_photo ?? null,
      }
    })

    return NextResponse.json({ data: transformedData }, { status: 200 })

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/admin/professionals:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
