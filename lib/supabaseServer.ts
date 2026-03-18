import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PRIVATE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey)

export function createSupabaseServerClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  })
}
