/**
 * Remplace l’ancienne marque « J'achète.ci » (variantes) par Succès Solution FLP.
 * Utilisé pour les réglages boutique, modèles WhatsApp et e-mails.
 */

import { BRAND } from './brand.js'

/** Apostrophe classique ou typographique */
const AP = "['\u2019]"

/**
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function replaceLegacyBrandInText(text) {
  if (text == null || typeof text !== 'string') return ''
  let s = text
  // Ordre : motifs les plus longs / avec astérisques d’abord (WhatsApp)
  s = s.replace(new RegExp(`\\*J${AP}ach[eè]te\\.ci\\*`, 'gi'), '*Succès Solution FLP*')
  s = s.replace(/\*jachete\.ci\*/gi, '*Succès Solution FLP*')
  s = s.replace(new RegExp(`J${AP}ach[eè]te\\.ci`, 'gi'), 'Succès Solution FLP')
  s = s.replace(/jachete\.ci/gi, 'Succès Solution FLP')
  return s
}

/**
 * Normalise nom boutique et message de relance après chargement (local, InsForge).
 * @param {Record<string, unknown>} settings
 */
export function normalizeShopSettingsFields(settings) {
  const out = { ...settings }
  if (out.shopName != null) {
    const n = replaceLegacyBrandInText(String(out.shopName)).trim()
    out.shopName = n || BRAND.name
  }
  if (out.relanceMessage != null) {
    out.relanceMessage = replaceLegacyBrandInText(String(out.relanceMessage))
  }
  return out
}
