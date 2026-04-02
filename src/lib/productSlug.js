/**
 * Slug URL pour fiches produit : 3 premiers mots du nom + id (unicité).
 * Ex. « Gel d’aloès pur stabilisé » → gel-d-aloès-pur-stabilisé-1
 */

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)
}

function firstThreeWords(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
}

/** Segment d’URL pour la route /produit/:segment */
export function productPathSegment(product) {
  if (!product) return ''
  const base = slugify(firstThreeWords(product.name))
  const id = String(product.id)
  return base ? `${base}-${id}` : id
}

/** Chemin complet (ex. /produit/gel-d-aloès-1) */
export function productPath(product) {
  const seg = productPathSegment(product)
  return seg ? `/produit/${encodeURIComponent(seg)}` : '/boutique'
}

/**
 * @param {string} segment — paramètre d’URL (sans /produit/)
 * @param {Array<object>} products
 */
export function findProductByProduitPath(segment, products) {
  if (!segment || !products?.length) return null
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    decoded = segment
  }
  const bySlug = products.find((p) => productPathSegment(p) === decoded)
  if (bySlug) return bySlug
  const byId = products.find((p) => String(p.id) === decoded)
  if (byId) return byId
  const m = decoded.match(/-(\d+)$/)
  if (m) return products.find((p) => String(p.id) === m[1]) ?? null
  return null
}
