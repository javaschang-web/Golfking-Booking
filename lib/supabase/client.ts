import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

let browserClient: any = null

export function getBrowserSupabaseClient(): any {
  if (browserClient) return browserClient

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  browserClient = createClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}
