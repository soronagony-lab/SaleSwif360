/** Pixel Meta par défaut — peut être remplacé via réglages boutique */
export const DEFAULT_FACEBOOK_PIXEL_ID = '1601177617317072'

const FB_SCRIPT = 'https://connect.facebook.net/en_US/fbevents.js'

let loadPromise = null

function getFbq() {
  return typeof window !== 'undefined' ? window.fbq : undefined
}

export function resolvePixelId(fromSettings) {
  const raw = typeof fromSettings === 'string' ? fromSettings.trim() : ''
  return raw || DEFAULT_FACEBOOK_PIXEL_ID
}

function injectScript() {
  if (typeof document === 'undefined') return Promise.resolve()
  if (document.querySelector(`script[src="${FB_SCRIPT}"]`)) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.src = FB_SCRIPT
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Facebook Pixel script failed'))
    document.head.appendChild(s)
  })
}

/**
 * Initialise fbq une fois (init + premier PageView).
 * @param {string} pixelId
 */
export async function initFacebookPixel(pixelId) {
  if (typeof window === 'undefined' || !pixelId) return

  if (!loadPromise) {
    loadPromise = injectScript().catch(() => {
      loadPromise = null
    })
  }
  await loadPromise

  if (!window.fbq) return

  if (!window._fbPixelInitialized) {
    window.fbq('init', pixelId)
    window._fbPixelInitialized = true
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
  const value = Number(product.price) || 0
  fbq('track', 'ViewContent', {
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
    value,
    currency: 'XOF',
  })
}

/** Ouverture du tunnel commande (modal) */
export function trackInitiateCheckout(product) {
  const fbq = getFbq()
  if (!fbq || !product) return
  const id = String(product.id)
  const value = Number(product.price) || 0
  fbq('track', 'InitiateCheckout', {
    content_ids: [id],
    content_type: 'product',
    value,
    currency: 'XOF',
    num_items: 1,
  })
}

/** Commande validée côté client (COD) — eventID pour CAPI / dédup */
export function trackPurchase(payload) {
  const fbq = getFbq()
  if (!fbq || !payload) return
  const pid = String(payload.productId ?? '')
  const value = Number(payload.price) || 0
  const params = {
    content_ids: pid ? [pid] : [],
    content_type: 'product',
    content_name: payload.productName,
    value,
    currency: 'XOF',
    num_items: 1,
  }
  const options =
    payload.id != null ? { eventID: `purchase_${payload.id}` } : undefined
  if (options) fbq('track', 'Purchase', params, options)
  else fbq('track', 'Purchase', params)
}
