import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBrowserSupabaseClient(): any {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Supabase 환경변수가 설정되지 않았어. (URL: ${supabaseUrl ? 'OK' : 'MISSING'}, ANON_KEY: ${supabaseAnonKey ? 'OK' : 'MISSING'})`
    )
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}
