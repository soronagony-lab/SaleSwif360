import { useMemo, useState } from 'react'
import {
  Box,
  Edit2,
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
  User,
  Users,
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { ProductImage } from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice, normalizePhoneForWhatsApp } from '@/lib/format'

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
  const {
    products,
    setProducts,
    orders,
    setOrders,
    settings,
    updateSettings,
  } = useShop()
  const [adminPage, setAdminPage] = useState('dashboard')
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProductImages, setNewProductImages] = useState([])
  const [team] = useState([{ id: 1, name: 'Admin Principal', role: 'Propriétaire' }])

  const totalRevenue = orders
    .filter((o) => o.status === 'Livrée')
    .reduce((sum, order) => sum + order.price, 0)
  const totalOrders = orders.length
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.price * (p.stock || 0),
    0
  )

  const uniqueCustomers = useMemo(() => {
    const map = new Map()
    for (const o of orders) {
      const key = normalizePhoneForWhatsApp(o.phone)
      if (!map.has(key)) map.set(key, o)
    }
    return Array.from(map.values())
  }, [orders])

  const updateOrderStatus = (id, newStatus) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
  }

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

  const getRelanceLink = (phoneRaw) => {
    const phone = normalizePhoneForWhatsApp(phoneRaw)
    return `https://wa.me/${phone}?text=${encodeURIComponent(settings.relanceMessage)}`
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
            onClick={() => setAdminPage('dashboard')}
          />
          <AdminNavLink
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Commandes"
            active={adminPage === 'orders'}
            onClick={() => setAdminPage('orders')}
            badge={orders.length}
          />
          <AdminNavLink
            icon={<Package className="w-5 h-5" />}
            label="Produits"
            active={adminPage === 'products'}
            onClick={() => setAdminPage('products')}
          />
          <AdminNavLink
            icon={<Users className="w-5 h-5" />}
            label="Clients"
            active={adminPage === 'customers'}
            onClick={() => setAdminPage('customers')}
          />
          <AdminNavLink
            icon={<Megaphone className="w-5 h-5" />}
            label="Marketing"
            active={adminPage === 'marketing'}
            onClick={() => setAdminPage('marketing')}
          />
          <AdminNavLink
            icon={<Truck className="w-5 h-5" />}
            label="Logistique"
            active={adminPage === 'logistics'}
            onClick={() => setAdminPage('logistics')}
          />
          <AdminNavLink
            icon={<Settings className="w-5 h-5" />}
            label="Configuration"
            active={adminPage === 'settings'}
            onClick={() => setAdminPage('settings')}
          />
        </nav>
        <div className="p-4 border-t border-teal-800 hidden md:block">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center text-teal-300 hover:text-white transition w-full p-3 rounded-xl hover:bg-teal-800 font-medium border-0 bg-transparent cursor-pointer"
          >
            <ExternalLink className="w-5 h-5 mr-3" /> Voir la boutique
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
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm ring-2 ring-orange-200">
              AD
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
                  value={uniqueCustomers.length}
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
                      onClick={() => setAdminPage('orders')}
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
                          <a
                            href={getWhatsAppLink(o)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20b856] text-white px-3 py-2 rounded-xl font-bold transition-transform hover:scale-105 shadow-sm text-xs"
                            title="Contacter sur WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                          </a>
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
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-2">
                <h3 className="font-bold text-gray-800 text-lg">
                  Répertoire clients
                </h3>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                  {uniqueCustomers.length} clients
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[560px]">
                  <thead>
                    <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="p-4 font-bold">Client</th>
                      <th className="p-4 font-bold">Contact</th>
                      <th className="p-4 font-bold">Localisation (dernière)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {uniqueCustomers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-gray-500">
                          Aucun client enregistré.
                        </td>
                      </tr>
                    )}
                    {uniqueCustomers.map((c, i) => (
                      <tr key={`${c.phone}-${i}`} className="hover:bg-gray-50">
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
                        <td className="p-4 font-medium text-gray-700">{c.phone}</td>
                        <td className="p-4 text-gray-600">
                          {c.city}, {c.address}
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
                <div className="mb-6">
                  <Label className="mb-2 block">Message type de relance promo</Label>
                  <textarea
                    value={settings.relanceMessage}
                    onChange={(e) =>
                      updateSettings({ relanceMessage: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus-visible:border-teal-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[480px]">
                    <thead>
                      <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="p-4 font-bold">Client</th>
                        <th className="p-4 font-bold">Contact</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                      {uniqueCustomers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-500">
                            Aucun client à relancer.
                          </td>
                        </tr>
                      )}
                      {uniqueCustomers.map((c, i) => (
                        <tr key={`m-${c.phone}-${i}`} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">
                            {c.customerName}
                          </td>
                          <td className="p-4 text-gray-600">{c.phone}</td>
                          <td className="p-4 text-right">
                            <a
                              href={getRelanceLink(c.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl font-bold transition-colors text-xs"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" /> Relancer
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      placeholder="ex: 123456789012345"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Google Analytics (GA4) ID</Label>
                    <Input
                      value={settings.ga4Id}
                      onChange={(e) => updateSettings({ ga4Id: e.target.value })}
                      placeholder="ex: G-XXXXXXXXXX"
                    />
                  </div>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() =>
                      window.alert('Pixels enregistrés (prototype local).')
                    }
                  >
                    Enregistrer les pixels
                  </Button>
                </div>
              </div>
            </div>
          )}

          {adminPage === 'logistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
                    <Truck className="w-6 h-6 text-teal-600" />
                    Zones de livraison
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="font-bold text-gray-800 text-sm">
                        Abidjan Nord (Cocody, Bingerville…)
                      </span>
                      <span className="text-teal-600 font-bold whitespace-nowrap">
                        2 000 FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="font-bold text-gray-800 text-sm">
                        Abidjan Sud (Marcory, Koumassi…)
                      </span>
                      <span className="text-teal-600 font-bold whitespace-nowrap">
                        2 500 FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="font-bold text-gray-800 text-sm">
                        Intérieur du pays
                      </span>
                      <span className="text-teal-600 font-bold whitespace-nowrap">
                        5 000 FCFA
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-teal-300 hover:text-teal-600 transition-colors flex justify-center items-center gap-2 bg-transparent cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une zone
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 text-xl mb-6">
                    Assignation des coursiers
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Fonctionnalité à venir : connectez votre compte livreur ou
                    affectez vos commandes « En cours » à votre équipe.
                  </p>
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm font-medium border border-orange-100">
                    {orders.filter((o) => o.status === 'Nouvelle').length}{' '}
                    commandes en attente d&apos;expédition.
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
                    Équipe de gestion
                  </h4>
                  <div className="space-y-3">
                    {team.map((member) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold mr-3">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {member.name}
                            </p>
                            <p className="text-xs text-teal-600 font-medium">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mt-4">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      Ajouter un collaborateur
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        type="text"
                        placeholder="Nom complet"
                        className="flex-1 min-w-[140px]"
                      />
                      <select className="h-11 flex-1 min-w-[140px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm">
                        <option>Manager</option>
                        <option>Service client</option>
                        <option>Livreur</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 w-full rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Inviter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
