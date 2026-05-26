import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️  VITE_SUPABASE_URL não configurada. Configure o .env.local antes de usar o app.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
