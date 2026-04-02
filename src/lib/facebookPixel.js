/** Pixel Meta par défaut — peut être remplacé via réglages boutique */
export const DEFAULT_FACEBOOK_PIXEL_ID = '1601177617317072'

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
