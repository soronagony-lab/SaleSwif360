import { useEffect, useMemo, useState } from 'react'
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
import { formatPrice, normalizePhoneForWhatsApp } from '@/lib/format'
import { MessageCircle, Trash2, Truck } from 'lucide-react'

const STATUS_OPTIONS = ['Nouvelle', 'En cours', 'Livrée', 'Annulée']

function interpolateRelance(body, ctx) {
  return String(body || '')
    .replace(/\{\{nom\}\}/g, ctx.customerName || '')
    .replace(/\{\{boutique\}\}/g, ctx.shopName || '')
    .replace(/\{\{produit\}\}/g, ctx.productName || '')
    .replace(/\{\{prix\}\}/g, ctx.priceLabel || '')
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  shopName,
  zones,
  couriers,
  relanceTemplates,
  onPatchOrder,
  onDeleteOrder,
}) {
  const [relanceTemplateId, setRelanceTemplateId] = useState('')

  useEffect(() => {
    if (open && relanceTemplates?.length) {
      setRelanceTemplateId(relanceTemplates[0].id)
    }
  }, [open, relanceTemplates])

  const ctx = useMemo(() => {
    if (!order) return null
    return {
      customerName: order.customerName,
      shopName,
      productName: order.productName,
      priceLabel: formatPrice(order.price),
    }
  }, [order, shopName])

  const relanceHref = useMemo(() => {
    if (!order || !ctx) return '#'
    const t = relanceTemplates?.find((x) => x.id === relanceTemplateId)
    const body = t
      ? interpolateRelance(t.body, ctx)
      : interpolateRelance(
          'Bonjour {{nom}}, message de {{boutique}} concernant {{produit}} ({{prix}}).',
          ctx
        )
    const phone = normalizePhoneForWhatsApp(order.phone)
    return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
  }, [order, ctx, relanceTemplates, relanceTemplateId])

  const orderWhatsHref = useMemo(() => {
    if (!order || !ctx) return '#'
    const message = `Bonjour ${order.customerName},\n\nCommande *#${String(order.id).slice(-5)}* — *${order.productName}* (${formatPrice(order.price)}).\n${order.city}, ${order.address}.\n\n— ${shopName}`
    const phone = normalizePhoneForWhatsApp(order.phone)
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }, [order, ctx, shopName])

  if (!order) return null

  const activeCouriers = (couriers || []).filter((c) => c.active !== false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl"
        showClose
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Commande #{String(order.id).slice(-5)}
          </DialogTitle>
          <DialogDescription>
            {order.date} — {order.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-1 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs font-bold uppercase">
                Client
              </span>
              <p className="font-bold text-gray-900">{order.customerName}</p>
              <p className="text-gray-600">{order.phone}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs font-bold uppercase">
                Livraison
              </span>
              <p className="font-medium text-gray-800">{order.city}</p>
              <p className="text-gray-600 text-xs">{order.address}</p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-800 uppercase mb-1">
              Produit
            </p>
            <p className="font-bold text-gray-900">{order.productName}</p>
            <p className="text-orange-600 font-black mt-1">
              {formatPrice(order.price)}
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block">Statut</Label>
            <select
              value={order.status}
              onChange={(e) => onPatchOrder(order.id, { status: e.target.value })}
              className={`w-full text-sm font-bold px-3 py-2.5 rounded-xl border-2 outline-none cursor-pointer ${
                order.status === 'Nouvelle'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : order.status === 'En cours'
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : order.status === 'Livrée'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Zone de livraison</Label>
              <select
                value={order.deliveryZoneId ?? ''}
                onChange={(e) =>
                  onPatchOrder(order.id, {
                    deliveryZoneId: e.target.value || null,
                  })
                }
                className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50"
              >
                <option value="">— Non définie —</option>
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({formatPrice(z.fee)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Livreur
              </Label>
              <select
                value={order.courierId ?? ''}
                onChange={(e) =>
                  onPatchOrder(order.id, {
                    courierId: e.target.value || null,
                  })
                }
                className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50"
              >
                <option value="">— Aucun —</option>
                {activeCouriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Note interne</Label>
            <textarea
              value={order.internalNote ?? ''}
              onChange={(e) =>
                onPatchOrder(order.id, { internalNote: e.target.value })
              }
              rows={3}
              placeholder="Instructions internes, créneau, etc."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
            />
          </div>

          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/80">
            <Label className="mb-2 block">Message de relance (modèle)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={relanceTemplateId}
                onChange={(e) => setRelanceTemplateId(e.target.value)}
                className="flex-1 text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white"
              >
                {(relanceTemplates || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.angle === 'marketing' ? 'Mkt' : 'Info'}] {t.title}
                  </option>
                ))}
              </select>
              <a
                href={relanceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20b856] text-white px-4 py-2 rounded-xl font-bold text-sm"
              >
                <MessageCircle className="w-4 h-4" /> Relance WA
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={orderWhatsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              <MessageCircle className="w-4 h-4" /> Message commande
            </a>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => {
              if (
                window.confirm(
                  'Supprimer définitivement cette commande ? Cette action est irréversible.'
                )
              ) {
                onDeleteOrder(order.id)
                onOpenChange(false)
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
