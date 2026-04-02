import { useState, useCallback } from 'react'
import {
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react'
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
import { formatAuthError } from '@/lib/authErrors'
import { BRAND } from '@/lib/brand'

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

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
    signInWithGoogle,
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
  const [info, setInfo] = useState('')

  const resetForm = () => {
    setError('')
    setInfo('')
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
    setInfo('')
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
      setError(formatAuthError(err))
      return
    }
    await refreshSession()
    onSuccess()
    onOpenChange(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Remplissez tous les champs obligatoires.')
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
        "Seuls les e-mails autorisés peuvent créer un compte administrateur. Vérifiez VITE_ADMIN_EMAILS."
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
      setError(formatAuthError(err))
      return
    }

    const needsVerification =
      data?.requireEmailVerification === true ||
      (Boolean(data?.user) && !data?.accessToken)

    if (needsVerification) {
      setPendingEmail(email.trim())
      setStep('verify')
      setOtp('')
      setInfo(
        'Un code à 6 chiffres a été envoyé à votre adresse e-mail. Il peut prendre une minute.'
      )
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
    setInfo('')
    const code = otp.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) {
      setError('Saisissez exactement les 6 chiffres du code reçu par e-mail.')
      return
    }
    setSubmitting(true)
    const { error: err } = await verifyEmail(pendingEmail.trim(), code)
    setSubmitting(false)
    if (err) {
      setError(formatAuthError(err))
      return
    }
    await refreshSession()
    if (!isAdminEmail(pendingEmail.trim())) {
      setError(
        "Ce compte n'est pas dans la liste des administrateurs (VITE_ADMIN_EMAILS)."
      )
      return
    }
    onSuccess()
    onOpenChange(false)
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setSubmitting(true)
    const { data, error: err } = await resendVerification(pendingEmail.trim())
    setSubmitting(false)
    if (err) {
      setError(formatAuthError(err))
      return
    }
    if (data?.success !== false) {
      setInfo(
        data?.message ||
          'Un nouveau code a été envoyé. Vérifiez votre boîte et les courriers indésirables.'
      )
    }
  }

  const handleGoogle = async () => {
    setError('')
    setInfo('')
    if (!parseAdminEmails().length) {
      setError('Configurez VITE_ADMIN_EMAILS avant de vous connecter.')
      return
    }
    setSubmitting(true)
    const { error: err } = await signInWithGoogle()
    setSubmitting(false)
    if (err) {
      setError(formatAuthError(err))
    }
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

  const onOtpChange = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
  }

  const onOtpPaste = (e) => {
    e.preventDefault()
    const t = e.clipboardData.getData('text') || ''
    onOtpChange(t)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 px-6 pt-8 pb-6 text-white">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <ShieldCheck className="w-7 h-7 text-teal-200" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white text-left">
                  Espace administration
                </DialogTitle>
                <DialogDescription className="text-teal-100/90 text-sm text-left mt-1">
                  {BRAND.name} — administration (InsForge)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 bg-white max-h-[min(85vh,720px)] overflow-y-auto">
          {!insforgeConfigured && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm p-4 mb-4">
              Définissez{' '}
              <code className="text-xs bg-amber-100 px-1 rounded">
                VITE_INSFORGE_URL
              </code>{' '}
              et{' '}
              <code className="text-xs bg-amber-100 px-1 rounded">
                VITE_INSFORGE_ANON_KEY
              </code>{' '}
              pour activer l&apos;authentification.
            </div>
          )}

          {insforgeConfigured && !adminListConfigured && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm p-4 mb-4">
              Ajoutez{' '}
              <code className="text-xs bg-red-100 px-1 rounded">
                VITE_ADMIN_EMAILS
              </code>{' '}
              (e-mails autorisés, séparés par des virgules).
            </div>
          )}

          {authLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <span className="text-sm">Chargement de la session…</span>
            </div>
          )}

          {!authLoading && insforgeConfigured && adminListConfigured && (
            <>
              {user && !isAdmin && (
                <div className="space-y-4 mb-2">
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm p-4">
                    Connecté avec <strong>{user.email}</strong> — ce compte
                    n&apos;a pas accès à l&apos;administration (liste
                    VITE_ADMIN_EMAILS).
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => signOut()}
                  >
                    Changer de compte
                  </Button>
                </div>
              )}

              {user && isAdmin && step === 'form' && (
                <div className="text-center space-y-4 py-4">
                  <div className="inline-flex items-center gap-2 text-teal-700 bg-teal-50 px-4 py-2 rounded-full text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Session : {user.email}
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl py-6 text-base"
                    onClick={enterAdmin}
                  >
                    Ouvrir le tableau de bord
                  </Button>
                </div>
              )}

              {step === 'verify' && (
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Vérification de l&apos;e-mail
                    </p>
                    <p className="text-sm text-gray-600">
                      Code envoyé à{' '}
                      <strong className="text-teal-800">{pendingEmail}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Saisissez les <strong>6 chiffres</strong> reçus (vérifiez
                      les spams).
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="otp" className="sr-only">
                      Code à 6 chiffres
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => onOtpChange(e.target.value)}
                      onPaste={onOtpPaste}
                      placeholder="• • • • • •"
                      className="text-center text-3xl tracking-[0.4em] font-mono font-semibold h-16 rounded-xl border-2 border-gray-200 focus-visible:border-teal-500"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  {info && (
                    <p className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                      {info}
                    </p>
                  )}
                  {error && (
                    <p
                      className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => {
                        setStep('form')
                        setTab('register')
                        setOtp('')
                        setInfo('')
                        setError('')
                      }}
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={submitting}
                      onClick={handleResend}
                    >
                      Renvoyer le code
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl py-6 text-base"
                    disabled={submitting || otp.length !== 6}
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Confirmer le code
                  </Button>
                </form>
              )}

              {step === 'form' && !user && (
                <div className="space-y-6">
                  <div className="flex rounded-2xl bg-gray-100 p-1.5">
                    <button
                      type="button"
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
                        tab === 'login'
                          ? 'bg-white shadow text-teal-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        setTab('login')
                        setError('')
                        setInfo('')
                      }}
                    >
                      Connexion
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
                        tab === 'register'
                          ? 'bg-white shadow text-teal-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        setTab('register')
                        setError('')
                        setInfo('')
                      }}
                    >
                      Créer un compte
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium gap-3"
                      disabled={submitting}
                      onClick={handleGoogle}
                    >
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      Continuer avec Google
                    </Button>
                    <p className="text-xs text-center text-gray-500 px-2">
                      L&apos;e-mail Google doit figurer dans VITE_ADMIN_EMAILS.
                      Activez Google dans le tableau InsForge (Auth → OAuth).
                    </p>
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                      <span className="bg-white px-3 text-gray-400 font-medium">
                        ou e-mail
                      </span>
                    </div>
                  </div>

                  {tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="adm-email">E-mail</Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="adm-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                            placeholder="vous@exemple.com"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="adm-pass">Mot de passe</Label>
                        <div className="relative mt-1.5">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="adm-pass"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                          />
                        </div>
                      </div>
                      {error && (
                        <p
                          className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                          role="alert"
                        >
                          {error}
                        </p>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base"
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
                      <div className="rounded-xl bg-teal-50/80 border border-teal-100 px-4 py-3 text-sm text-teal-900">
                        <strong className="font-semibold">
                          Compte administrateur
                        </strong>
                        <p className="mt-1 text-teal-800/90">
                          Après inscription, un{' '}
                          <strong>code OTP à 6 chiffres</strong> vous est envoyé
                          par e-mail pour confirmer votre adresse.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="adm-name">Nom complet</Label>
                        <div className="relative mt-1.5">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="adm-name"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                            placeholder="Prénom Nom"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reg-email">E-mail</Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                            placeholder="admin@domaine.ci"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reg-pass">Mot de passe (min. 6 caractères)</Label>
                        <div className="relative mt-1.5">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="reg-pass"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
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
                          className="mt-1.5 h-12 rounded-xl"
                        />
                      </div>
                      {error && (
                        <p
                          className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                          role="alert"
                        >
                          {error}
                        </p>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-semibold"
                        disabled={submitting}
                      >
                        {submitting && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        S&apos;inscrire et recevoir le code
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
