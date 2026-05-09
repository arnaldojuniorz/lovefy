import { createClient } from '@supabase/supabase-js'

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl)     throw new Error('NEXT_PUBLIC_SUPABASE_URL não definida')
if (!supabaseAnonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não definida')
if (!supabaseRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida')

// Cliente público — uso no browser (sem dados sensíveis)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin — uso exclusivo no servidor com service role key
// persistSession: false evita tentativas de persistência em ambiente serverless
export const supabaseAdmin = createClient(supabaseUrl, supabaseRoleKey, {
  auth: {
    persistSession:   false,
    autoRefreshToken: false,
  },
})