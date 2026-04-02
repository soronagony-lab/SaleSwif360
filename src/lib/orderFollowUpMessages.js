import { formatPrice } from '@/lib/format'
import { PATHS } from '@/lib/storePaths'
import { getSiteOrigin } from '@/lib/seo'

/** Ordre d’affichage des onglets (modale commande) */
export const ORDER_FOLLOW_UP_CATEGORY_KEYS = [
  'usage',
  'cross_sell',
  'loyalty',
  'business',
]

/** Catégories modèles messages liés aux commandes (admin + modale commande) */
export const ORDER_FOLLOW_UP_CATEGORIES = {
  usage: {
    label: 'Comprendre le besoin',
    short: 'Besoin',
    hint: 'Pourquoi ce produit, usage, contexte familial…',
  },
  cross_sell: {
    label: 'Produits complémentaires',
    short: 'Cross-sell',
    hint: 'Suggestions basées sur le catalogue (hors produit commandé).',
  },
  loyalty: {
    label: 'Suivi & fidélisation',
    short: 'Suivi',
    hint: 'Satisfaction, livraison, autre besoin.',
  },
  business: {
    label: 'Opportunité Forever',
    short: 'Business',
    hint: 'Client mûr : présenter l’activité (lien page /opportunite).',
  },
}

export function statusLabelForMessage(status) {
  const m = {
    Nouvelle: 'en attente de traitement',
    'En cours': 'en cours de livraison',
    Livrée: 'livrée',
    Annulée: 'annulée',
  }
  return m[status] || String(status || '')
}

/**
 * Autres produits du catalogue (exclut le produit de la commande si connu).
 */
export function buildProductSuggestionsLines(products, order, max = 4) {
  const pid = order?.productId != null ? Number(order.productId) : null
  const list = (products || []).filter((p) => {
    if (pid == null || !Number.isFinite(pid)) return true
    return Number(p.id) !== pid
  })
  const pick = list.slice(0, max)
  if (pick.length === 0) return ''
  return pick.map((p) => `• ${p.name} — ${formatPrice(p.price)}`).join('\n')
}

export function buildOrderFollowUpContext(order, products, shopName) {
  const origin = getSiteOrigin()
  const lienOpportunite = origin ? `${origin}${PATHS.opportunity}` : PATHS.opportunity
  const urlBoutique = origin ? `${origin}${PATHS.catalog}` : PATHS.catalog

  const suggestions = buildProductSuggestionsLines(products, order, 4)
  const suggestionsBlock =
    suggestions ||
    `(Voir le catalogue : ${urlBoutique})`

  return {
    nom: order?.customerName || '',
    boutique: shopName || '',
    produit: order?.productName || '',
    prix: order?.price != null ? formatPrice(order.price) : '',
    statut_commande: statusLabelForMessage(order?.status),
    suggestions_produits: suggestionsBlock,
    lien_opportunite: lienOpportunite,
    url_boutique: urlBoutique,
  }
}

export function interpolateOrderFollowUp(body, ctx) {
  return String(body || '')
    .replace(/\{\{nom\}\}/g, ctx.nom || '')
    .replace(/\{\{boutique\}\}/g, ctx.boutique || '')
    .replace(/\{\{produit\}\}/g, ctx.produit || '')
    .replace(/\{\{prix\}\}/g, ctx.prix || '')
    .replace(/\{\{statut_commande\}\}/g, ctx.statut_commande || '')
    .replace(/\{\{suggestions_produits\}\}/g, ctx.suggestions_produits || '')
    .replace(/\{\{lien_opportunite\}\}/g, ctx.lien_opportunite || '')
    .replace(/\{\{url_boutique\}\}/g, ctx.url_boutique || '')
}
