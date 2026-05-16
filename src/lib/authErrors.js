/**
 * Message lisible à partir des erreurs InsForge / réseau.
 */
function isCorsOrNetworkMessage(text) {
  const lower = String(text || '').toLowerCase()
  return (
    /cors|access-control|blocked by.*policy|failed to fetch|network|load failed/i.test(
      lower
    )
  )
}

export function formatAuthError(err) {
  if (err == null) return 'Une erreur est survenue.'
  if (typeof err === 'string') {
    if (isCorsOrNetworkMessage(err)) {
      return 'Connexion InsForge bloquée (CORS ou réseau). Dans le dashboard InsForge, ajoutez l’URL de votre site (ex. https://sale-swif360.vercel.app) aux origines autorisées, puis réessayez.'
    }
    return err
  }
  if (typeof err.message === 'string' && err.message) {
    if (isCorsOrNetworkMessage(err.message)) {
      return 'Connexion InsForge bloquée (CORS ou réseau). Dans le dashboard InsForge, ajoutez l’URL de votre site (ex. https://sale-swif360.vercel.app) aux origines autorisées, puis réessayez.'
    }
    return err.message
  }
  if (typeof err.error === 'string' && err.error) return err.error
  if (Array.isArray(err.nextActions) && err.nextActions.length) {
    return String(err.nextActions[0])
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'Une erreur est survenue.'
  }
}
