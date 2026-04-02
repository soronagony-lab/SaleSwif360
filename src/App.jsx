import { useMemo } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ShopProvider } from '@/context/ShopContext'
import { StoreFront } from '@/components/store/StoreFront'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AnalyticsGa4 } from '@/components/AnalyticsGa4'

function AdminRoute() {
  const navigate = useNavigate()
  const { user, isAdmin, loading: authLoading } = useAuth()

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
    return <Navigate to="/" replace />
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
