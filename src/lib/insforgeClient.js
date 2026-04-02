import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_URL
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

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
