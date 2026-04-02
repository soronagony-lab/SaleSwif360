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
import { ClipboardList, Eye, Mail, MessageCircle, Target, Trash2 } from 'lucide-react'

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
        className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl"
        showClose
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-600 shrink-0" />
            {lead.fullName}
          </DialogTitle>
          <DialogDescription>
            {lead.date} — Prospection business
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors min-h-[40px] ${
              tab === 'view'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Fiche
          </button>
          <button
            type="button"
            onClick={() => setTab('treat')}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors min-h-[40px] ${
              tab === 'treat'
                ? 'bg-teal-800 text-white border-teal-800'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Traitement
          </button>
        </div>

        {tab === 'view' && (
          <div className="space-y-4 px-1 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs font-bold uppercase">
                  Contact
                </span>
                <p className="font-bold text-gray-900 mt-0.5">{lead.phone}</p>
                <p className="text-gray-600 break-all text-sm">
                  {lead.email || '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs font-bold uppercase">
                  Ville
                </span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {lead.city || '—'}
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-bold text-rose-900 uppercase mb-2">
                Profil & message
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-semibold">Objectif :</span> {goalLabel}
              </p>
              <p className="text-sm text-gray-800 mt-1">
                <span className="font-semibold">Expérience :</span> {expLabel}
              </p>
              {lead.message ? (
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap border-t border-rose-200/80 pt-3">
                  {lead.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2 italic">Aucun message</p>
              )}
            </div>

            <p className="text-[11px] text-gray-500">
              Consentement contact : {lead.consent ? 'oui' : 'non'}
            </p>
          </div>
        )}

        {tab === 'treat' && (
          <div className="space-y-4 px-1 pb-2">
            <div>
              <Label className="mb-1.5 block">Statut</Label>
              <select
                value={lead.status}
                onChange={(e) =>
                  onPatchLead(lead.id, { status: e.target.value })
                }
                className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white outline-none cursor-pointer"
              >
                {LEAD_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1.5 block">Note interne</Label>
              <textarea
                value={lead.internalNote ?? ''}
                onChange={(e) =>
                  onPatchLead(lead.id, { internalNote: e.target.value })
                }
                rows={4}
                placeholder="Résumé d’appel, prochaine étape, objections…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
              />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <a
                href={leadWhatsAppHref(lead, shopName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 min-w-[140px] min-h-[44px] items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b856] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={leadMailtoHref(lead, shopName)}
                className="inline-flex flex-1 min-w-[140px] min-h-[44px] items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-xl font-bold text-sm"
              >
                <Mail className="w-4 h-4" /> E-mail
              </a>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:items-center border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-red-700 border-red-200 hover:bg-red-50"
            onClick={() => {
              if (window.confirm('Supprimer ce prospect ?')) {
                onDeleteLead(lead.id)
                onOpenChange(false)
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto bg-teal-800 hover:bg-teal-900"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
