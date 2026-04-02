import { matchPath } from 'react-router-dom'

/** Chemins vitrine — alignés sur SeoHead / partage social */
export const PATHS = {
  home: '/',
  catalog: '/boutique',
  blog: '/blog',
  opportunity: '/opportunite',
  /** Connexion réussie → tableau de bord (voir aussi adminPaths.js) */
  admin: '/admin',
  product: (id) => `/produit/${encodeURIComponent(String(id))}`,
  blogArticle: (slug) => `/blog/${encodeURIComponent(slug)}`,
}

/**
 * @param {string} pathname
 * @param {Array<{ id: string | number }>} products
 */
export function parseStoreLocation(pathname, products) {
  const raw = String(pathname || '/').replace(/\/+/g, '/')
  const path = raw.replace(/\/+$/, '') || '/'

  if (matchPath({ path: '/', end: true }, path)) {
    return {
      storePage: 'home',
      blogSlug: null,
      product: null,
      invalid: false,
    }
  }
  if (matchPath({ path: '/boutique', end: true }, path)) {
    return {
      storePage: 'catalog',
      blogSlug: null,
      product: null,
      invalid: false,
    }
  }
  if (matchPath({ path: '/blog', end: true }, path)) {
    return {
      storePage: 'blog',
      blogSlug: null,
      product: null,
      invalid: false,
    }
  }
  if (matchPath({ path: '/opportunite', end: true }, path)) {
    return {
      storePage: 'opportunity',
      blogSlug: null,
      product: null,
      invalid: false,
    }
  }

  const blogMatch = matchPath({ path: '/blog/:slug', end: true }, path)
  if (blogMatch?.params?.slug) {
    return {
      storePage: 'blogArticle',
      blogSlug: blogMatch.params.slug,
      product: null,
      invalid: false,
    }
  }

  const prodMatch = matchPath({ path: '/produit/:id', end: true }, path)
  if (prodMatch?.params?.id != null) {
    const id = prodMatch.params.id
    const product = products.find((p) => String(p.id) === String(id)) ?? null
    return {
      storePage: 'product',
      blogSlug: null,
      product,
      invalid: false,
    }
  }

  return {
    storePage: 'home',
    blogSlug: null,
    product: null,
    invalid: true,
  }
}

/** Cible « retour » depuis la fiche produit (history state) */
export function backPathForProductNav(fromPage, blogSlug) {
  switch (fromPage) {
    case 'home':
      return PATHS.home
    case 'catalog':
      return PATHS.catalog
    case 'blog':
      return PATHS.blog
    case 'opportunity':
      return PATHS.opportunity
    case 'blogArticle':
      return blogSlug ? PATHS.blogArticle(blogSlug) : PATHS.blog
    default:
      return PATHS.home
  }
}
