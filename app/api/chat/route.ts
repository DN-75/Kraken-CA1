import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_ANON_KEY!
)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// ── Fetch all approved professionals ────────────────────────────────
async function fetchProfessionals() {
  // Step 1: get all approved professional_profiles
  const { data: profData, error: profError } = await supabase
    .from('professional_profiles')
    .select('id, field, job_title, job, university, degree, price_per_hour, profile_id')
    .eq('status', 'approved')

  if (profError) {
    console.error('[Chat API] professional_profiles error:', profError)
    return []
  }
  if (!profData || profData.length === 0) return []

  const profileIds = profData.map(p => p.profile_id)

  // Step 2: get matching profiles (name, bio, photo)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, bio, profile_photo')
    .in('id', profileIds)

  if (profileError) {
    console.error('[Chat API] profiles error:', profileError)
  }

  const profileMap = new Map((profileData ?? []).map(p => [p.id, p]))

  // Step 3: get skills for each professional
  const profIds = profData.map(p => p.id)
  const { data: skillsData, error: skillsError } = await supabase
    .from('professional_skills')
    .select('professional_profile_id, skill, skill_other_label')
    .in('professional_profile_id', profIds)

  if (skillsError) {
    console.error('[Chat API] professional_skills error:', skillsError)
  }

  // Group skills by professional_profile_id
  const skillsMap = new Map<string, string[]>()
  for (const s of (skillsData ?? [])) {
    const label = s.skill === 'Other' ? (s.skill_other_label ?? 'Other') : s.skill
    if (!skillsMap.has(s.professional_profile_id)) {
      skillsMap.set(s.professional_profile_id, [])
    }
    skillsMap.get(s.professional_profile_id)!.push(label)
  }

  // Step 4: assemble
  return profData.map(p => {
    const profile = profileMap.get(p.profile_id)
    return {
      professional_profile_id: p.id,
      profile_id: p.profile_id,
      name: profile?.name ?? 'Unknown',
      bio: profile?.bio ?? '',
      field: p.field ?? '',
      job_title: p.job_title ?? '',
      job: p.job ?? '',
      university: p.university ?? '',
      degree: p.degree ?? '',
      price_per_hour: p.price_per_hour ?? 0,
      skills: skillsMap.get(p.id) ?? [],
    }
  })
}

// ── Build system prompt ─────────────────────────────────────────────
function buildSystemPrompt(professionals: Awaited<ReturnType<typeof fetchProfessionals>>) {
  const proList = professionals.length > 0
    ? professionals.map((p, i) =>
      `[${i + 1}] Name: ${p.name}
   Field: ${p.field}
   Job Title: ${p.job_title}
   Skills: ${p.skills.join(', ') || 'General'}
   Bio: ${p.bio || 'No bio available'}
   Price: $${p.price_per_hour}/hr
   Profile URL: /professional/${p.profile_id}`
    ).join('\n\n')
    : 'No approved professionals are available yet.'

  return `You are a friendly AI assistant for ExpertConnect — a platform where users book 1-on-1 mentoring sessions with verified professionals.

Your job:
1. Understand what the user wants to learn, improve, or achieve
2. Recommend the most relevant professionals from the list below
3. Explain briefly WHY each match fits their need
4. End with a clear call-to-action and the booking link

Rules:
- Only recommend professionals from the list below. Do NOT invent people.
- If no one matches well, say so honestly and suggest browsing at /browse
- Keep responses concise and warm — max 3 recommendations
- Format booking links as: [Book a session with NAME](/professional/PROFILE_URL)
- Respond naturally to greetings or off-topic questions as a helpful ExpertConnect assistant
- Match the user's language

Available Professionals:
${proList}`
}

// ── POST handler ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: Array<{ role: string; content: string }> = body.messages ?? []

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const professionals = await fetchProfessionals()
    console.log(`[Chat API] Found ${professionals.length} approved professionals`)

    const systemPrompt = buildSystemPrompt(professionals)
    const latestUserMessage = messages[messages.length - 1]?.content ?? ''

    // Build history for Gemini (all messages except the last one)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }))

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      history,
    })

    const response = await chat.sendMessage({ message: latestUserMessage })
    const text = response.text ?? ''

    if (!text) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    return NextResponse.json({ reply: text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Chat API] Error:', message)

    // Quota / billing error — give a friendly message
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
      return NextResponse.json(
        { error: '⏳ The AI is temporarily rate-limited. Please wait a moment and try again, or browse our mentors directly at /browse' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    )
  }
}
