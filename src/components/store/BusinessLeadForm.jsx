import { useState } from 'react'
import { CheckCircle2, Gift, Loader2, Sparkles } from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BRAND } from '@/lib/brand'

const GOALS = [
  { value: 'revenus_complementaires', label: 'Revenus complémentaires' },
  { value: 'remplacer_salaire', label: 'Remplacer ou compléter un salaire' },
  { value: 'entrepreneuriat', label: 'Projet entrepreneurial (temps plein)' },
  { value: 'decouverte', label: 'Simple découverte / information' },
]

const EXPERIENCE = [
  { value: 'debutant', label: 'Je débute' },
  { value: 'vente_en_ligne', label: 'J’ai déjà vendu en ligne ou en réseau' },
  { value: 'experimente', label: 'Expérience vente directe / terrain' },
]

/**
 * Lead magnet — prospection business (formulaire → dashboard admin + InsForge).
 */
export function BusinessLeadForm({ shopName, className = '' }) {
  const { submitBusinessLead } = useShop()
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const consent = fd.get('consent') === 'on'
    if (!consent) {
      window.alert(
        'Merci d’accepter d’être recontacté(e) pour que nous puissions répondre à votre demande.'
      )
      return
    }
    setSending(true)
    try {
      submitBusinessLead({
        fullName: String(fd.get('fullName') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        city: String(fd.get('city') || '').trim(),
        goal: String(fd.get('goal') || ''),
        experience: String(fd.get('experience') || ''),
        message: String(fd.get('message') || '').trim(),
        consent: true,
      })
      setDone(true)
      e.target.reset()
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div
        className={`rounded-3xl border-2 border-emerald-200 bg-white p-6 sm:p-8 shadow-xl ${className}`}
        role="status"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-700" aria-hidden />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
            Demande bien reçue !
          </h3>
          <p className="text-stone-600 text-sm sm:text-base max-w-md leading-relaxed">
            Notre équipe{' '}
            <span className="font-semibold text-emerald-800">{shopName}</span>{' '}
            traite votre demande sous 24–48 h. Vous pouvez aussi nous écrire
            directement sur WhatsApp pour aller plus vite.
          </p>
          <Button
            type="button"
            variant="default"
            className="mt-2 rounded-2xl min-h-[48px] px-8 w-full sm:w-auto"
            onClick={() => setDone(false)}
          >
            Envoyer une autre demande
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      id="lead-form"
      className={`relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/30 shadow-xl ${className}`}
    >
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-emerald-950 shadow-md">
            <Gift className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              Kit gratuit — sans engagement
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 leading-tight">
              Recevez une présentation adaptée à votre projet
            </h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Laissez vos coordonnées : nous revenons vers vous avec une
              proposition claire (étapes, accompagnement {BRAND.name}). Pas de
              spam — uniquement un suivi personnalisé.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 text-sm text-stone-700">
          {[
            'Analyse de votre situation (temps disponible, objectifs)',
            'Présentation du plan de récompenses (résumé transparent)',
            'Accès à la communauté et aux formations produits',
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-emerald-100/80"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="bl-name" className="text-stone-800">
                Nom complet *
              </Label>
              <Input
                id="bl-name"
                name="fullName"
                required
                autoComplete="name"
                placeholder="Ex. Marie Koné"
                className="mt-1.5 h-12 text-base rounded-xl border-emerald-100"
              />
            </div>
            <div>
              <Label htmlFor="bl-phone" className="text-stone-800">
                Téléphone WhatsApp *
              </Label>
              <Input
                id="bl-phone"
                name="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+225 …"
                className="mt-1.5 h-12 text-base rounded-xl border-emerald-100"
              />
            </div>
            <div>
              <Label htmlFor="bl-email" className="text-stone-800">
                E-mail (optionnel)
              </Label>
              <Input
                id="bl-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="pour un suivi écrit"
                className="mt-1.5 h-12 text-base rounded-xl border-emerald-100"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bl-city" className="text-stone-800">
                Ville / région
              </Label>
              <Input
                id="bl-city"
                name="city"
                placeholder="Ex. Abidjan, Cocody"
                className="mt-1.5 h-12 text-base rounded-xl border-emerald-100"
              />
            </div>
            <div>
              <Label htmlFor="bl-goal" className="text-stone-800">
                Votre objectif principal
              </Label>
              <select
                id="bl-goal"
                name="goal"
                required
                className="mt-1.5 flex h-12 w-full rounded-xl border border-emerald-100 bg-white px-3 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                defaultValue=""
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bl-exp" className="text-stone-800">
                Votre expérience
              </Label>
              <select
                id="bl-exp"
                name="experience"
                required
                className="mt-1.5 flex h-12 w-full rounded-xl border border-emerald-100 bg-white px-3 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                defaultValue=""
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {EXPERIENCE.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bl-msg" className="text-stone-800">
                Message libre (optionnel)
              </Label>
              <textarea
                id="bl-msg"
                name="message"
                rows={3}
                placeholder="Une question précise, vos disponibilités…"
                className="mt-1.5 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-base text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 min-h-[100px]"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              name="consent"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500 shrink-0"
            />
            <span className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              J’accepte d’être recontacté(e) par{' '}
              <span className="font-semibold text-stone-800">{shopName}</span>{' '}
              concernant l’opportunité business et les produits Forever Living
              (WhatsApp ou e-mail). Je peux retirer mon consentement à tout
              moment.
            </span>
          </label>

          <Button
            type="submit"
            disabled={sending}
            variant="accent"
            size="lg"
            className="w-full sm:w-auto min-h-[52px] rounded-2xl text-base font-bold px-10 shadow-lg"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Envoi…
              </>
            ) : (
              'Obtenir mon accompagnement personnalisé'
            )}
          </Button>
          <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
            {BRAND.mlm.disclaimer}
          </p>
        </form>
      </div>
    </div>
  )
}
