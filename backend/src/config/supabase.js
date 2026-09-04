import { createClient } from '@supabase/supabase-js'

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
}

const requireSupabaseEnvironment = () => {
  const url = process.env.SUPABASE_URL?.trim()
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()

  if (!url || !publishableKey || !secretKey) {
    throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY are required')
  }

  return { url, publishableKey, secretKey }
}

export const createSupabaseClients = () => {
  if (createSupabaseClients.cache) return createSupabaseClients.cache

  const { url, publishableKey, secretKey } = requireSupabaseEnvironment()

  createSupabaseClients.cache = {
    auth: createClient(url, publishableKey, clientOptions),
    admin: createClient(url, secretKey, clientOptions),
  }

  return createSupabaseClients.cache
}
