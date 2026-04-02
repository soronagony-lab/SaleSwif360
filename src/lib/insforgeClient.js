import { createClient } from '@insforge/sdk'

/** Lit une variable Vite, sans espaces parasites (copier-coller Vercel / .env). */
function readEnv(key) {
  const v = import.meta.env[key]
  if (v == null || typeof v !== 'string') return ''
  return v.trim()
}

const baseUrlRaw = readEnv('VITE_INSFORGE_URL').replace(/\/+$/, '')
const anonKeyRaw = readEnv('VITE_INSFORGE_ANON_KEY').replace(/^Bearer\s+/i, '')

const baseUrl = baseUrlRaw
const anonKey = anonKeyRaw

const configured = Boolean(baseUrl && anonKey)

/**
 * Auth, admin, OAuth — session utilisateur possible (JWT).
 */
export const insforge = configured ? createClient({ baseUrl, anonKey }) : null

/**
 * Catalogue / commandes / réglages boutique : **instance séparée**, uniquement la clé
 * anonyme. Le SDK PostgREST envoie sinon le JWT utilisateur en priorité, ce qui
 * provoque « Invalid token » si la session admin est expirée alors que la vitrine
 * doit rester accessible.
 */
export const insforgeShop = configured ? createClient({ baseUrl, anonKey }) : null
