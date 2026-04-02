import { BRAND, DEFAULT_SITE_URL } from '@/lib/brand'

/** Image Open Graph par défaut (aloès / bien-être, format 1,91:1) — si pas d’image produit */
export const FOREVER_LIVING_OG_FALLBACK =
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&h=630&fit=crop&q=85&auto=format'

/** URL canonique de prod — surcharge avec VITE_SITE_URL si défini */
export function getSiteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '')
  return DEFAULT_SITE_URL
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
