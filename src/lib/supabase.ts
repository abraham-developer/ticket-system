import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Debug: verificar conexión WebSocket
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
  
  // Escuchar eventos del canal Realtime
  supabase.realtime.setAuth(supabaseAnonKey)
  
  console.log('✅ Supabase Realtime configurado')
  console.log('🔗 URL:', supabaseUrl)
  console.log('🔌 WebSocket URL:', supabaseUrl.replace('https://', 'wss://') + '/realtime/v1/websocket')
}