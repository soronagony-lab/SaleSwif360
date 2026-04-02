import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle,
  ChevronLeft,
  Lock,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  X,
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { ProductCard } from '@/components/ProductCard'
import { ProductImage } from '@/components/ProductImage'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderModal } from '@/components/store/OrderModal'
import { AdminAuthModal } from '@/components/admin/AdminAuthModal'
import { SeoHead } from '@/components/SeoHead'
import {
  initFacebookPixel,
  resolvePixelId,
  trackInitiateCheckout,
  trackPageView,
  trackPurchase,
  trackViewContent,
} from '@/lib/facebookPixel'

export function StoreFront({ onEnterAdmin }) {
  const {
    products,
    settings,
    submitOrder,
    remoteLoading,
    remoteError,
  } = useShop()
  const [storePage, setStorePage] = useState('home')
  const [storeBackPage, setStoreBackPage] = useState('home')
  const [currentProduct, setCurrentProduct] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderProduct, setOrderProduct] = useState(null)
  const [pinOpen, setPinOpen] = useState(false)

  const pixelId = resolvePixelId(settings.facebookPixelId)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await initFacebookPixel(pixelId)
      if (cancelled || typeof window === 'undefined' || !window.fbq) return
      trackPageView()
    })()
    return () => {
      cancelled = true
    }
  }, [pixelId, storePage, currentProduct?.id])

  useEffect(() => {
    if (storePage !== 'product' || !currentProduct) return
    trackViewContent(currentProduct)
  }, [storePage, currentProduct])

  const popularProducts = useMemo(
    () => products.filter((p) => (p.stock || 0) > 0).slice(0, 4),
    [products]
  )

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, catalogQuery])

  const goToProduct = (product, fromPage) => {
    setStoreBackPage(fromPage)
    setCurrentProduct(product)
    setStorePage('product')
    setActiveImageIndex(0)
    setIsMenuOpen(false)
    window.scrollTo(0, 0)
  }

  const goBackFromProduct = () => {
    setStorePage(storeBackPage)
    setCurrentProduct(null)
  }

  const openOrder = (product) => {
    setOrderProduct(product)
    setOrderModalOpen(true)
    trackInitiateCheckout(product)
  }

  const handleOrderSubmit = (payload) => {
    const orderId = submitOrder(payload)
    trackPurchase({
      id: orderId,
      productId: payload.productId,
      productName: payload.productName,
      price: payload.price,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-0">
      <SeoHead
        storePage={storePage}
        currentProduct={currentProduct}
        shopName={settings.shopName}
      />
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              className="flex items-center space-x-1 cursor-pointer bg-transparent border-0 p-0"
              onClick={() => {
                setStorePage('home')
                setCurrentProduct(null)
              }}
            >
              <ShoppingBag className="h-7 w-7 text-orange-500" />
              <span className="font-bold text-2xl tracking-tight flex items-baseline">
                <span className="text-orange-500">J&apos;</span>
                <span className="text-teal-600">achète</span>
                <span className="text-orange-500 text-lg">.ci</span>
              </span>
            </button>
            <nav className="hidden md:flex space-x-8 items-center">
              <button
                type="button"
                onClick={() => {
                  setStorePage('home')
                  setCurrentProduct(null)
                }}
                className={`hover:text-teal-600 transition-colors font-medium border-b-2 pb-0.5 ${
                  storePage === 'home' && !currentProduct
                    ? 'text-teal-600 border-teal-600'
                    : 'text-gray-600 border-transparent'
                }`}
              >
                Accueil
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorePage('catalog')
                  setCurrentProduct(null)
                }}
                className={`hover:text-teal-600 transition-colors font-medium border-b-2 pb-0.5 ${
                  storePage === 'catalog'
                    ? 'text-teal-600 border-teal-600'
                    : 'text-gray-600 border-transparent'
                }`}
              >
                Catalogue
              </button>
            </nav>
            <button
              type="button"
              className="md:hidden p-2 text-teal-700"
              aria-label="Menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b px-4 py-4 space-y-3 shadow-lg absolute w-full z-50">
            <button
              type="button"
              onClick={() => {
                setStorePage('home')
                setCurrentProduct(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-teal-50 hover:text-teal-700"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => {
                setStorePage('catalog')
                setCurrentProduct(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-teal-50 hover:text-teal-700"
            >
              Catalogue complet
            </button>
          </div>
        )}
      </header>

      {remoteLoading && (
        <div className="bg-teal-50 text-teal-800 text-sm text-center py-2 border-b border-teal-100">
          Chargement du catalogue depuis le serveur…
        </div>
      )}
      {remoteError && !remoteLoading && (
        <div className="bg-amber-50 text-amber-900 text-sm text-center py-2 px-4 border-b border-amber-100">
          Catalogue en mode local (cache). Sync : {remoteError}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {storePage === 'home' && (
          <div className="space-y-10">
            <div className="relative bg-teal-700 rounded-3xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-transparent opacity-80 z-10" />
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80"
                alt="Shopping"
                className="w-full h-64 md:h-96 object-cover object-center"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 text-white w-full md:w-2/3">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full w-max mb-4 uppercase tracking-wider">
                  Paiement à la livraison
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                  Achetez en ligne,
                  <br />
                  sans stress !
                </h1>
                <p className="text-sm md:text-lg mb-6 text-teal-100 max-w-md">
                  Découvrez notre sélection de produits tendances. Commandez en 1
                  clic et payez uniquement à la réception.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStorePage('catalog')
                    setCurrentProduct(null)
                  }}
                  className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full w-max hover:bg-orange-600 transition shadow-lg text-base md:text-lg border-0 cursor-pointer"
                >
                  Voir les offres
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-teal-600 shrink-0" aria-hidden />
                Les plus populaires
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {popularProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => goToProduct(product, 'home')}
                  />
                ))}
              </div>
              {popularProducts.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Aucun produit en stock pour le moment.
                </p>
              )}
            </div>
          </div>
        )}

        {storePage === 'catalog' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Tout le catalogue
              </h2>
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Chercher un produit..."
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="pl-10 w-full md:w-72 shadow-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredCatalog.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => goToProduct(product, 'catalog')}
                />
              ))}
            </div>
            {filteredCatalog.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-200">
                Aucun produit ne correspond à votre recherche.
              </div>
            )}
          </div>
        )}

        {storePage === 'product' && currentProduct && (
          <div>
            <button
              type="button"
              onClick={goBackFromProduct}
              className="flex items-center text-teal-700 hover:text-teal-900 mb-4 font-medium bg-teal-50 px-3 py-1.5 rounded-lg w-max border-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Retour
            </button>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-4 md:p-8 bg-gray-50">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white shadow-sm border border-gray-100 relative">
                  <ProductImage
                    src={
                      currentProduct.images[activeImageIndex] ||
                      currentProduct.images[0]
                    }
                    alt={currentProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {currentProduct.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {currentProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          activeImageIndex === idx
                            ? 'border-teal-500 scale-105 shadow-md'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <ProductImage
                          src={img}
                          alt={`Miniature ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                <div className="mb-2">
                  {(currentProduct.stock || 0) > 0 ? (
                    <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      En stock
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Rupture
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">
                  {currentProduct.name}
                </h1>
                <p className="text-3xl font-black text-orange-500 mb-6">
                  {formatPrice(currentProduct.price)}
                </p>
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {currentProduct.detailedDescription ||
                      currentProduct.description}
                  </p>
                </div>
                <div className="mt-auto space-y-4 hidden md:block">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full rounded-xl py-8 text-lg"
                    disabled={(currentProduct.stock || 0) <= 0}
                    onClick={() => openOrder(currentProduct)}
                  >
                    <ShoppingCart className="w-6 h-6" /> Acheter maintenant
                  </Button>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 mr-1 text-teal-500" />{' '}
                    Paiement à la livraison
                  </div>
                </div>
              </div>
            </div>
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
              <Button
                variant="accent"
                size="lg"
                className="w-full rounded-xl py-7 text-lg"
                disabled={(currentProduct.stock || 0) <= 0}
                onClick={() => openOrder(currentProduct)}
              >
                <ShoppingCart className="w-5 h-5" /> Acheter maintenant
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-sm text-gray-400">
        <p>© 2026 J&apos;achète.ci — Tous droits réservés.</p>
        <button
          type="button"
          onClick={() => setPinOpen(true)}
          className="mt-2 text-gray-300 hover:text-gray-500 transition-colors border-0 bg-transparent cursor-pointer"
          title="Accès partenaire"
        >
          <Lock className="w-4 h-4 mx-auto" />
        </button>
      </footer>

      <OrderModal
        open={orderModalOpen}
        onOpenChange={(v) => {
          setOrderModalOpen(v)
          if (!v) setOrderProduct(null)
        }}
        product={orderProduct}
        onSubmitOrder={handleOrderSubmit}
      />
      <AdminAuthModal
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSuccess={onEnterAdmin}
      />
    </div>
  )
}
