export function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(price)
}

/** Normalise un numéro ivoirien pour wa.me */
export function normalizePhoneForWhatsApp(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) digits = `225${digits}`
  return digits
}
