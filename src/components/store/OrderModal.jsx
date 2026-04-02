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

export function OrderModal({
  open,
  onOpenChange,
  product,
  onSubmitOrder,
}) {
  const [success, setSuccess] = useState(false)

  const handleClose = (v) => {
    if (!v) {
      setSuccess(false)
    }
    onOpenChange(v)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!product) return
    const formData = new FormData(e.target)
    onSubmitOrder({
      productId: product.id,
      productName: product.name,
      price: product.price,
      customerName: formData.get('name'),
      phone: formData.get('phone'),
      city: formData.get('city'),
      address: formData.get('address'),
      status: 'Nouvelle',
      date: new Date().toLocaleString('fr-FR'),
    })
    setSuccess(true)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showClose={!success} className="overflow-hidden p-0 gap-0">
        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 mb-3">
              Félicitations ! 🎉
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Votre commande a été enregistrée avec succès.
            </p>
            <div className="bg-orange-50 rounded-2xl p-4 mb-8 w-full border border-orange-100">
              <p className="text-orange-800 text-sm font-medium flex items-start">
                <MessageCircle className="w-5 h-5 mr-2 flex-shrink-0 text-orange-500 mt-0.5" />
                Notre équipe va vous contacter très vite sur WhatsApp ou par
                appel pour confirmer la livraison.
              </p>
            </div>
            <Button
              variant="default"
              className="w-full rounded-xl py-6 text-base"
              onClick={() => handleClose(false)}
            >
              Retourner à la boutique
            </Button>
          </div>
        ) : (
          <div className="flex flex-col max-h-[90vh]">
            <DialogHeader className="sticky top-0 z-10 bg-white rounded-t-3xl">
              <DialogTitle>Finaliser ma commande</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto px-6 pb-6">
              <div className="flex items-center space-x-4 mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <ProductImage
                  src={product.images?.[0]}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl shadow-sm shrink-0"
                />
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">
                    {product.name}
                  </p>
                  <p className="text-orange-500 font-black text-xl mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-teal-50 border border-teal-100 p-3 rounded-xl flex items-start mb-2">
                  <AlertCircle className="w-5 h-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-teal-800 font-medium">
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
