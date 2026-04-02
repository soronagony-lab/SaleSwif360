/**
 * Vercel Serverless — Resend (clés uniquement en variables d’environnement serveur).
 * POST /api/send-email
 * Headers: Authorization: Bearer <EMAIL_API_SECRET>
 * Body JSON: { kind: 'lead' | 'order' | 'test', payload: object }
 *
 * ESM obligatoire : package.json a "type": "module" (require/module.exports feraient crasher la fonction).
 */

import { Resend } from 'resend'
import { replaceLegacyBrandInText } from '../src/lib/brandReplace.js'

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Texte utilisateur + normalisation ancienne marque, puis échappement HTML */
function cell(s) {
  return escapeHtml(replaceLegacyBrandInText(String(s ?? '')))
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  const allowOrigin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.EMAIL_API_SECRET
  const auth = req.headers.authorization || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY manquant' })
  }

  let body
  try {
    body = await parseJsonBody(req)
  } catch {
    return res.status(400).json({ error: 'JSON invalide' })
  }

  const { kind, payload = {} } = body
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev'
  const to = process.env.NOTIFY_TO_EMAIL || payload.to

  if (!to) {
    return res.status(400).json({ error: 'NOTIFY_TO_EMAIL ou payload.to requis' })
  }

  let subject
  let html

  if (kind === 'lead') {
    subject = replaceLegacyBrandInText(
      `Nouveau prospect — ${payload.fullName || 'Sans nom'}`
    )
    html = `
      <h2 style="font-family:system-ui,sans-serif;">Prospection business</h2>
      <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td><strong>Nom</strong></td><td>${cell(payload.fullName)}</td></tr>
        <tr><td><strong>Téléphone</strong></td><td>${cell(payload.phone)}</td></tr>
        <tr><td><strong>E-mail</strong></td><td>${cell(payload.email)}</td></tr>
        <tr><td><strong>Ville</strong></td><td>${cell(payload.city)}</td></tr>
        <tr><td><strong>Objectif</strong></td><td>${cell(payload.goal)}</td></tr>
        <tr><td><strong>Expérience</strong></td><td>${cell(payload.experience)}</td></tr>
        <tr><td valign="top"><strong>Message</strong></td><td>${cell(payload.message)}</td></tr>
      </table>
    `
  } else if (kind === 'order') {
    subject = replaceLegacyBrandInText(
      `Nouvelle commande — ${payload.customerName || 'Client'}`
    )
    html = `
      <h2 style="font-family:system-ui,sans-serif;">Commande boutique</h2>
      <table style="font-family:system-ui,sans-serif;font-size:14px;">
        <tr><td><strong>Client</strong></td><td>${cell(payload.customerName)}</td></tr>
        <tr><td><strong>Téléphone</strong></td><td>${cell(payload.phone)}</td></tr>
        <tr><td><strong>Produit</strong></td><td>${cell(payload.productName)}</td></tr>
        <tr><td><strong>Prix</strong></td><td>${cell(String(payload.price))}</td></tr>
        <tr><td><strong>Ville</strong></td><td>${cell(payload.city)}</td></tr>
        <tr><td><strong>Adresse</strong></td><td>${cell(payload.address)}</td></tr>
      </table>
    `
  } else if (kind === 'test') {
    subject = replaceLegacyBrandInText(payload.subject || 'Test Resend')
    html = replaceLegacyBrandInText(payload.html || '<p>Test</p>')
  } else {
    return res.status(400).json({ error: 'kind invalide (lead|order|test)' })
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend', error)
      return res.status(500).json({
        error: error.message || 'Envoi échoué',
      })
    }

    return res.status(200).json({ ok: true, id: data?.id })
  } catch (err) {
    console.error('send-email', err)
    return res.status(500).json({
      error: err?.message || 'Erreur serveur',
    })
  }
}
