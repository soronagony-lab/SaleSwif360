import { useEffect } from 'react'
import { BRAND } from '@/lib/brand'
import { getArticleBySlug } from '@/data/blogArticles'
import { productPath } from '@/lib/productSlug'
import {
  FOREVER_LIVING_OG_FALLBACK,
  SITE_DEFAULTS,
  getSiteOrigin,
  setLinkCanonical,
  setMetaByName,
  setMetaByProperty,
} from '@/lib/seo'

const DEFAULT_OG_IMAGE = FOREVER_LIVING_OG_FALLBACK

function absImageUrl(base, src) {
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return `${base}${src}`
  return `${base}/${src}`
}

const JSON_LD_PRODUCT_ID = 'seo-jsonld-product'

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
    let ogType = 'website'

    ;['product:price:amount', 'product:price:currency'].forEach((p) => {
      document.querySelector(`meta[property="${p}"]`)?.remove()
    })

    if (blogArticle) {
      title = `${blogArticle.title} — Blog ${brand}`
      description =
        blogArticle.excerpt.length > 155
          ? `${blogArticle.excerpt.slice(0, 152)}…`
          : blogArticle.excerpt
      path = `/blog/${blogArticle.slug}`
      keywords = `${blogArticle.keywords}, blog ${brand}, Forever Living Côte d'Ivoire`
      ogImage = blogArticle.heroImage || FOREVER_LIVING_OG_FALLBACK
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
      path = productPath(currentProduct)
      const firstImg = currentProduct.images?.[0]
      ogImage = absImageUrl(base, firstImg) || FOREVER_LIVING_OG_FALLBACK
      ogType = 'product'
      keywords = `${currentProduct.name}, Forever Living Products, ${SITE_DEFAULTS.keywords}, achat Côte d'Ivoire`
    }

    document.title = title
    setMetaByName('description', description)
    setMetaByName('keywords', keywords)
    setMetaByName('geo.region', SITE_DEFAULTS.region)
    setMetaByName('geo.placename', SITE_DEFAULTS.placename)
    const gsv = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
    if (gsv) setMetaByName('google-site-verification', gsv)

    setMetaByProperty('og:type', ogType)
    setMetaByProperty('og:locale', SITE_DEFAULTS.locale)
    setMetaByProperty('og:site_name', brand)
    setMetaByProperty('og:title', title)
    setMetaByProperty('og:description', description)
    setMetaByProperty('og:url', `${base}${path}`)
    setMetaByProperty('og:image', ogImage)
    setMetaByProperty('og:image:alt', title)
    setMetaByProperty('og:image:width', '1200')
    setMetaByProperty('og:image:height', '630')
    if (ogImage.startsWith('https://')) {
      setMetaByProperty('og:image:secure_url', ogImage)
    }

    if (storePage === 'product' && currentProduct) {
      const price = Number(currentProduct.price) || 0
      setMetaByProperty('product:price:amount', String(price))
      setMetaByProperty('product:price:currency', 'XOF')
    }

    setMetaByName('twitter:card', 'summary_large_image')
    setMetaByName('twitter:title', title)
    setMetaByName('twitter:description', description)
    setMetaByName('twitter:image', ogImage)

    setLinkCanonical(`${base}${path}`)
  }, [storePage, currentProduct, shopName, blogSlug])

  useEffect(() => {
    const existing = document.getElementById(JSON_LD_PRODUCT_ID)
    if (existing) existing.remove()

    if (storePage !== 'product' || !currentProduct) return

    const base = getSiteOrigin()
    const script = document.createElement('script')
    script.id = JSON_LD_PRODUCT_ID
    script.type = 'application/ld+json'
    const firstImg = currentProduct.images?.[0]
    const imageUrl =
      absImageUrl(base, firstImg) || FOREVER_LIVING_OG_FALLBACK
    const desc =
      currentProduct.detailedDescription ||
      currentProduct.description ||
      SITE_DEFAULTS.description
    const inStock = (currentProduct.stock || 0) > 0

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: currentProduct.name,
      description: String(desc).slice(0, 5000),
      image: imageUrl,
      sku: String(currentProduct.id),
      brand: {
        '@type': 'Brand',
        name: BRAND.name,
      },
      offers: {
        '@type': 'Offer',
        url: `${base}${productPath(currentProduct)}`,
        priceCurrency: 'XOF',
        price: String(Number(currentProduct.price) || 0),
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString().slice(0, 10),
        seller: {
          '@type': 'Organization',
          name: shopName || BRAND.name,
        },
      },
    })

    document.head.appendChild(script)
    return () => {
      document.getElementById(JSON_LD_PRODUCT_ID)?.remove()
    }
  }, [storePage, currentProduct, shopName])

  return null
}
