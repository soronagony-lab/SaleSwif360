import { useEffect } from 'react'
import {
  SITE_DEFAULTS,
  getSiteOrigin,
  setLinkCanonical,
  setMetaByName,
  setMetaByProperty,
} from '@/lib/seo'

const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80&auto=format'

function absImageUrl(base, src) {
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return `${base}${src}`
  return `${base}/${src}`
}

/**
 * Met à jour title + meta pour le SEO (SPA) — ciblage Côte d’Ivoire.
 */
export function SeoHead({ storePage, currentProduct, shopName }) {
  useEffect(() => {
    const base = getSiteOrigin()
    const brand = shopName || SITE_DEFAULTS.name
    const defaultTitle = `${brand} — ${SITE_DEFAULTS.tagline}`
    const defaultDesc = SITE_DEFAULTS.description

    let title = defaultTitle
    let description = defaultDesc
    let path = '/'
    let ogImage = DEFAULT_OG_IMAGE

    if (storePage === 'catalog') {
      title = `Catalogue — ${brand}`
      description = `Découvrez tout le catalogue ${brand} : achat en ligne en Côte d’Ivoire, livraison et paiement à la réception.`
      path = '/catalogue'
    } else if (storePage === 'product' && currentProduct) {
      const snippet =
        currentProduct.description ||
        currentProduct.detailedDescription ||
        defaultDesc
      title = `${currentProduct.name} — ${brand}`
      description =
        String(snippet).slice(0, 155) +
        (String(snippet).length > 155 ? '…' : '')
      path = `/produit/${encodeURIComponent(String(currentProduct.id))}`
      const firstImg = currentProduct.images?.[0]
      ogImage = absImageUrl(base, firstImg) || DEFAULT_OG_IMAGE
    }

    document.title = title
    setMetaByName('description', description)
    setMetaByName('keywords', SITE_DEFAULTS.keywords)
    setMetaByName('geo.region', SITE_DEFAULTS.region)
    setMetaByName('geo.placename', SITE_DEFAULTS.placename)
    const gsv = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
    if (gsv) setMetaByName('google-site-verification', gsv)

    setMetaByProperty('og:type', 'website')
    setMetaByProperty('og:locale', SITE_DEFAULTS.locale)
    setMetaByProperty('og:site_name', brand)
    setMetaByProperty('og:title', title)
    setMetaByProperty('og:description', description)
    setMetaByProperty('og:url', `${base}${path}`)
    setMetaByProperty('og:image', ogImage)
    setMetaByProperty('og:image:alt', title)

    setMetaByName('twitter:card', 'summary_large_image')
    setMetaByName('twitter:title', title)
    setMetaByName('twitter:description', description)
    setMetaByName('twitter:image', ogImage)

    setLinkCanonical(`${base}${path}`)
  }, [storePage, currentProduct, shopName])

  return null
}
