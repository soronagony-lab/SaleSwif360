import { useMemo, useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ShopProvider } from '@/context/ShopContext'
import { StoreFront } from '@/components/store/StoreFront'
import { AdminPanel } from '@/components/admin/AdminPanel'

function AppShell() {
  const [view, setView] = useState('store')
  const { user, isAdmin, loading: authLoading } = useAuth()

  const effectiveView = useMemo(() => {
    if (view !== 'admin') return view
    if (authLoading) return 'store'
    if (!user || !isAdmin) return 'store'
    return 'admin'
  }, [view, authLoading, user, isAdmin])

  return (
    <>
      {effectiveView === 'store' ? (
        <StoreFront onEnterAdmin={() => setView('admin')} />
      ) : (
        <AdminPanel onLeave={() => setView('store')} />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <AppShell />
      </ShopProvider>
    </AuthProvider>
  )
}
