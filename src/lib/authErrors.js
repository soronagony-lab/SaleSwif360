/**
 * Message lisible à partir des erreurs InsForge / réseau.
 */
export function formatAuthError(err) {
  if (err == null) return 'Une erreur est survenue.'
  if (typeof err === 'string') return err
  if (typeof err.message === 'string' && err.message) return err.message
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
