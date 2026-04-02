/**
 * Liste des e-mails autorisés à l’admin (insensible à la casse).
 * Définir VITE_ADMIN_EMAILS sur Vercel : "admin@domaine.ci,autre@mail.com"
 */
export function parseAdminEmails() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false
  const list = parseAdminEmails()
  if (list.length === 0) return false
  return list.includes(email.trim().toLowerCase())
}
