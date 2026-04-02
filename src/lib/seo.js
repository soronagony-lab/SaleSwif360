import { BRAND, DEFAULT_SITE_URL } from '@/lib/brand'

/**
 * Visuels OG / Twitter / LinkedIn / WhatsApp — fichiers dans /public/seo/
 * (partage de liens : prévisualisation riche avec l’identité Succès Solution FLP).
 */
export const SEO_OG_IMAGES = {
  /** Accueil — famille & Forever Kids */
  default: '/seo/og-default.png',
  /** Liste boutique / catalogue */
  boutique: '/seo/og-boutique.png',
  /** Page opportunité business */
  opportunity: '/seo/og-opportunity.png',
  /** Index blog & articles sans visuel dédié */
  blog: '/seo/og-blog.png',
}

/** @deprecated Utiliser SEO_OG_IMAGES.default — conservé pour imports existants */
export const FOREVER_LIVING_OG_FALLBACK = SEO_OG_IMAGES.default

/** URL canonique de prod — surcharge avec VITE_SITE_URL si défini */
export function getSiteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '')
  return DEFAULT_SITE_URL
}

/** URL absolue pour Open Graph (image locale / ou URL externe). */
export function absoluteOgUrl(base, src) {
  if (!src || typeof src !== 'string') return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const b = String(base || '').replace(/\/$/, '')
  if (src.startsWith('/')) return `${b}${src}`
  return `${b}/${src}`
}

export const SITE_DEFAULTS = {
  name: BRAND.name,
  tagline: `${BRAND.tagline} — ${BRAND.legalMention}`,
  description: BRAND.description,
  keywords: BRAND.keywords,
  locale: 'fr_CI',
  region: 'CI',
  placename: "Abidjan, Côte d'Ivoire",
}

export function setMetaByProperty(property, content) {
  if (typeof document === 'undefined' || content == null) return
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

export function setMetaByName(name, content) {
  if (typeof document === 'undefined' || content == null) return
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

export function setLinkCanonical(href) {
  if (typeof document === 'undefined' || !href) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
