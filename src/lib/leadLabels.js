import { normalizePhoneForWhatsApp } from '@/lib/format'

export const LEAD_GOAL_LABELS = {
  revenus_complementaires: 'Revenus complémentaires',
  remplacer_salaire: 'Remplacer ou compléter un salaire',
  entrepreneuriat: 'Projet entrepreneurial',
  decouverte: 'Découverte / information',
}

export const LEAD_EXP_LABELS = {
  debutant: 'Débutant',
  vente_en_ligne: 'Vente en ligne / réseau',
  experimente: 'Expérimenté vente directe',
}

export function leadWhatsAppHref(lead, shopName) {
  const phone = normalizePhoneForWhatsApp(lead.phone)
  const goal = LEAD_GOAL_LABELS[lead.goal] || lead.goal || '—'
  const msg = `Bonjour ${lead.fullName},\n\nMerci pour votre demande sur *${shopName}* (opportunité business).\nObjectif indiqué : ${goal}.\nJe reviens vers vous très vite.\n\n— ${shopName}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

export function leadMailtoHref(lead, shopName) {
  const subject = encodeURIComponent(`${shopName} — Opportunité business`)
  const body = encodeURIComponent(
    `Bonjour ${lead.fullName},\n\nMerci pour votre intérêt.\n\n---\nTél. : ${lead.phone}\nE-mail : ${lead.email || '—'}\nVille : ${lead.city || '—'}\nObjectif : ${LEAD_GOAL_LABELS[lead.goal] || lead.goal || '—'}\nExpérience : ${LEAD_EXP_LABELS[lead.experience] || lead.experience || '—'}\nMessage : ${lead.message || '—'}\n`
  )
  if (lead.email && String(lead.email).includes('@')) {
    return `mailto:${lead.email}?subject=${subject}&body=${body}`
  }
  return `mailto:?subject=${subject}&body=${body}`
}

export const LEAD_STATUS_OPTIONS = ['Nouveau', 'Contacté', 'Qualifié', 'Archivé']
