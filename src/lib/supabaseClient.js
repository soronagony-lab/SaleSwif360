import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Client Supabase optionnel. Sans variables d'environnement, retourne null
 * et l'app utilise uniquement le state + localStorage.
 */
export function getSupabase() {
  if (!url || !key) return null
  return createClient(url, key)
}
