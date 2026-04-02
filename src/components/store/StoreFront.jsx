import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ExternalLink,
  Leaf,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { ProductCard } from '@/components/ProductCard'
import { ProductImage } from '@/components/ProductImage'
import { formatPrice, normalizePhoneForWhatsApp } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderModal } from '@/components/store/OrderModal'
import { AdminAuthModal } from '@/components/admin/AdminAuthModal'
import { SeoHead } from '@/components/SeoHead'
import { BRAND } from '@/lib/brand'
import { getArticleBySlug } from '@/data/blogArticles'
import { BlogArticleView, BlogList } from '@/components/store/BlogSection'
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
  const [blogSlug, setBlogSlug] = useState(null)

  const pixelId = resolvePixelId(settings.facebookPixelId)
  const waDigits = normalizePhoneForWhatsApp(settings.whatsApp || BRAND.businessPhone)
  const waLinkMlm = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    `Bonjour ${BRAND.name}, je souhaite en savoir plus sur l'opportunité business Forever Living Products.`
  )}`
  const waLinkGeneral = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    `Bonjour ${BRAND.name}, je vous contacte depuis votre site.`
  )}`
  const telHref = `tel:${String(settings.whatsApp || BRAND.businessPhone).replace(/\s/g, '')}`

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
  }, [pixelId, storePage, currentProduct?.id, blogSlug])

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

  const resolvedBlogArticle = useMemo(
    () => (blogSlug ? getArticleBySlug(blogSlug) : null),
    [blogSlug]
  )

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

  const navBtn = (active) =>
    `hover:text-emerald-700 transition-colors font-medium border-b-2 pb-0.5 ${
      active
        ? 'text-emerald-800 border-amber-500'
        : 'text-stone-600 border-transparent'
    }`

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-20 md:pb-0 text-stone-900">
      <SeoHead
        storePage={storePage}
        currentProduct={currentProduct}
        shopName={settings.shopName}
        blogSlug={storePage === 'blogArticle' ? blogSlug : null}
      />
      <header className="bg-white/95 backdrop-blur sticky top-0 z-40 shadow-sm border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-[4.25rem]">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 text-left"
              onClick={() => {
                setStorePage('home')
                setCurrentProduct(null)
                setBlogSlug(null)
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-md">
                <Leaf className="h-5 w-5" aria-hidden />
              </div>
              <div className="leading-tight">
                <span className="block font-bold text-lg md:text-xl tracking-tight text-emerald-900">
                  {BRAND.name}
                </span>
                <span className="block text-[10px] md:text-xs font-medium text-amber-700 uppercase tracking-widest">
                  {BRAND.tagline}
                </span>
              </div>
            </button>
            <nav className="hidden md:flex space-x-6 lg:space-x-10 items-center">
              <button
                type="button"
                onClick={() => {
                  setStorePage('home')
                  setCurrentProduct(null)
                  setBlogSlug(null)
                }}
                className={navBtn(
                  storePage === 'home' && !currentProduct && !blogSlug
                )}
              >
                Accueil
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorePage('catalog')
                  setCurrentProduct(null)
                  setBlogSlug(null)
                }}
                className={navBtn(storePage === 'catalog')}
              >
                Boutique
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorePage('blog')
                  setCurrentProduct(null)
                  setBlogSlug(null)
                }}
                className={navBtn(
                  storePage === 'blog' || storePage === 'blogArticle'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" aria-hidden />
                  Blog
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorePage('opportunity')
                  setCurrentProduct(null)
                  setBlogSlug(null)
                }}
                className={navBtn(storePage === 'opportunity')}
              >
                Opportunité
              </button>
            </nav>
            <button
              type="button"
              className="md:hidden p-2 text-emerald-800"
              aria-label="Menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-emerald-100 px-4 py-4 space-y-3 shadow-lg absolute w-full z-50">
            <button
              type="button"
              onClick={() => {
                setStorePage('home')
                setCurrentProduct(null)
                setBlogSlug(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-stone-700 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => {
                setStorePage('catalog')
                setCurrentProduct(null)
                setBlogSlug(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-stone-700 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Boutique
            </button>
            <button
              type="button"
              onClick={() => {
                setStorePage('blog')
                setCurrentProduct(null)
                setBlogSlug(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-stone-700 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Blog
            </button>
            <button
              type="button"
              onClick={() => {
                setStorePage('opportunity')
                setCurrentProduct(null)
                setBlogSlug(null)
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-3 rounded-xl font-medium text-stone-700 bg-stone-50 hover:bg-amber-50 hover:text-amber-900"
            >
              Opportunité business
            </button>
          </div>
        )}
      </header>

      {remoteLoading && (
        <div className="bg-emerald-50 text-emerald-900 text-sm text-center py-2 border-b border-emerald-100">
          Chargement du catalogue depuis le serveur…
        </div>
      )}
      {remoteError && !remoteLoading && (
        <div className="bg-amber-50 text-amber-950 text-sm text-center py-2 px-4 border-b border-amber-100">
          Catalogue en mode local (cache). Sync : {remoteError}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {storePage === 'home' && (
          <div className="space-y-12 md:space-y-16">
            <div className="relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-emerald-900/10">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/85 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1400&q=80"
                alt="Produits bien-être et nature"
                className="w-full h-64 md:h-[28rem] object-cover object-center"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-14 max-w-2xl">
                <span className="inline-flex items-center gap-2 bg-amber-500/95 text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-full w-max mb-4 uppercase tracking-wider shadow">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden />
                  {BRAND.hero.badge}
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-sm whitespace-pre-line">
                  {BRAND.hero.title}
                </h1>
                <p className="text-sm md:text-lg mb-8 text-emerald-50/95 max-w-lg leading-relaxed">
                  {BRAND.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStorePage('catalog')
                      setCurrentProduct(null)
                    }}
                    className="bg-amber-500 text-emerald-950 font-bold py-3.5 px-8 rounded-full w-max hover:bg-amber-400 transition shadow-lg text-base border-0 cursor-pointer"
                  >
                    {BRAND.ctaShop}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStorePage('opportunity')
                      setCurrentProduct(null)
                    }}
                    className="text-white font-semibold py-3 px-6 rounded-full border-2 border-white/40 hover:bg-white/10 transition w-max sm:w-auto text-sm md:text-base"
                  >
                    {BRAND.ctaOpportunity}
                  </button>
                </div>
                <p className="mt-6 text-xs text-emerald-200/90 max-w-md">
                  {BRAND.legalMention} · Paiement à la livraison en Côte
                  d&apos;Ivoire.
                </p>
              </div>
            </div>

            <div>
              <div className="flex flex-col items-start gap-2 mb-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-950 flex items-center gap-2">
                  <TrendingUp className="text-amber-600 shrink-0" aria-hidden />
                  Coups de cœur bien-être
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setStorePage('catalog')
                    setCurrentProduct(null)
                  }}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline-offset-4 hover:underline"
                >
                  Voir toute la boutique
                </button>
              </div>
              <p className="text-stone-600 text-sm mb-6 max-w-2xl">
                {BRAND.salesPitch}
              </p>
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
                <p className="text-stone-500 text-center py-8">
                  Aucun produit en stock pour le moment.
                </p>
              )}
            </div>

            <section className="rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-8 md:p-12 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="max-w-xl">
                  <p className="text-amber-300/90 text-xs font-bold uppercase tracking-widest mb-2">
                    Deuxième plan — développement
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-2">
                    <Users className="w-8 h-8 text-amber-400 shrink-0" />
                    {BRAND.mlm.title}
                  </h2>
                  <p className="text-emerald-100/95 text-sm md:text-base leading-relaxed">
                    {BRAND.mlm.subtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <a
                    href={waLinkMlm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-amber-500 text-emerald-950 font-bold py-3.5 px-6 rounded-2xl hover:bg-amber-400 transition text-center shadow-lg"
                  >
                    Parler à un conseiller
                  </a>
                  <button
                    type="button"
                    onClick={() => setStorePage('opportunity')}
                    className="text-emerald-100 font-medium py-2 text-sm underline-offset-4 hover:underline border-0 bg-transparent cursor-pointer"
                  >
                    Lire la présentation complète
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {storePage === 'blog' && (
          <BlogList
            onOpenArticle={(slug) => {
              setBlogSlug(slug)
              setStorePage('blogArticle')
              window.scrollTo(0, 0)
            }}
            onBackHome={() => {
              setStorePage('home')
              setBlogSlug(null)
            }}
          />
        )}

        {storePage === 'blogArticle' && blogSlug && (
          <>
            {resolvedBlogArticle ? (
              <BlogArticleView
                article={resolvedBlogArticle}
                products={products}
                onBackToBlog={() => {
                  setBlogSlug(null)
                  setStorePage('blog')
                  window.scrollTo(0, 0)
                }}
                onCtaShop={() => {
                  setBlogSlug(null)
                  setStorePage('catalog')
                }}
                onCtaBusiness={() => {
                  setBlogSlug(null)
                  setStorePage('opportunity')
                }}
                onGoToProduct={(product) => goToProduct(product, 'blogArticle')}
                waLinkMlm={waLinkMlm}
              />
            ) : (
              <div className="max-w-lg mx-auto text-center py-16 px-4">
                <p className="text-stone-600 mb-6">Article introuvable.</p>
                <Button
                  variant="default"
                  onClick={() => {
                    setBlogSlug(null)
                    setStorePage('blog')
                  }}
                >
                  Retour au blog
                </Button>
              </div>
            )}
          </>
        )}

        {storePage === 'opportunity' && (
          <div className="max-w-3xl mx-auto space-y-10 pb-8">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                <Users className="w-4 h-4" />
                Opportunité business
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950">
                {BRAND.mlm.title}
              </h1>
              <p className="text-stone-600 text-lg leading-relaxed">
                {BRAND.mlm.intro}
              </p>
            </div>
            <ul className="space-y-4">
              {BRAND.mlm.bullets.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm"
                >
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-stone-700 leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-amber-950 text-sm leading-relaxed">
              {BRAND.mlm.disclaimer}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={waLinkMlm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl hover:bg-emerald-800 transition shadow-lg text-center"
              >
                {BRAND.mlm.ctaContact}
              </a>
              <button
                type="button"
                onClick={() => {
                  setStorePage('catalog')
                  setCurrentProduct(null)
                }}
                className="inline-flex items-center justify-center font-semibold py-4 px-8 rounded-2xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Commander des produits
              </button>
            </div>
          </div>
        )}

        {storePage === 'catalog' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">
                  Boutique en ligne
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Beauté, nutrition et bien-être — Forever Living Products®
                </p>
              </div>
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Rechercher un produit..."
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="pl-10 w-full md:w-72 shadow-sm border-emerald-100"
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
              <div className="text-center py-20 text-stone-500 bg-white rounded-2xl border border-emerald-100">
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
              className="flex items-center text-emerald-800 hover:text-emerald-950 mb-4 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg w-max border-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Retour
            </button>
            <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-4 md:p-8 bg-stone-50">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white shadow-sm border border-emerald-100 relative">
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
                            ? 'border-amber-500 scale-105 shadow-md'
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
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      En stock
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Rupture
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-emerald-950 mb-2">
                  {currentProduct.name}
                </h1>
                <p className="text-3xl font-black text-amber-600 mb-6">
                  {formatPrice(currentProduct.price)}
                </p>
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-stone-800 mb-2">
                    Description
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
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
                    <ShoppingCart className="w-6 h-6" /> Commander maintenant
                  </Button>
                  <div className="flex items-center justify-center text-sm text-stone-500">
                    <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />{' '}
                    Paiement à la livraison
                  </div>
                </div>
              </div>
            </div>
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-emerald-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
              <Button
                variant="accent"
                size="lg"
                className="w-full rounded-xl py-7 text-lg"
                disabled={(currentProduct.stock || 0) <= 0}
                onClick={() => openOrder(currentProduct)}
              >
                <ShoppingCart className="w-5 h-5" /> Commander maintenant
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-emerald-100 py-8 mt-12 text-sm text-stone-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-semibold text-emerald-900">{settings.shopName}</p>
          <p className="mt-1 text-xs text-stone-400 max-w-md mx-auto">
            {BRAND.legalMention} · {BRAND.tagline}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
            <a
              href={BRAND.facebookPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              Facebook — @Solutionflp
            </a>
            <a
              href={telHref}
              className="inline-flex items-center gap-2 font-medium text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              <Phone className="w-4 h-4 shrink-0" aria-hidden />
              {BRAND.businessPhoneDisplay}
            </a>
            <a
              href={waLinkGeneral}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              WhatsApp
            </a>
          </div>
          <p className="mt-6 text-xs text-stone-400">
            © {new Date().getFullYear()} {BRAND.name} — Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Accès discret tableau de bord (partenaires) */}
      <button
        type="button"
        onClick={() => setPinOpen(true)}
        className="fixed bottom-0 right-0 z-[70] h-7 w-7 sm:h-8 sm:w-8 opacity-[0.07] hover:opacity-35 cursor-pointer border-0 bg-emerald-950/15 rounded-tl-lg"
        aria-label="Connexion partenaire"
        title=""
      />
      <button
        type="button"
        onClick={() => setPinOpen(true)}
        className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:right-4 focus:z-[80] focus:rounded-lg focus:bg-emerald-800 focus:text-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Tableau de bord partenaire
      </button>

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
