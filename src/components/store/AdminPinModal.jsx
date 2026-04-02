import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PIN = '1234'

export function AdminPinModal({ open, onOpenChange, onSuccess }) {
  const [pin, setPin] = useState('')

  const handleValidate = () => {
    if (pin === ADMIN_PIN) {
      onSuccess()
      onOpenChange(false)
      setPin('')
    } else {
      window.alert('Code incorrect')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="max-w-sm text-center p-8">
        <DialogHeader className="border-0 p-0 space-y-2 text-center">
          <ShieldAlert className="w-16 h-16 text-teal-600 mx-auto" />
          <DialogTitle className="text-center">Accès Restreint</DialogTitle>
          <DialogDescription className="text-center">
            Veuillez entrer votre code secret d&apos;administration.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Code (ex: 1234)"
          className="text-center tracking-[0.5em] text-xl font-bold"
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
        />
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1 rounded-xl py-6"
            onClick={() => {
              onOpenChange(false)
              setPin('')
            }}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 rounded-xl py-6"
            onClick={handleValidate}
          >
            Valider
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
