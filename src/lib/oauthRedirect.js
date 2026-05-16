import { PATHS } from '@/lib/storePaths'

/** Chemins exacts autorisés côté InsForge (insforge.toml). */
const ALLOWED_EXACT_PATHS = new Set([
  PATHS.home,
  PATHS.admin,
  PATHS.catalog,
  PATHS.blog,
  PATHS.opportunity,
])

/**
 * URL de retour OAuth alignée sur allowed_redirect_urls InsForge.
 * Les routes dynamiques (/produit/…, /blog/…) renvoient vers une page liste autorisée.
 */
export function resolveOAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined

  const origin = window.location.origin
  const path = String(window.location.pathname || '/')
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '') || '/'

  if (ALLOWED_EXACT_PATHS.has(path) || path.startsWith('/admin')) {
    return `${origin}${path}`
  }
  if (path.startsWith('/produit/')) {
    return `${origin}${PATHS.catalog}`
  }
  if (path.startsWith('/blog/')) {
    return `${origin}${PATHS.blog}`
  }
  return `${origin}${PATHS.home}`
}
