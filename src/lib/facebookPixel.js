/** Pixel Meta par défaut — peut être remplacé via réglages boutique */
export const DEFAULT_FACEBOOK_PIXEL_ID = '1601177617317072'

/**
 * ISO 4217 pour les événements avec valeur (Meta).
 * Défaut XOF (Franc CFA) — Côte d’Ivoire. Pour USD : VITE_META_PIXEL_CURRENCY=USD
 * et des prix exprimés dans cette devise (ou adapter la conversion).
 */
const META_PIXEL_CURRENCY = String(
  import.meta.env.VITE_META_PIXEL_CURRENCY || 'XOF'
)
  .trim()
  .toUpperCase() || 'XOF'

/** Valeur numérique pour fbq : entiers pour XOF, 2 décimales pour USD/EUR */
function pixelMonetaryValue(amount) {
  const n = Number(amount) || 0
  if (META_PIXEL_CURRENCY === 'XOF' || META_PIXEL_CURRENCY === 'CLP' || META_PIXEL_CURRENCY === 'JPY') {
    return Math.round(n)
  }
  return Math.round(n * 100) / 100
}

const FB_SCRIPT = 'https://connect.facebook.net/en_US/fbevents.js'

let loadPromise = null

function getFbq() {
  return typeof window !== 'undefined' ? window.fbq : undefined
}

/**
 * Extrait un ID pixel numérique (15–16 chiffres) depuis la saisie admin.
 */
export function resolvePixelId(fromSettings) {
  const raw = String(fromSettings ?? '')
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 15 && digits.length <= 16) return digits
  if (digits.length > 0) return digits
  return DEFAULT_FACEBOOK_PIXEL_ID
}

/** Attend que le script Meta ait défini fbq (évite course si le tag existe déjà dans le DOM). */
function waitForFbq(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const tick = () => {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        resolve(true)
        return
      }
      if (Date.now() - t0 >= timeoutMs) {
        resolve(false)
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

function injectScript() {
  if (typeof document === 'undefined') {
    return Promise.resolve(false)
  }

  const existing = document.querySelector(`script[src="${FB_SCRIPT}"]`)
  if (existing) {
    return waitForFbq(8000)
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.src = FB_SCRIPT
    s.onload = () => {
      waitForFbq(8000).then(resolve)
    }
    s.onerror = () => reject(new Error('Facebook Pixel script failed'))
    document.head.appendChild(s)
  })
}

/**
 * Initialise fbq(init) pour l’ID donné. Ré-appelle init si l’ID change (réglages admin).
 */
export async function initFacebookPixel(pixelId) {
  if (typeof window === 'undefined' || !pixelId) return

  if (!loadPromise) {
    loadPromise = injectScript().catch(() => {
      loadPromise = null
      return false
    })
  }

  const ready = await loadPromise
  if (!ready) return

  if (typeof window.fbq !== 'function') return

  const prev = window._fbPixelId
  if (prev !== pixelId) {
    window.fbq('init', pixelId)
    window._fbPixelId = pixelId
  }
}

export function trackPageView() {
  const fbq = getFbq()
  if (!fbq) return
  fbq('track', 'PageView')
}

/** Fiche produit */
export function trackViewContent(product) {
  const fbq = getFbq()
  if (!fbq || !product) return
  const id = String(product.id)
  const value = pixelMonetaryValue(product.price)
  fbq('track', 'ViewContent', {
    value,
    currency: META_PIXEL_CURRENCY,
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
  })
}

/** Ouverture du tunnel commande (modal) */
export function trackInitiateCheckout(product) {
  const fbq = getFbq()
  if (!fbq || !product) return
  const id = String(product.id)
  const value = pixelMonetaryValue(product.price)
  fbq('track', 'InitiateCheckout', {
    value,
    currency: META_PIXEL_CURRENCY,
    content_ids: [id],
    content_type: 'product',
    num_items: 1,
  })
}

/** Clic « Commander maintenant » — événement personnalisé (complète InitiateCheckout) */
export function trackCommanderMaintenant(product) {
  const fbq = getFbq()
  if (!fbq || !product) return
  const id = String(product.id)
  const value = pixelMonetaryValue(product.price)
  fbq('trackCustom', 'CommanderMaintenant', {
    value,
    currency: META_PIXEL_CURRENCY,
    content_ids: [id],
    content_name: product.name,
  })
}

/** Clic « Valider ma commande » — infos livraison (COD) */
export function trackAddPaymentInfo(product) {
  const fbq = getFbq()
  if (!fbq || !product) return
  const id = String(product.id)
  const value = pixelMonetaryValue(product.price)
  fbq('track', 'AddPaymentInfo', {
    value,
    currency: META_PIXEL_CURRENCY,
    content_ids: [id],
    content_type: 'product',
    num_items: 1,
  })
}

/** Clic « Retourner à la boutique » après confirmation (achat enregistré) */
export function trackRetourBoutiqueApresAchat({ orderId, productId, value }) {
  const fbq = getFbq()
  if (!fbq) return
  fbq('trackCustom', 'RetourBoutiqueApresAchat', {
    order_id: orderId != null ? String(orderId) : '',
    content_ids: productId != null ? [String(productId)] : [],
    value: pixelMonetaryValue(value),
    currency: META_PIXEL_CURRENCY,
  })
}

/** Commande validée côté client (COD) — eventID pour CAPI / dédup */
export function trackPurchase(payload) {
  const fbq = getFbq()
  if (!fbq || !payload) return
  const pid = String(payload.productId ?? '')
  const value = pixelMonetaryValue(payload.price)
  const params = {
    value,
    currency: META_PIXEL_CURRENCY,
    content_ids: pid ? [pid] : [],
    content_type: 'product',
    content_name: payload.productName,
    num_items: 1,
  }
  const options =
    payload.id != null ? { eventID: `purchase_${payload.id}` } : undefined
  if (options) fbq('track', 'Purchase', params, options)
  else fbq('track', 'Purchase', params)
}
