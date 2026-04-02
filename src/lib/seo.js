/** URL canonique de prod — surcharge avec VITE_SITE_URL si défini */
export function getSiteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '')
  return 'https://jachete.ci'
}

export const SITE_DEFAULTS = {
  name: "J'achète.ci",
  tagline: 'Paiement à la livraison en Côte d’Ivoire',
  description:
    "Boutique en ligne en Côte d’Ivoire : produits tendance, commande simple, livraison à Abidjan et partout en CI. Payez à la réception — sans carte bancaire.",
  keywords:
    "achat en ligne Côte d'Ivoire, e-commerce Abidjan, paiement à la livraison, livraison Abidjan, boutique en ligne CI, J'achète.ci, cash on delivery Côte d'Ivoire",
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
