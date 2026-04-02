import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_URL
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

/** Client InsForge ; null si variables manquantes (build sans backend). */
export const insforge =
  baseUrl && anonKey ? createClient({ baseUrl, anonKey }) : null
