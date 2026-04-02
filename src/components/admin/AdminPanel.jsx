import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { parseAdminPath, pathForAdminPage } from '@/lib/adminPaths'
import {
  Box,
  Download,
  Edit2,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Truck,
  ArrowDownUp,
  LogOut,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useShop } from '@/context/ShopContext'
import { ProductImage } from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice, normalizePhoneForWhatsApp } from '@/lib/format'
import { useAdminConfig } from '@/hooks/useAdminConfig'
import { OrderDetailDialog } from '@/components/admin/OrderDetailDialog'

function interpolateWaTemplate(body, row, shopName) {
  const prix =
    row.lastOrder?.price != null
      ? formatPrice(row.lastOrder.price)
      : ''
  return String(body || '')
    .replace(/\{\{nom\}\}/g, row.customerName || '')
    .replace(/\{\{boutique\}\}/g, shopName || '')
    .replace(/\{\{produit\}\}/g, row.lastProduct || '')
    .replace(/\{\{prix\}\}/g, prix)
}

function exportCsv(filename, rows) {
  const blob = new Blob([`\uFEFF${rows.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function AdminNavLink({ icon, label, active, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 shrink-0 md:shrink ${
        active
          ? 'bg-teal-800 text-white shadow-md font-bold'
          : 'text-teal-200 hover:bg-teal-800/50 hover:text-white font-medium'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-orange-400' : ''}`}>{icon}</span>
      <span className="hidden md:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`ml-auto text-xs font-black px-2.5 py-1 rounded-full hidden md:inline ${
            active
              ? 'bg-orange-500 text-white'
              : 'bg-teal-800 text-teal-100'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-black text-gray-900">
          {value}
        </div>
        <div className="text-gray-500 text-xs md:text-sm font-medium mt-1">
          {title}
        </div>
      </div>
    </div>
  )
}

export function AdminPanel({ onLeave }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { page: adminPage, invalid: adminPathInvalid } = useMemo(
    () => parseAdminPath(location.pathname),
    [location.pathname]
  )

  useEffect(() => {
    if (adminPathInvalid) navigate('/admin', { replace: true })
  }, [adminPathInvalid, navigate])

  const { user, signOut } = useAuth()
  const {
    products,
    setProducts,
    orders,
    settings,
    updateSettings,
    patchOrder,
    deleteOrder,
  } = useShop()

  const { config, setConfig } = useAdminConfig()

  const handleLogout = async () => {
    await signOut()
    onLeave()
  }

  const userInitial = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProductImages, setNewProductImages] = useState([])
  const [orderDialogId, setOrderDialogId] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerCityFilter, setCustomerCityFilter] = useState('')
  const [customerSort, setCustomerSort] = useState('recent')
  const [marketingSelected, setMarketingSelected] = useState(() => new Set())
  const [marketingTemplateId, setMarketingTemplateId] = useState('')
  const [newZone, setNewZone] = useState({ name: '', fee: '', note: '' })
  const [newCourier, setNewCourier] = useState({
    name: '',
    phone: '',
    active: true,
  })
  const [editingZoneId, setEditingZoneId] = useState(null)
  const [newCollab, setNewCollab] = useState({
    name: '',
    email: '',
    role: 'Service client',
  })

  const totalRevenue = orders
    .filter((o) => o.status === 'Livrée')
    .reduce((sum, order) => sum + order.price, 0)
  const totalOrders = orders.length
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.price * (p.stock || 0),
    0
  )

  const customerAggregates = useMemo(() => {
    const map = new Map()
    for (const o of orders) {
      const key = normalizePhoneForWhatsApp(o.phone)
      if (!map.has(key)) {
        map.set(key, {
          key,
          customerName: o.customerName,
          phone: o.phone,
          city: o.city || '',
          orders: [],
        })
      }
      map.get(key).orders.push(o)
    }
    return Array.from(map.values()).map((row) => {
      const sorted = [...row.orders].sort(
        (a, b) => Number(b.id) - Number(a.id)
      )
      const last = sorted[0]
      const totalLivré = sorted
        .filter((x) => x.status === 'Livrée')
        .reduce((s, x) => s + Number(x.price || 0), 0)
      return {
        ...row,
        orderCount: sorted.length,
        lastOrder: last,
        lastDate: last?.date ?? '',
        lastProduct: last?.productName ?? '',
        totalSpentDelivered: totalLivré,
      }
    })
  }, [orders])

  const customerCities = useMemo(() => {
    const s = new Set()
    for (const o of orders) {
      if (o.city?.trim()) s.add(o.city.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [orders])

  const filteredCustomers = useMemo(() => {
    let rows = customerAggregates
    const q = customerSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
    }
    if (customerCityFilter) {
      rows = rows.filter(
        (r) =>
          (r.city || '').toLowerCase() === customerCityFilter.toLowerCase()
      )
    }
    const next = [...rows]
    if (customerSort === 'name') {
      next.sort((a, b) =>
        a.customerName.localeCompare(b.customerName, 'fr')
      )
    } else if (customerSort === 'orders') {
      next.sort((a, b) => b.orderCount - a.orderCount)
    } else {
      next.sort(
        (a, b) =>
          Number(b.lastOrder?.id || 0) - Number(a.lastOrder?.id || 0)
      )
    }
    return next
  }, [
    customerAggregates,
    customerSearch,
    customerCityFilter,
    customerSort,
  ])

  const updateOrderStatus = (id, newStatus) => {
    patchOrder(id, { status: newStatus })
  }

  const orderForDialog = useMemo(
    () => orders.find((o) => o.id === orderDialogId) ?? null,
    [orders, orderDialogId]
  )

  const appendCampaignLog = useCallback(
    (entry) => {
      setConfig((c) => ({
        ...c,
        campaignLog: [
          { ...entry, at: new Date().toISOString() },
          ...(c.campaignLog || []),
        ].slice(0, 100),
      }))
    },
    [setConfig]
  )

  useEffect(() => {
    const t = config.whatsappTemplates
    if (t?.length && !marketingTemplateId) {
      setMarketingTemplateId(t[0].id)
    }
  }, [config.whatsappTemplates, marketingTemplateId])

  const toggleMarketingRow = useCallback((key) => {
    setMarketingSelected((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }, [])

  const [newWaTemplate, setNewWaTemplate] = useState({
    title: '',
    angle: 'information',
    body: '',
  })

  const runBulkWhatsApp = useCallback(() => {
    const tpl = config.whatsappTemplates?.find(
      (t) => t.id === marketingTemplateId
    )
    if (!tpl) {
      window.alert('Choisissez un modèle WhatsApp.')
      return
    }
    const targets = customerAggregates.filter((c) =>
      marketingSelected.has(c.key)
    )
    if (targets.length === 0) {
      window.alert('Cochez au moins un client.')
      return
    }
    appendCampaignLog({
      mode: 'bulk',
      templateId: tpl.id,
      templateTitle: tpl.title,
      count: targets.length,
      phones: targets.map((t) => t.phone),
    })
    targets.forEach((row, i) => {
      const body = interpolateWaTemplate(
        tpl.body,
        { ...row, lastProduct: row.lastProduct },
        settings.shopName
      )
      const phone = normalizePhoneForWhatsApp(row.phone)
      const href = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
      window.setTimeout(() => {
        window.open(href, '_blank', 'noopener,noreferrer')
      }, i * 800)
    })
  }, [
    appendCampaignLog,
    config.whatsappTemplates,
    customerAggregates,
    marketingSelected,
    marketingTemplateId,
    settings.shopName,
  ])

  const updateProductStock = (id, delta) => {
    setProducts(
      products.map((p) => {
        if (p.id !== id) return p
        const newStock = Math.max(0, (p.stock || 0) + delta)
        return { ...p, stock: newStock }
      })
    )
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length + newProductImages.length > 4) {
      window.alert('Maximum 4 images par produit.')
      return
    }
    const promises = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.readAsDataURL(file)
        })
    )
    Promise.all(promises).then((base64Images) => {
      setNewProductImages((prev) => [...prev, ...base64Images])
    })
  }

  const removeNewImage = (index) => {
    setNewProductImages((prev) => prev.filter((_, i) => i !== index))
  }

  const getWhatsAppLink = (order) => {
    const phone = normalizePhoneForWhatsApp(order.phone)
    const message = `Bonjour ${order.customerName},\n\nNous avons bien reçu votre commande sur *${settings.shopName}* pour: *${order.productName}* (${formatPrice(order.price)}).\n\nAdresse: ${order.city}, ${order.address}.\n\nQuand souhaitez-vous être livré ?`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const adminTitle =
    adminPage === 'dashboard'
      ? "Vue d'ensemble"
      : {
          orders: 'Gestion des commandes',
          products: 'Catalogue produits',
          customers: 'Base clients',
          marketing: 'Marketing & relances',
          logistics: 'Logistique',
          settings: 'Configuration',
        }[adminPage] || ''

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="bg-teal-900 text-teal-100 w-full md:w-64 shrink-0 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center px-4 md:px-6 bg-teal-950 text-white border-b border-teal-800">
          <ShoppingBag className="h-6 w-6 mr-3 text-orange-500 shrink-0" />
          <span className="font-bold text-lg md:text-xl tracking-tight truncate">
            {settings.shopName}
          </span>
        </div>
        <nav className="flex-1 py-4 px-2 md:px-4 flex flex-row md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-y-auto">
          <AdminNavLink
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Tableau de bord"
            active={adminPage === 'dashboard'}
            onClick={() => navigate(pathForAdminPage('dashboard'))}
          />
          <AdminNavLink
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Commandes"
            active={adminPage === 'orders'}
            onClick={() => navigate(pathForAdminPage('orders'))}
            badge={orders.length}
          />
          <AdminNavLink
            icon={<Package className="w-5 h-5" />}
            label="Produits"
            active={adminPage === 'products'}
            onClick={() => navigate(pathForAdminPage('products'))}
          />
          <AdminNavLink
            icon={<Users className="w-5 h-5" />}
            label="Clients"
            active={adminPage === 'customers'}
            onClick={() => navigate(pathForAdminPage('customers'))}
          />
          <AdminNavLink
            icon={<Megaphone className="w-5 h-5" />}
            label="Marketing"
            active={adminPage === 'marketing'}
            onClick={() => navigate(pathForAdminPage('marketing'))}
          />
          <AdminNavLink
            icon={<Truck className="w-5 h-5" />}
            label="Logistique"
            active={adminPage === 'logistics'}
            onClick={() => navigate(pathForAdminPage('logistics'))}
          />
          <AdminNavLink
            icon={<Settings className="w-5 h-5" />}
            label="Configuration"
            active={adminPage === 'settings'}
            onClick={() => navigate(pathForAdminPage('settings'))}
          />
        </nav>
        <div className="p-4 border-t border-teal-800 hidden md:block space-y-2">
          {user?.email && (
            <p className="text-xs text-teal-400/90 px-2 truncate" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center text-teal-300 hover:text-white transition w-full p-3 rounded-xl hover:bg-teal-800 font-medium border-0 bg-transparent cursor-pointer"
          >
            <ExternalLink className="w-5 h-5 mr-3" /> Voir la boutique
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center text-teal-300 hover:text-white transition w-full p-3 rounded-xl hover:bg-teal-800 font-medium border-0 bg-transparent cursor-pointer"
          >
            <LogOut className="w-5 h-5 mr-3" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 md:h-screen overflow-hidden">
        <header className="bg-white h-16 border-b flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
          <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate pr-2">
            {adminTitle}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="md:hidden rounded-lg text-sm"
              onClick={onLeave}
            >
              Boutique
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600"
              onClick={handleLogout}
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <div
              className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm ring-2 ring-orange-200 text-xs"
              title={user?.email || ''}
            >
              {userInitial}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50">
          {adminPage === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                <StatCard
                  title="Revenus (livré)"
                  value={formatPrice(totalRevenue)}
                  icon={<TrendingUp className="text-teal-600 w-5 h-5" />}
                  color="bg-teal-50"
                />
                <StatCard
                  title="Commandes"
                  value={totalOrders}
                  icon={<ShoppingCart className="text-orange-500 w-5 h-5" />}
                  color="bg-orange-50"
                />
                <StatCard
                  title="Produits"
                  value={products.length}
                  icon={<Package className="text-blue-500 w-5 h-5" />}
                  color="bg-blue-50"
                />
                <StatCard
                  title="Val. inventaire"
                  value={formatPrice(totalInventoryValue)}
                  icon={<Box className="text-indigo-500 w-5 h-5" />}
                  color="bg-indigo-50"
                />
                <StatCard
                  title="Clients"
                  value={customerAggregates.length}
                  icon={<Users className="text-purple-500 w-5 h-5" />}
                  color="bg-purple-50"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">
                      Commandes récentes
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate(pathForAdminPage('orders'))}
                      className="text-teal-600 text-sm font-medium hover:underline border-0 bg-transparent cursor-pointer p-0"
                    >
                      Voir tout
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                      En attente de la première commande…
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[480px]">
                        <tbody className="text-sm divide-y divide-gray-100">
                          {orders.slice(0, 5).map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50">
                              <td className="p-4">
                                <div className="font-bold text-gray-900">
                                  {o.customerName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {o.date}
                                </div>
                              </td>
                              <td className="p-4 text-gray-600 font-medium">
                                {o.productName}
                              </td>
                              <td className="p-4 font-black text-orange-500 text-right whitespace-nowrap">
                                {formatPrice(o.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Produits en vue</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {products.slice(0, 3).map((p, i) => (
                      <div key={p.id} className="flex items-center space-x-3">
                        <span className="font-bold text-gray-300 text-lg">
                          #{i + 1}
                        </span>
                        <ProductImage
                          src={p.images[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">
                            {p.name}
                          </p>
                          <p
                            className={`text-xs font-medium ${(p.stock || 0) > 0 ? 'text-teal-600' : 'text-red-600'}`}
                          >
                            {(p.stock || 0) > 0 ? 'En stock' : 'Rupture'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminPage === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-2">
                <h3 className="font-bold text-gray-800 text-lg">
                  Liste des commandes
                </h3>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                  {orders.length} au total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="p-4 font-bold">Réf / date</th>
                      <th className="p-4 font-bold">Client</th>
                      <th className="p-4 font-bold">Livraison</th>
                      <th className="p-4 font-bold">Produit</th>
                      <th className="p-4 font-bold text-center">Statut</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                          Aucune commande reçue.
                        </td>
                      </tr>
                    )}
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="p-4 align-top">
                          <div className="font-bold text-teal-700">
                            #{String(o.id).slice(-5)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {String(o.date).split(' ')[0]}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-bold text-gray-900">{o.customerName}</div>
                          <div className="text-gray-500 flex items-center mt-1 text-xs">
                            <Phone className="w-3 h-3 mr-1 shrink-0" /> {o.phone}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded w-max text-xs">
                            {o.city}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">{o.address}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-medium text-gray-800 truncate max-w-[150px]">
                            {o.productName}
                          </div>
                          <div className="font-black text-orange-500 mt-1 whitespace-nowrap">
                            {formatPrice(o.price)}
                          </div>
                        </td>
                        <td className="p-4 align-top text-center">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateOrderStatus(o.id, e.target.value)
                            }
                            className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border-2 appearance-none text-center max-w-full ${
                              o.status === 'Nouvelle'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : o.status === 'En cours'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : o.status === 'Livrée'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <option value="Nouvelle">Nouvelle</option>
                            <option value="En cours">En cours</option>
                            <option value="Livrée">Livrée</option>
                            <option value="Annulée">Annulée</option>
                          </select>
                        </td>
                        <td className="p-4 align-top text-right">
                          <div className="flex flex-wrap gap-1.5 justify-end items-center">
                            <button
                              type="button"
                              onClick={() => setOrderDialogId(o.id)}
                              className="inline-flex items-center justify-center bg-teal-100 hover:bg-teal-200 text-teal-800 px-2.5 py-2 rounded-xl font-bold text-xs border-0 cursor-pointer"
                              title="Voir le détail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    'Supprimer cette commande ?'
                                  )
                                ) {
                                  deleteOrder(o.id)
                                }
                              }}
                              className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-2 rounded-xl font-bold text-xs border-0 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <a
                              href={getWhatsAppLink(o)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20b856] text-white px-2.5 py-2 rounded-xl font-bold transition-transform hover:scale-105 shadow-sm text-xs"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminPage === 'products' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                    {editingProduct ? (
                      <>
                        <Edit2 className="w-6 h-6 text-orange-500 bg-orange-100 rounded-full p-1" />
                        Modifier le produit
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-teal-600 bg-teal-100 rounded-full p-1" />
                        Nouveau produit
                      </>
                    )}
                  </h3>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null)
                        setNewProductImages([])
                      }}
                      className="text-sm font-medium text-gray-500 hover:text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border-0 cursor-pointer"
                    >
                      Annuler la modification
                    </button>
                  )}
                </div>
                <form
                  key={editingProduct ? editingProduct.id : 'new'}
                  onSubmit={(e) => {
                    e.preventDefault()
                    const hasExistingImages =
                      editingProduct && editingProduct.images?.length > 0
                    if (
                      newProductImages.length === 0 &&
                      !hasExistingImages
                    ) {
                      window.alert('Veuillez ajouter au moins une image.')
                      return
                    }
                    const formData = new FormData(e.target)
                    const prodData = {
                      name: formData.get('name'),
                      price: parseInt(String(formData.get('price')), 10),
                      stock: parseInt(String(formData.get('stock')), 10),
                      description: formData.get('description'),
                      detailedDescription: formData.get('detailedDescription'),
                      images:
                        newProductImages.length > 0
                          ? newProductImages
                          : editingProduct?.images || [],
                    }
                    if (editingProduct) {
                      setProducts(
                        products.map((p) =>
                          p.id === editingProduct.id
                            ? { ...p, ...prodData }
                            : p
                        )
                      )
                      setEditingProduct(null)
                    } else {
                      setProducts([{ id: Date.now(), ...prodData }, ...products])
                    }
                    e.target.reset()
                    setNewProductImages([])
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Photos du produit (max 4)</Label>
                    <div className="flex flex-wrap gap-4 mb-2">
                      {editingProduct &&
                        newProductImages.length === 0 &&
                        editingProduct.images?.map((img, idx) => (
                          <div
                            key={`old-${idx}`}
                            className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm opacity-60"
                          >
                            <img
                              src={img}
                              alt="Actuelle"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      {newProductImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group"
                        >
                          <img
                            src={img}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer"
                          >
                            <Trash2 className="text-white w-6 h-6" />
                          </button>
                        </div>
                      ))}
                      {newProductImages.length < 4 && (
                        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-teal-300 flex flex-col items-center justify-center text-teal-600 cursor-pointer hover:bg-teal-50 transition-colors">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-xs font-medium">
                            {editingProduct ? 'Remplacer' : 'Ajouter'}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Nom du produit</Label>
                    <Input
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      placeholder="Ex: Smart TV 55 pouces"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Prix (FCFA)</Label>
                    <Input
                      name="price"
                      defaultValue={editingProduct?.price}
                      required
                      type="number"
                      placeholder="Ex: 150000"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Stock initial</Label>
                    <Input
                      name="stock"
                      defaultValue={editingProduct?.stock ?? 10}
                      required
                      type="number"
                      min={0}
                      placeholder="Ex: 15"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Description courte (catalogue)</Label>
                    <textarea
                      name="description"
                      defaultValue={editingProduct?.description}
                      required
                      rows={2}
                      maxLength={100}
                      className="flex w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus-visible:border-teal-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                      placeholder="Ex: TV 4K Ultra HD avec Android intégré."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Description détaillée (page produit)</Label>
                    <textarea
                      name="detailedDescription"
                      defaultValue={editingProduct?.detailedDescription}
                      required
                      rows={4}
                      className="flex w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus-visible:border-teal-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                      placeholder="Détaillez les caractéristiques, la garantie, etc."
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-2">
                    <Button
                      type="submit"
                      variant={editingProduct ? 'accent' : 'default'}
                      size="lg"
                      className="w-full md:w-auto rounded-xl"
                    >
                      {editingProduct
                        ? 'Enregistrer les modifications'
                        : 'Publier le produit'}
                    </Button>
                  </div>
                </form>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-4">
                  Produits en ligne ({products.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col group relative"
                    >
                      <div className="absolute top-2 right-2 flex space-x-1 z-10">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          {p.images?.length ?? 0}
                        </div>
                        <div
                          className={`text-white text-xs px-2 py-1 rounded-md flex items-center font-bold shadow-sm ${
                            (p.stock || 0) > 0 ? 'bg-teal-600' : 'bg-red-500'
                          }`}
                        >
                          <Box className="w-3 h-3 mr-1" /> {p.stock ?? 0}
                        </div>
                      </div>
                      <ProductImage
                        src={p.images?.[0]}
                        alt=""
                        className="h-40 w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-4 flex flex-col flex-grow bg-white z-10">
                        <div className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                          {p.name}
                        </div>
                        <div className="text-orange-500 font-black mb-4 whitespace-nowrap">
                          {formatPrice(p.price)}
                        </div>
                        <div className="mt-auto border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button
                              type="button"
                              onClick={() => updateProductStock(p.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded text-gray-600 font-bold shadow-sm border-0 cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold w-6 text-center text-gray-700">
                              {p.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateProductStock(p.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-teal-50 hover:bg-teal-100 text-teal-700 rounded font-bold shadow-sm border-0 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p)
                                setNewProductImages([])
                                window.scrollTo(0, 0)
                              }}
                              className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border-0 cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProducts(products.filter((pr) => pr.id !== p.id))
                              }
                              className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors border-0 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminPage === 'customers' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">
                    Répertoire clients
                  </h3>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                    {filteredCustomers.length} affiché(s) /{' '}
                    {customerAggregates.length} total
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <Label className="mb-1 block text-xs">Recherche</Label>
                    <Input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Nom ou téléphone"
                      className="h-10"
                    />
                  </div>
                  <div className="min-w-[140px]">
                    <Label className="mb-1 block text-xs">Ville</Label>
                    <select
                      value={customerCityFilter}
                      onChange={(e) => setCustomerCityFilter(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="">Toutes</option>
                      {customerCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[160px]">
                    <Label className="mb-1 block text-xs">Tri</Label>
                    <select
                      value={customerSort}
                      onChange={(e) => setCustomerSort(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium"
                    >
                      <option value="recent">Plus récent</option>
                      <option value="name">Nom (A→Z)</option>
                      <option value="orders">Nb commandes</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl shrink-0"
                    onClick={() => {
                      const lines = [
                        [
                          'Nom',
                          'Téléphone',
                          'Ville',
                          'Commandes',
                          'Dernière date',
                          'Dernier produit',
                          'CA livré (FCFA)',
                        ].join(';'),
                        ...filteredCustomers.map((c) =>
                          [
                            c.customerName,
                            c.phone,
                            c.city || '',
                            String(c.orderCount),
                            c.lastDate,
                            c.lastProduct,
                            String(c.totalSpentDelivered),
                          ].join(';')
                        ),
                      ]
                      exportCsv(
                        `clients-${new Date().toISOString().slice(0, 10)}.csv`,
                        lines
                      )
                    }}
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[720px]">
                  <thead>
                    <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="p-4 font-bold">Client</th>
                      <th className="p-4 font-bold">Contact</th>
                      <th className="p-4 font-bold">Localisation</th>
                      <th className="p-4 font-bold text-center">Cmd.</th>
                      <th className="p-4 font-bold">Dernière commande</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-500">
                          Aucun client ne correspond aux filtres.
                        </td>
                      </tr>
                    )}
                    {filteredCustomers.map((c) => (
                      <tr key={c.key} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold mr-3">
                              {c.customerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">
                              {c.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-gray-700">
                          {c.phone}
                        </td>
                        <td className="p-4 text-gray-600">
                          {c.city || '—'}
                        </td>
                        <td className="p-4 text-center font-bold text-teal-700">
                          {c.orderCount}
                        </td>
                        <td className="p-4 text-gray-700">
                          <div className="text-xs text-gray-500">{c.lastDate}</div>
                          <div className="font-medium text-gray-900 truncate max-w-[220px]">
                            {c.lastProduct}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminPage === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-teal-600" />
                  Campagnes & relances WhatsApp
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Modèles avec variables :{' '}
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {'{{nom}} {{boutique}} {{produit}} {{prix}}'}
                  </code>
                  . Les envois groupés ouvrent un onglet WhatsApp par client
                  (délai 0,8 s) — autorisez les pop-ups si besoin.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div>
                    <Label className="mb-2 block">Message par défaut (fallback)</Label>
                    <textarea
                      value={settings.relanceMessage}
                      onChange={(e) =>
                        updateSettings({ relanceMessage: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus-visible:border-teal-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="mb-2 block">Nouveau modèle</Label>
                    <Input
                      value={newWaTemplate.title}
                      onChange={(e) =>
                        setNewWaTemplate((s) => ({
                          ...s,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Titre interne"
                      className="mb-2"
                    />
                    <select
                      value={newWaTemplate.angle}
                      onChange={(e) =>
                        setNewWaTemplate((s) => ({
                          ...s,
                          angle: e.target.value,
                        }))
                      }
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm mb-2"
                    >
                      <option value="information">Information</option>
                      <option value="marketing">Marketing</option>
                    </select>
                    <textarea
                      value={newWaTemplate.body}
                      onChange={(e) =>
                        setNewWaTemplate((s) => ({
                          ...s,
                          body: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Texte du message WhatsApp…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                    />
                    <Button
                      type="button"
                      className="rounded-xl w-full"
                      onClick={() => {
                        if (
                          !newWaTemplate.title.trim() ||
                          !newWaTemplate.body.trim()
                        )
                          return
                        setConfig((c) => ({
                          ...c,
                          whatsappTemplates: [
                            ...(c.whatsappTemplates || []),
                            {
                              id: `wt_${Date.now()}`,
                              title: newWaTemplate.title.trim(),
                              angle: newWaTemplate.angle,
                              body: newWaTemplate.body.trim(),
                            },
                          ],
                        }))
                        setNewWaTemplate({
                          title: '',
                          angle: 'information',
                          body: '',
                        })
                      }}
                    >
                      <Plus className="w-4 h-4" /> Ajouter le modèle
                    </Button>
                  </div>
                </div>
                <div className="mb-4 space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase">
                    Modèles enregistrés
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(config.whatsappTemplates || []).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl pl-3 pr-1 py-1 text-sm"
                      >
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">
                          {t.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.angle === 'marketing'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.angle === 'marketing' ? 'Mkt' : 'Info'}
                        </span>
                        <button
                          type="button"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border-0 cursor-pointer"
                          title="Supprimer"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              whatsappTemplates: (
                                c.whatsappTemplates || []
                              ).filter((x) => x.id !== t.id),
                            }))
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-end mb-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="mb-1 block text-xs">Modèle pour la liste</Label>
                    <select
                      value={marketingTemplateId}
                      onChange={(e) => setMarketingTemplateId(e.target.value)}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium"
                    >
                      {(config.whatsappTemplates || []).map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.angle === 'marketing' ? 'Mkt' : 'Info'}] {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="accent"
                    className="rounded-xl"
                    onClick={runBulkWhatsApp}
                  >
                    Envoi groupé (sélection)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      if (marketingSelected.size === customerAggregates.length) {
                        setMarketingSelected(new Set())
                      } else {
                        setMarketingSelected(
                          new Set(customerAggregates.map((c) => c.key))
                        )
                      }
                    }}
                  >
                    Tout sélectionner / désélectionner
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[520px]">
                    <thead>
                      <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="p-3 w-10" aria-label="Sélection" />
                        <th className="p-4 font-bold">Client</th>
                        <th className="p-4 font-bold">Contact</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                      {customerAggregates.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            Aucun client à relancer.
                          </td>
                        </tr>
                      )}
                      {customerAggregates.map((c) => {
                        const tpl = config.whatsappTemplates?.find(
                          (t) => t.id === marketingTemplateId
                        )
                        const body = tpl
                          ? interpolateWaTemplate(
                              tpl.body,
                              {
                                ...c,
                                lastProduct: c.lastProduct,
                              },
                              settings.shopName
                            )
                          : settings.relanceMessage
                        const href = `https://wa.me/${normalizePhoneForWhatsApp(c.phone)}?text=${encodeURIComponent(body)}`
                        return (
                          <tr key={`m-${c.key}`} className="hover:bg-gray-50">
                            <td className="p-3 align-middle">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={marketingSelected.has(c.key)}
                                onChange={() => toggleMarketingRow(c.key)}
                              />
                            </td>
                            <td className="p-4 font-bold text-gray-900">
                              {c.customerName}
                            </td>
                            <td className="p-4 text-gray-600">{c.phone}</td>
                            <td className="p-4 text-right">
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() =>
                                  appendCampaignLog({
                                    mode: 'single',
                                    templateId: tpl?.id,
                                    phone: c.phone,
                                  })
                                }
                                className="inline-flex items-center bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl font-bold transition-colors text-xs"
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />{' '}
                                Relancer
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ArrowDownUp className="w-4 h-4 text-gray-500" />
                    Suivi des envois (local)
                  </h4>
                  <ul className="space-y-2 max-h-48 overflow-y-auto text-xs text-gray-600">
                    {(config.campaignLog || []).length === 0 && (
                      <li className="text-gray-400">Aucun envoi enregistré.</li>
                    )}
                    {(config.campaignLog || []).slice(0, 30).map((log, i) => (
                      <li
                        key={`${log.at}-${i}`}
                        className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                      >
                        <span className="font-mono text-gray-500">
                          {log.at?.slice(0, 19)?.replace('T', ' ')}
                        </span>{' '}
                        — {log.mode === 'bulk' ? 'Groupe' : 'Unitaire'}
                        {log.templateTitle
                          ? ` — ${log.templateTitle}`
                          : ''}{' '}
                        {log.count != null ? `(${log.count})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 md:max-w-3xl">
                <h3 className="font-bold text-gray-900 text-xl mb-6">Pixels tracking</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Facebook Pixel ID</Label>
                    <Input
                      value={settings.facebookPixelId}
                      onChange={(e) =>
                        updateSettings({ facebookPixelId: e.target.value })
                      }
                      placeholder="ex: 1601177617317072"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                      ID numérique uniquement (15–16 chiffres), sans espaces. Dans
                      le{' '}
                      <a
                        href="https://business.facebook.com/events_manager2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 underline font-medium"
                      >
                        Gestionnaire d’événements Meta
                      </a>
                      , ajoutez le domaine du site (ex. sale-swif360.vercel.app)
                      sous Paramètres du pixel → domaines autorisés, sinon les
                      événements peuvent rester « en attente ».
                    </p>
                  </div>
                  <div>
                    <Label className="mb-2 block">Google Analytics (GA4) ID</Label>
                    <Input
                      value={settings.ga4Id}
                      onChange={(e) => updateSettings({ ga4Id: e.target.value })}
                      placeholder="ex: G-XXXXXXXXXX"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Les pixels sont enregistrés automatiquement (synchronisation
                    serveur sous quelques secondes).
                  </p>
                </div>
              </div>
            </div>
          )}

          {adminPage === 'logistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start gap-2 mb-6 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                      <Truck className="w-6 h-6 text-teal-600" />
                      Zones de livraison
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl shrink-0"
                      onClick={() => {
                        const lines = [
                          ['Nom', 'Frais (FCFA)', 'Note'].join(';'),
                          ...(config.zones || []).map((z) =>
                            [
                              z.name,
                              String(z.fee ?? ''),
                              (z.note || '').replace(/;/g, ','),
                            ].join(';')
                          ),
                        ]
                        exportCsv(
                          `zones-livraison-${new Date().toISOString().slice(0, 10)}.csv`,
                          lines
                        )
                      }}
                    >
                      <Download className="w-4 h-4" /> Export
                    </Button>
                  </div>
                  <div className="space-y-3 mb-6">
                    {(config.zones || []).map((z) => (
                      <div
                        key={z.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        {editingZoneId === z.id ? (
                          <div className="flex-1 space-y-2 w-full">
                            <Input
                              defaultValue={z.name}
                              id={`zn-${z.id}`}
                              className="h-9"
                            />
                            <Input
                              defaultValue={String(z.fee)}
                              id={`zf-${z.id}`}
                              type="number"
                              className="h-9"
                            />
                            <Input
                              defaultValue={z.note || ''}
                              id={`znote-${z.id}`}
                              placeholder="Note"
                              className="h-9"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                  const name = document.getElementById(
                                    `zn-${z.id}`
                                  )?.value
                                  const fee = parseInt(
                                    String(
                                      document.getElementById(`zf-${z.id}`)
                                        ?.value || '0'
                                    ),
                                    10
                                  )
                                  const note =
                                    document.getElementById(
                                      `znote-${z.id}`
                                    )?.value || ''
                                  setConfig((c) => ({
                                    ...c,
                                    zones: (c.zones || []).map((x) =>
                                      x.id === z.id
                                        ? {
                                            ...x,
                                            name: name || x.name,
                                            fee: Number.isFinite(fee)
                                              ? fee
                                              : x.fee,
                                            note,
                                          }
                                        : x
                                    ),
                                  }))
                                  setEditingZoneId(null)
                                }}
                              >
                                OK
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => setEditingZoneId(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="font-bold text-gray-800 text-sm block">
                                {z.name}
                              </span>
                              {z.note ? (
                                <span className="text-xs text-gray-500">
                                  {z.note}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-teal-600 font-bold whitespace-nowrap">
                                {formatPrice(z.fee)}
                              </span>
                              <button
                                type="button"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border-0 cursor-pointer"
                                title="Modifier"
                                onClick={() => setEditingZoneId(z.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg border-0 cursor-pointer"
                                title="Supprimer"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Supprimer cette zone ?'
                                    )
                                  ) {
                                    setConfig((c) => ({
                                      ...c,
                                      zones: (c.zones || []).filter(
                                        (x) => x.id !== z.id
                                      ),
                                    }))
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-gray-700">
                      Nouvelle zone
                    </p>
                    <Input
                      value={newZone.name}
                      onChange={(e) =>
                        setNewZone((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Nom de la zone"
                    />
                    <Input
                      type="number"
                      value={newZone.fee}
                      onChange={(e) =>
                        setNewZone((s) => ({ ...s, fee: e.target.value }))
                      }
                      placeholder="Frais (FCFA)"
                    />
                    <Input
                      value={newZone.note}
                      onChange={(e) =>
                        setNewZone((s) => ({ ...s, note: e.target.value }))
                      }
                      placeholder="Note (optionnel)"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full rounded-xl"
                      onClick={() => {
                        if (!newZone.name.trim()) return
                        const fee = parseInt(String(newZone.fee || '0'), 10)
                        setConfig((c) => ({
                          ...c,
                          zones: [
                            ...(c.zones || []),
                            {
                              id: `z_${Date.now()}`,
                              name: newZone.name.trim(),
                              fee: Number.isFinite(fee) ? fee : 0,
                              note: newZone.note.trim(),
                            },
                          ],
                        }))
                        setNewZone({ name: '', fee: '', note: '' })
                      }}
                    >
                      <Plus className="w-4 h-4" /> Ajouter la zone
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    Livreurs
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Créez vos livreurs pour les assigner aux commandes (détail
                    commande).
                  </p>
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm font-medium border border-orange-100 mb-4">
                    {orders.filter((o) => o.status === 'Nouvelle').length}{' '}
                    commandes « Nouvelle » en attente.
                  </div>
                  <div className="space-y-3 mb-6">
                    {(config.couriers || []).map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-500">{c.phone || '—'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setConfig((cfg) => ({
                                ...cfg,
                                couriers: (cfg.couriers || []).map((x) =>
                                  x.id === c.id
                                    ? {
                                        ...x,
                                        active: !(x.active !== false),
                                      }
                                    : x
                                ),
                              }))
                            }
                            className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                              c.active === false
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {c.active === false ? 'Inactif' : 'Actif'}
                          </button>
                          <button
                            type="button"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg border-0 cursor-pointer"
                            title="Supprimer"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Supprimer ce livreur ?'
                                )
                              ) {
                                setConfig((cfg) => ({
                                  ...cfg,
                                  couriers: (cfg.couriers || []).filter(
                                    (x) => x.id !== c.id
                                  ),
                                }))
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-gray-700">
                      Nouveau livreur
                    </p>
                    <Input
                      value={newCourier.name}
                      onChange={(e) =>
                        setNewCourier((s) => ({
                          ...s,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nom"
                    />
                    <Input
                      value={newCourier.phone}
                      onChange={(e) =>
                        setNewCourier((s) => ({
                          ...s,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Téléphone"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={newCourier.active}
                        onChange={(e) =>
                          setNewCourier((s) => ({
                            ...s,
                            active: e.target.checked,
                          }))
                        }
                      />
                      Actif
                    </label>
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      onClick={() => {
                        if (!newCourier.name.trim()) return
                        setConfig((c) => ({
                          ...c,
                          couriers: [
                            ...(c.couriers || []),
                            {
                              id: `cr_${Date.now()}`,
                              name: newCourier.name.trim(),
                              phone: newCourier.phone.trim(),
                              active: newCourier.active,
                            },
                          ],
                        }))
                        setNewCourier({
                          name: '',
                          phone: '',
                          active: true,
                        })
                      }}
                    >
                      <Plus className="w-4 h-4" /> Ajouter le livreur
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminPage === 'settings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h3 className="font-bold text-gray-900 text-xl mb-8 flex items-center gap-2">
                <Settings className="w-6 h-6 text-teal-600" />
                Configuration générale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2">
                    Infos de la boutique
                  </h4>
                  <div>
                    <Label className="mb-2 block">Nom de la boutique</Label>
                    <Input
                      value={settings.shopName}
                      onChange={(e) =>
                        updateSettings({ shopName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      Numéro WhatsApp (service client)
                    </Label>
                    <Input
                      value={settings.whatsApp}
                      onChange={(e) =>
                        updateSettings({ whatsApp: e.target.value })
                      }
                      placeholder="+2250102030405"
                    />
                  </div>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() =>
                      window.alert('Configuration sauvegardée localement.')
                    }
                  >
                    Sauvegarder
                  </Button>
                </div>
                <div className="space-y-6">
                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2">
                    Équipe & collaborateurs
                  </h4>
                  <p className="text-xs text-gray-500">
                    Gestion locale (rôles pour référence interne). Les comptes
                    de connexion restent ceux de votre fournisseur d’auth.
                  </p>
                  <div className="space-y-3">
                    {(config.collaborators || []).length === 0 && (
                      <p className="text-sm text-gray-400 italic">
                        Aucun collaborateur enregistré.
                      </p>
                    )}
                    {(config.collaborators || []).map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center min-w-0">
                          <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold mr-3 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {member.email || '—'}
                            </p>
                            <p className="text-xs text-teal-600 font-medium">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setConfig((c) => ({
                                ...c,
                                collaborators: (c.collaborators || []).map(
                                  (x) =>
                                    x.id === member.id
                                      ? {
                                          ...x,
                                          active: !(x.active !== false),
                                        }
                                      : x
                                ),
                              }))
                            }
                            className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                              member.active === false
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {member.active === false ? 'Désactivé' : 'Actif'}
                          </button>
                          <button
                            type="button"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border-0 cursor-pointer"
                            title="Modifier"
                            onClick={() => {
                              const name = window.prompt('Nom', member.name)
                              if (name == null) return
                              const email = window.prompt(
                                'E-mail (optionnel)',
                                member.email || ''
                              )
                              if (email == null) return
                              const role = window.prompt(
                                'Rôle (Manager, Service client, Livreur, Admin)',
                                member.role || ''
                              )
                              if (role == null) return
                              setConfig((c) => ({
                                ...c,
                                collaborators: (c.collaborators || []).map(
                                  (x) =>
                                    x.id === member.id
                                      ? {
                                          ...x,
                                          name: name.trim() || x.name,
                                          email: email.trim(),
                                          role: role.trim() || x.role,
                                        }
                                      : x
                                ),
                              }))
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg border-0 cursor-pointer"
                            title="Supprimer"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Retirer ce collaborateur de la liste ?'
                                )
                              ) {
                                setConfig((c) => ({
                                  ...c,
                                  collaborators: (
                                    c.collaborators || []
                                  ).filter((x) => x.id !== member.id),
                                }))
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mt-4">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      Ajouter un collaborateur
                    </p>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="text"
                        placeholder="Nom complet"
                        className="w-full"
                        value={newCollab.name}
                        onChange={(e) =>
                          setNewCollab((s) => ({
                            ...s,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="email"
                        placeholder="E-mail (optionnel)"
                        className="w-full"
                        value={newCollab.email}
                        onChange={(e) =>
                          setNewCollab((s) => ({
                            ...s,
                            email: e.target.value,
                          }))
                        }
                      />
                      <select
                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                        value={newCollab.role}
                        onChange={(e) =>
                          setNewCollab((s) => ({
                            ...s,
                            role: e.target.value,
                          }))
                        }
                      >
                        <option value="Manager">Manager</option>
                        <option value="Service client">Service client</option>
                        <option value="Livreur">Livreur</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 w-full rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                      onClick={() => {
                        if (!newCollab.name.trim()) {
                          window.alert('Indiquez un nom.')
                          return
                        }
                        setConfig((c) => ({
                          ...c,
                          collaborators: [
                            ...(c.collaborators || []),
                            {
                              id: `col_${Date.now()}`,
                              name: newCollab.name.trim(),
                              email: newCollab.email.trim(),
                              role: newCollab.role,
                              active: true,
                            },
                          ],
                        }))
                        setNewCollab({
                          name: '',
                          email: '',
                          role: 'Service client',
                        })
                      }}
                    >
                      Enregistrer le collaborateur
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <OrderDetailDialog
          open={orderDialogId != null}
          onOpenChange={(open) => {
            if (!open) setOrderDialogId(null)
          }}
          order={orderForDialog}
          shopName={settings.shopName}
          zones={config.zones}
          couriers={config.couriers}
          relanceTemplates={config.whatsappTemplates}
          onPatchOrder={patchOrder}
          onDeleteOrder={deleteOrder}
        />
      </main>
    </div>
  )
}
