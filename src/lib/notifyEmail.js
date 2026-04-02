/**
 * Appelle la route serverless /api/send-email (Resend).
 * Le secret doit correspondre à EMAIL_API_SECRET sur Vercel (même valeur que VITE_EMAIL_API_SECRET au build).
 */

export async function notifyLeadByEmail(payload) {
  if (import.meta.env.VITE_NOTIFY_EMAIL_LEAD !== 'true') return
  const secret = import.meta.env.VITE_EMAIL_API_SECRET
  if (!secret) return

  try {
    const r = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ kind: 'lead', payload }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      console.warn('notifyLeadByEmail', r.status, err)
    }
  } catch (e) {
    console.warn('notifyLeadByEmail', e)
  }
}

export async function notifyOrderByEmail(payload) {
  if (import.meta.env.VITE_NOTIFY_EMAIL_ORDER !== 'true') return
  const secret = import.meta.env.VITE_EMAIL_API_SECRET
  if (!secret) return

  try {
    const r = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ kind: 'order', payload }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      console.warn('notifyOrderByEmail', r.status, err)
    }
  } catch (e) {
    console.warn('notifyOrderByEmail', e)
  }
}
