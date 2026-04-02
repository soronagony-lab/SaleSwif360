import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { insforgeShop } from '@/lib/insforgeClient'
import * as shopApi from '@/lib/shopInsforge'
import { initialProducts } from '@/data/initialProducts'
import { BRAND } from '@/lib/brand'

const STORAGE_KEYS = {
  products: 'ssflp_products',
  orders: 'ssflp_orders',
  settings: 'ssflp_settings',
}

const defaultSettings = {
  shopName: BRAND.name,
  whatsApp: BRAND.businessPhone,
  relanceMessage:
    "Bonjour ! Vous avez consulté nos produits Forever Living chez Succès Solution FLP. Une question sur la nutrition ou les soins ? Répondez à ce message, on vous guide.",
  facebookPixelId: '1601177617317072',
  ga4Id: '',
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function formatShopSyncError(err) {
  const raw = err?.message ?? String(err ?? '')
  if (/invalid token/i.test(raw)) {
    return 'Clé API InsForge incorrecte ou expirée — vérifiez VITE_INSFORGE_ANON_KEY et VITE_INSFORGE_URL (Vercel / .env).'
  }
  return raw || 'Sync InsForge impossible'
}

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const remoteEnabled = Boolean(insforgeShop)

  const [products, setProducts] = useState(() =>
    loadJson(STORAGE_KEYS.products, initialProducts)
  )
  const [orders, setOrders] = useState(() => loadJson(STORAGE_KEYS.orders, []))
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...loadJson(STORAGE_KEYS.settings, {}),
  }))

  const [remoteLoading, setRemoteLoading] = useState(remoteEnabled)
  const [remoteError, setRemoteError] = useState(null)

  const skipPersistProducts = useRef(false)
  const skipPersistSettings = useRef(false)

  useEffect(() => {
    if (!remoteEnabled) {
      setRemoteLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const { products: p, orders: o, settings: s } =
          await shopApi.fetchAllShopRemote(insforgeShop)
        if (cancelled) return
        skipPersistProducts.current = true
        skipPersistSettings.current = true
        setProducts(p.length > 0 ? p : [])
        setOrders(o)
        setSettings({ ...defaultSettings, ...s })
        setRemoteError(null)
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setRemoteError(formatShopSyncError(e))
        setProducts(loadJson(STORAGE_KEYS.products, initialProducts))
        setOrders(loadJson(STORAGE_KEYS.orders, []))
        setSettings({
          ...defaultSettings,
          ...loadJson(STORAGE_KEYS.settings, {}),
        })
      } finally {
        if (!cancelled) setRemoteLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [remoteEnabled])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (!remoteEnabled || remoteLoading) return
    if (skipPersistProducts.current) {
      skipPersistProducts.current = false
      return
    }
    const t = setTimeout(async () => {
      try {
        const next = await shopApi.persistProducts(insforgeShop, products)
        const idsChanged =
          next.length !== products.length ||
          next.some((p, i) => p.id !== products[i]?.id)
        if (idsChanged) {
          skipPersistProducts.current = true
          setProducts(next)
        }
      } catch (e) {
        console.error('persistProducts', e)
      }
    }, 900)
    return () => clearTimeout(t)
  }, [products, remoteEnabled, remoteLoading])

  useEffect(() => {
    if (!remoteEnabled || remoteLoading) return
    if (skipPersistSettings.current) {
      skipPersistSettings.current = false
      return
    }
    const t = setTimeout(async () => {
      try {
        await shopApi.upsertShopSettings(insforgeShop, settings)
      } catch (e) {
        console.error('upsertShopSettings', e)
      }
    }, 700)
    return () => clearTimeout(t)
  }, [settings, remoteEnabled, remoteLoading])

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const submitOrder = useCallback((payload) => {
    const localId = Date.now()
    const localOrder = {
      id: localId,
      ...payload,
      date: new Date().toLocaleString('fr-FR'),
    }
    setOrders((prev) => [localOrder, ...prev])

    if (!insforgeShop) return localId

    ;(async () => {
      try {
        const saved = await shopApi.insertOrder(insforgeShop, payload)
        if (saved) {
          setOrders((prev) =>
            prev.map((o) => (o.id === localId ? saved : o))
          )
        }
      } catch (e) {
        console.error('insertOrder', e)
      }
    })()

    return localId
  }, [])

  const patchOrderStatus = useCallback((orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    if (!insforgeShop) return
    shopApi
      .updateOrderStatusDb(insforgeShop, orderId, newStatus)
      .catch((e) => {
        console.error('updateOrderStatusDb', e)
      })
  }, [])

  const value = useMemo(
    () => ({
      products,
      setProducts,
      orders,
      setOrders,
      settings,
      updateSettings,
      submitOrder,
      patchOrderStatus,
      remoteEnabled,
      remoteLoading,
      remoteError,
    }),
    [
      products,
      orders,
      settings,
      updateSettings,
      submitOrder,
      patchOrderStatus,
      remoteEnabled,
      remoteLoading,
      remoteError,
    ]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop doit être utilisé dans ShopProvider')
  return ctx
}
