import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  LEAD_EXP_LABELS,
  LEAD_GOAL_LABELS,
  LEAD_STATUS_OPTIONS,
  leadMailtoHref,
  leadWhatsAppHref,
} from '@/lib/leadLabels'
import {
  ClipboardList,
  Eye,
  Mail,
  MessageCircle,
  Target,
  Trash2,
} from 'lucide-react'

/**
 * @param {'view' | 'treat'} initialTab — Fiche (lecture) ou Traitement (statut, note, contacts)
 */
export function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  initialTab = 'view',
  shopName,
  onPatchLead,
  onDeleteLead,
}) {
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab, lead?.id])

  if (!lead) return null

  const goalLabel = LEAD_GOAL_LABELS[lead.goal] || lead.goal || '—'
  const expLabel = LEAD_EXP_LABELS[lead.experience] || lead.experience || '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        showClose
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-rose-700 via-rose-800 to-slate-900 px-6 pb-6 pt-7 text-white">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-20 w-40 rounded-full bg-teal-400/15 blur-2xl"
            aria-hidden
          />
          <DialogHeader className="flex-row items-start gap-4 space-y-0 border-0 p-0 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/25 shadow-lg backdrop-blur-sm">
              <Target className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5 pr-10">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {lead.fullName}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-rose-100/95">
                {lead.date} — Prospection business
              </DialogDescription>
            </div>
          </DialogHeader>

          <div
            className="mt-5 flex rounded-2xl bg-black/20 p-1 ring-1 ring-white/15 backdrop-blur-sm"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'view'}
              onClick={() => setTab('view')}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all ${
                tab === 'view'
                  ? 'bg-white text-rose-900 shadow-md'
                  : 'text-rose-100/90 hover:bg-white/10'
              }`}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Fiche
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'treat'}
              onClick={() => setTab('treat')}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all ${
                tab === 'treat'
                  ? 'bg-white text-teal-900 shadow-md'
                  : 'text-rose-100/90 hover:bg-white/10'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              Traitement
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/90 to-white px-5 py-5 sm:px-6">
          {tab === 'view' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100/90 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-rose-700">
                    Contact
                  </span>
                  <p className="mt-1 font-bold text-gray-900">{lead.phone}</p>
                  <p className="break-all text-sm text-gray-600">
                    {lead.email || '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100/90 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-rose-700">
                    Ville
                  </span>
                  <p className="mt-1 font-medium text-gray-900">
                    {lead.city || '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-orange-50/40 p-4 shadow-sm ring-1 ring-rose-100/60">
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-900/90">
                  Profil & message
                </p>
                <p className="mt-2 text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">Objectif :</span>{' '}
                  {goalLabel}
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">
                    Expérience :
                  </span>{' '}
                  {expLabel}
                </p>
                {lead.message ? (
                  <p className="mt-3 whitespace-pre-wrap border-t border-rose-200/70 pt-3 text-sm leading-relaxed text-gray-700">
                    {lead.message}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-gray-500">
                    Aucun message
                  </p>
                )}
              </div>

              <p className="text-center text-[11px] text-gray-500">
                Consentement contact :{' '}
                <span className="font-semibold text-gray-700">
                  {lead.consent ? 'oui' : 'non'}
                </span>
              </p>
            </div>
          )}

          {tab === 'treat' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Statut
                </Label>
                <select
                  value={lead.status}
                  onChange={(e) =>
                    onPatchLead(lead.id, { status: e.target.value })
                  }
                  className="w-full cursor-pointer rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                >
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Note interne
                </Label>
                <textarea
                  value={lead.internalNote ?? ''}
                  onChange={(e) =>
                    onPatchLead(lead.id, { internalNote: e.target.value })
                  }
                  rows={4}
                  placeholder="Résumé d’appel, prochaine étape, objections…"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={leadWhatsAppHref(lead, shopName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#20b856] hover:shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href={leadMailtoHref(lead, shopName)}
                  className="inline-flex min-h-[48px] min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4" /> E-mail
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-gray-200/90 bg-white px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] w-full rounded-xl border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
            onClick={() => {
              if (window.confirm('Supprimer ce prospect ?')) {
                onDeleteLead(lead.id)
                onOpenChange(false)
              }
            }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
          </Button>
          <Button
            type="button"
            className="min-h-[44px] w-full rounded-xl bg-teal-800 hover:bg-teal-900 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
