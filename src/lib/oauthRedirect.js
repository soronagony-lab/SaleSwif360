import { ALL_ADMIN_PATHS } from '@/lib/adminPaths'
import { PATHS } from '@/lib/storePaths'

const ADMIN_PATH_SET = new Set(ALL_ADMIN_PATHS)

const STORE_EXACT_PATHS = new Set([
  PATHS.home,
  PATHS.catalog,
  PATHS.blog,
  PATHS.opportunity,
])

/**
 * URL de retour OAuth alignée sur allowed_redirect_urls InsForge.
 */
export function resolveOAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined

  const origin = window.location.origin
  const path = String(window.location.pathname || '/')
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '') || '/'

  if (ADMIN_PATH_SET.has(path)) {
    return `${origin}${path}`
  }
  if (path.startsWith('/admin')) {
    return `${origin}${PATHS.admin}`
  }
  if (STORE_EXACT_PATHS.has(path)) {
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

/** URLs à déclarer dans insforge.toml (prod + local). */
export function oauthRedirectUrlsForInsforge(siteOrigin, localOrigin = 'http://localhost:5173') {
  const paths = [
    PATHS.home,
    ...ALL_ADMIN_PATHS,
    PATHS.catalog,
    PATHS.blog,
    PATHS.opportunity,
  ]
  const uniq = [...new Set(paths)]
  return [
    ...uniq.map((p) => `${siteOrigin}${p}`),
    ...uniq.map((p) => `${localOrigin}${p}`),
  ].sort()
}
