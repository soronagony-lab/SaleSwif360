import { useState, useCallback } from 'react'
import { KeyRound, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { isAdminEmail, parseAdminEmails } from '@/lib/adminAccess'

export function AdminAuthModal({ open, onOpenChange, onSuccess }) {
  const {
    insforgeConfigured,
    loading: authLoading,
    user,
    isAdmin,
    refreshSession,
    signIn,
    signUp,
    signOut,
    verifyEmail,
    resendVerification,
  } = useAuth()

  const [tab, setTab] = useState('login')
  const [step, setStep] = useState('form')
  const [pendingEmail, setPendingEmail] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [otp, setOtp] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setError('')
    setPassword('')
    setPassword2('')
    setOtp('')
    setStep('form')
  }

  const enterAdmin = useCallback(() => {
    onSuccess()
    onOpenChange(false)
  }, [onSuccess, onOpenChange])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Renseignez e-mail et mot de passe.')
      return
    }
    if (!isAdminEmail(email)) {
      setError(
        "Cet e-mail n'est pas autorisé à accéder à l'administration. Vérifiez VITE_ADMIN_EMAILS."
      )
      return
    }
    setSubmitting(true)
    const { error: err } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Connexion impossible.')
      return
    }
    onSuccess()
    onOpenChange(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Remplissez tous les champs.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!isAdminEmail(email)) {
      setError(
        "Seuls les e-mails autorisés peuvent créer un compte administrateur. Contactez le propriétaire ou vérifiez VITE_ADMIN_EMAILS."
      )
      return
    }
    setSubmitting(true)
    const { data, error: err } = await signUp(
      email.trim(),
      password,
      name.trim()
    )
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Inscription impossible.')
      return
    }
    if (data?.requireEmailVerification) {
      setPendingEmail(email.trim())
      setStep('verify')
      setOtp('')
      return
    }
    if (data?.accessToken) {
      await refreshSession()
      onSuccess()
      onOpenChange(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Entrez le code à 6 chiffres reçu par e-mail.')
      return
    }
    setSubmitting(true)
    const { error: err } = await verifyEmail(pendingEmail, otp.trim())
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Code invalide ou expiré.')
      return
    }
    if (!isAdminEmail(pendingEmail)) {
      setError("Ce compte n'a pas les droits administrateur.")
      return
    }
    onSuccess()
    onOpenChange(false)
  }

  const handleResend = async () => {
    setError('')
    setSubmitting(true)
    const { error: err } = await resendVerification(pendingEmail)
    setSubmitting(false)
    if (err) setError(err.message || 'Envoi impossible.')
  }

  const adminListConfigured = parseAdminEmails().length > 0

  const handleOpenChange = (v) => {
    if (!v) {
      resetForm()
      setTab('login')
      setPendingEmail('')
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-teal-700" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Administration J&apos;achète.ci
          </DialogTitle>
          <DialogDescription className="text-center">
            Connexion sécurisée par e-mail et mot de passe (InsForge).
          </DialogDescription>
        </DialogHeader>

        {!insforgeConfigured && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4">
            Variables <code className="text-xs">VITE_INSFORGE_URL</code> et{' '}
            <code className="text-xs">VITE_INSFORGE_ANON_KEY</code> manquantes.
          </div>
        )}

        {insforgeConfigured && !adminListConfigured && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm p-4">
            Aucun e-mail admin configuré. Définissez{' '}
            <code className="text-xs">VITE_ADMIN_EMAILS</code> (séparés par des
            virgules) sur Vercel ou en local.
          </div>
        )}

        {authLoading && (
          <div className="flex justify-center py-6 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {!authLoading && insforgeConfigured && adminListConfigured && (
          <>
            {user && !isAdmin && (
              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm p-4">
                  Connecté en tant que{' '}
                  <strong>{user.email}</strong> — ce compte n&apos;a pas accès à
                  l&apos;administration.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signOut()}
                >
                  Se déconnecter et réessayer
                </Button>
              </div>
            )}

            {user && isAdmin && step === 'form' && (
              <div className="text-center space-y-4 py-2">
                <p className="text-sm text-gray-600">
                  Session active :{' '}
                  <strong className="text-gray-900">{user.email}</strong>
                </p>
                <Button type="button" className="w-full" onClick={enterAdmin}>
                  Accéder au tableau de bord
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Un code a été envoyé à <strong>{pendingEmail}</strong>.
                  Saisissez le code à 6 chiffres.
                </p>
                <div>
                  <Label htmlFor="otp">Code de vérification</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono mt-1"
                    maxLength={8}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setStep('form')
                      setTab('login')
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={submitting}
                    onClick={handleResend}
                  >
                    Renvoyer le code
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Vérifier et continuer
                </Button>
              </form>
            )}

            {step === 'form' && !user && (
              <>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                      tab === 'login'
                        ? 'bg-white shadow text-teal-800'
                        : 'text-gray-600'
                    }`}
                    onClick={() => {
                      setTab('login')
                      setError('')
                    }}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                      tab === 'register'
                        ? 'bg-white shadow text-teal-800'
                        : 'text-gray-600'
                    }`}
                    onClick={() => {
                      setTab('register')
                      setError('')
                    }}
                  >
                    Créer un compte
                  </button>
                </div>

                {tab === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="adm-email">E-mail</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="adm-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="vous@exemple.ci"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="adm-pass">Mot de passe</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="adm-pass"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Se connecter
                    </Button>
                  </form>
                )}

                {tab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="adm-name">Nom complet</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="adm-name"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          placeholder="Prénom Nom"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-email">E-mail professionnel</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="admin@domaine.ci"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-pass">Mot de passe</Label>
                      <div className="relative mt-1">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="reg-pass"
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-pass2">Confirmer le mot de passe</Label>
                      <Input
                        id="reg-pass2"
                        type="password"
                        autoComplete="new-password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Créer mon compte administrateur
                    </Button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
