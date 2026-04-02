import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductImage } from '@/components/ProductImage'
import { formatPrice } from '@/lib/format'
import {
  trackAddPaymentInfo,
  trackPurchase,
  trackRetourBoutiqueApresAchat,
} from '@/lib/facebookPixel'

export function OrderModal({
  open,
  onOpenChange,
  product,
  /** @returns {number|string|undefined} id commande local */
  onSubmitOrder,
}) {
  const [success, setSuccess] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState(null)

  const handleClose = (v) => {
    if (!v) {
      setSuccess(false)
      setConfirmedOrderId(null)
    }
    onOpenChange(v)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!product) return
    const formData = new FormData(e.target)
    const payload = {
      productId: product.id,
      productName: product.name,
      price: product.price,
      customerName: formData.get('name'),
      phone: formData.get('phone'),
      city: formData.get('city'),
      address: formData.get('address'),
      status: 'Nouvelle',
      date: new Date().toLocaleString('fr-FR'),
    }

    trackAddPaymentInfo(product) // « Valider ma commande » — infos livraison / COD

    const orderId = onSubmitOrder(payload)

    if (orderId != null) {
      trackPurchase({
        id: orderId,
        productId: payload.productId,
        productName: payload.productName,
        price: payload.price,
      })
    }
    setConfirmedOrderId(orderId ?? null)
    setSuccess(true)
  }

  const handleRetourBoutique = () => {
    if (product && confirmedOrderId != null) {
      trackRetourBoutiqueApresAchat({
        orderId: confirmedOrderId,
        productId: product.id,
        value: product.price,
      })
    }
    handleClose(false)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showClose={!success}
        className="max-w-md gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-[0_25px_80px_-12px_rgba(13,148,136,0.35)]"
      >
        {success ? (
          <div className="flex flex-col items-center bg-gradient-to-b from-emerald-50/90 to-white px-8 py-10 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-inner ring-4 ring-white">
              <CheckCircle className="h-14 w-14 text-emerald-600" />
            </div>
            <h3 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900">
              Félicitations ! 🎉
            </h3>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              Votre commande a été enregistrée avec succès.
            </p>
            <div className="mb-8 w-full rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 shadow-sm">
              <p className="flex items-start text-left text-sm font-medium text-amber-950">
                <MessageCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                Notre équipe va vous contacter très vite sur WhatsApp ou par
                appel pour confirmer la livraison.
              </p>
            </div>
            <Button
              variant="default"
              className="w-full rounded-xl py-6 text-base shadow-md"
              onClick={handleRetourBoutique}
            >
              Retourner à la boutique
            </Button>
          </div>
        ) : (
          <div className="flex max-h-[90vh] flex-col">
            <div className="shrink-0 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 px-6 pb-5 pt-7 text-white">
              <DialogHeader className="space-y-1 border-0 p-0 text-left">
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  Finaliser ma commande
                </DialogTitle>
                <p className="text-sm text-teal-100/95">
                  Livraison en Côte d&apos;Ivoire — paiement à la réception
                </p>
              </DialogHeader>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-6 pb-6 pt-5">
              <div className="mb-6 flex items-center space-x-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <ProductImage
                  src={product.images?.[0]}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl shadow-sm shrink-0"
                />
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">
                    {product.name}
                  </p>
                  <p className="text-amber-600 font-black text-xl mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-2 flex items-start rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/80 p-3 shadow-sm">
                  <AlertCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-950">
                    Vous ne payez rien maintenant. Payez uniquement à la
                    livraison.
                  </p>
                </div>
                <div>
                  <Label className="mb-1.5 block">Nom & Prénoms</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <Input
                      name="name"
                      required
                      className="pl-10"
                      placeholder="Ex: Jean Kouassi"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Numéro de Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <Input
                      name="phone"
                      required
                      type="tel"
                      className="pl-10"
                      placeholder="Ex: 0102030405"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">Ville / Commune</Label>
                    <Input
                      name="city"
                      required
                      placeholder="Ex: Cocody"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Quartier précis</Label>
                    <Input
                      name="address"
                      required
                      placeholder="Ex: Angré 8ème"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full rounded-xl mt-6 py-6 text-lg"
                >
                  <CheckCircle className="w-5 h-5" /> Valider ma commande
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
