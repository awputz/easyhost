import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET')
  console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET')

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null for development without Supabase
    console.warn('Supabase credentials not configured. Using demo mode.')
    return null
  }

  // Note: Using untyped client for flexibility
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
