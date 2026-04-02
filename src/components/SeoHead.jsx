import { useEffect } from 'react'
import { BRAND } from '@/lib/brand'
import { getArticleBySlug } from '@/data/blogArticles'
import {
  SITE_DEFAULTS,
  getSiteOrigin,
  setLinkCanonical,
  setMetaByName,
  setMetaByProperty,
} from '@/lib/seo'

const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80&auto=format'

function absImageUrl(base, src) {
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return `${base}${src}`
  return `${base}/${src}`
}

/**
 * Met à jour title + meta pour le SEO (SPA) — ciblage Côte d’Ivoire.
 * @param {string | null} blogSlug — slug article (page détail blog)
 */
export function SeoHead({ storePage, currentProduct, shopName, blogSlug }) {
  useEffect(() => {
    const blogArticle = blogSlug ? getArticleBySlug(blogSlug) : null
    const base = getSiteOrigin()
    const brand = shopName || SITE_DEFAULTS.name
    const defaultTitle = `${brand} — ${SITE_DEFAULTS.tagline}`
    const defaultDesc = SITE_DEFAULTS.description

    let title = defaultTitle
    let description = defaultDesc
    let path = '/'
    let ogImage = DEFAULT_OG_IMAGE
    let keywords = SITE_DEFAULTS.keywords

    if (blogArticle) {
      title = `${blogArticle.title} — Blog ${brand}`
      description =
        blogArticle.excerpt.length > 155
          ? `${blogArticle.excerpt.slice(0, 152)}…`
          : blogArticle.excerpt
      path = `/blog/${blogArticle.slug}`
      keywords = `${blogArticle.keywords}, blog ${brand}, Forever Living Côte d'Ivoire`
      ogImage = blogArticle.heroImage || DEFAULT_OG_IMAGE
    } else if (storePage === 'blog') {
      title = `Blog bien-être & business — ${brand}`
      description = `Articles produits Forever Living, conseils santé naturelle et opportunité de distribution en Côte d'Ivoire. ${defaultDesc.slice(0, 120)}…`
      path = '/blog'
      keywords = `${SITE_DEFAULTS.keywords}, blog MLM éthique, conseils aloès, entrepreneuriat bien-être Abidjan`
    } else if (storePage === 'catalog') {
      title = `Boutique — ${brand}`
      description = `Découvrez le catalogue produits beauté, santé et bien-être ${brand} (Forever Living Products). Commande en Côte d’Ivoire, livraison et paiement à la réception.`
      path = '/boutique'
    } else if (storePage === 'opportunity') {
      title = `Opportunité business — ${brand}`
      {
        const intro = BRAND.mlm.intro
        description =
          intro.length > 155 ? `${intro.slice(0, 152)}…` : intro
      }
      path = '/opportunite'
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
    setMetaByName('keywords', keywords)
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
  }, [storePage, currentProduct, shopName, blogSlug])

  return null
}
