import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Auth] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
      'Please supply valid Supabase credentials in your local environment (.env).'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

