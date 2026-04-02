import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { insforge } from '@/lib/insforgeClient'
import * as shopApi from '@/lib/shopInsforge'
import { initialProducts } from '@/data/initialProducts'

const STORAGE_KEYS = {
  products: 'jachete_products',
  orders: 'jachete_orders',
  settings: 'jachete_settings',
}

const defaultSettings = {
  shopName: "J'achète.ci",
  whatsApp: '+2250102030405',
  relanceMessage:
    "Bonjour ! Vous avez regardé nos produits récemment. Profitez de -10% aujourd'hui avec le code PROMO10.",
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

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const remoteEnabled = Boolean(insforge)

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
        const [p, o, s] = await Promise.all([
          shopApi.fetchProducts(insforge),
          shopApi.fetchOrders(insforge),
          shopApi.fetchShopSettings(insforge),
        ])
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
        setRemoteError(e?.message || 'Sync InsForge impossible')
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
        const next = await shopApi.persistProducts(insforge, products)
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
        await shopApi.upsertShopSettings(insforge, settings)
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

    if (!insforge) return localId

    ;(async () => {
      try {
        const saved = await shopApi.insertOrder(insforge, payload)
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
    if (!insforge) return
    shopApi.updateOrderStatusDb(insforge, orderId, newStatus).catch((e) => {
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
