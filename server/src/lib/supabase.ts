import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

// Admin client — dùng service role key, chỉ dùng phía server
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default supabaseAdmin
