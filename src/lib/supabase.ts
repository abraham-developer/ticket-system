import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('=== CONFIG SUPABASE ===');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey?.substring(0, 50) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    }
  }
})

if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
}

console.log('✓ Supabase inicializado');