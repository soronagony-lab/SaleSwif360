import { useMemo } from 'react'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ShopProvider } from '@/context/ShopContext'
import { StoreFront } from '@/components/store/StoreFront'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AdminAuthModal } from '@/components/admin/AdminAuthModal'
import { AnalyticsGa4 } from '@/components/AnalyticsGa4'
import { Button } from '@/components/ui/button'

function AdminRoute() {
  const navigate = useNavigate()
  const { user, isAdmin, loading: authLoading, signOut } = useAuth()

  const ok = useMemo(
    () => !authLoading && user && isAdmin,
    [authLoading, user, isAdmin]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600 text-sm">
        Chargement…
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 max-w-md">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-800/80 text-orange-400 mb-4 ring-2 ring-teal-700">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Administration
          </h1>
          {user && !isAdmin ? (
            <p className="text-sm text-teal-200/90 leading-relaxed">
              Le compte <strong className="text-white">{user.email}</strong>{' '}
              n’est pas autorisé. Ajoutez cet e-mail dans{' '}
              <code className="text-xs bg-teal-950/60 px-1 rounded">
                VITE_ADMIN_EMAILS
              </code>{' '}
              sur Vercel, ou connectez-vous avec un compte admin.
            </p>
          ) : (
            <p className="text-sm text-teal-200/90">
              Connectez-vous pour gérer commandes, produits et prospection.
            </p>
          )}
        </div>
        <AdminAuthModal
          open
          onOpenChange={(open) => {
            if (!open) navigate('/')
          }}
          onSuccess={() => navigate('/admin', { replace: true })}
        />
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {user && !isAdmin && (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-teal-600 bg-teal-950/40 text-teal-100 hover:bg-teal-800"
              onClick={() => signOut()}
            >
              Changer de compte
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-teal-200 hover:text-white hover:bg-teal-800/50"
            onClick={() => navigate('/')}
          >
            Retour à la boutique
          </Button>
        </div>
      </div>
    )
  }

  return <AdminPanel onLeave={() => navigate('/')} />
}

function AppShell() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoute />} />
      <Route path="/*" element={<StoreFront />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <AnalyticsGa4 />
          <AppShell />
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
