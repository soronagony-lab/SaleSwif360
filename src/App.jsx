import { useState } from 'react'
import { ShopProvider } from '@/context/ShopContext'
import { StoreFront } from '@/components/store/StoreFront'
import { AdminPanel } from '@/components/admin/AdminPanel'

function AppShell() {
  const [view, setView] = useState('store')

  return (
    <>
      {view === 'store' ? (
        <StoreFront onEnterAdmin={() => setView('admin')} />
      ) : (
        <AdminPanel onLeave={() => setView('store')} />
      )}
    </>
  )
}

export default function App() {
  return (
    <ShopProvider>
      <AppShell />
    </ShopProvider>
  )
}
