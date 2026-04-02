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
import {
  applyOrderExtrasToOrders,
  mergeOrderExtras,
  removeOrderExtras,
} from '@/lib/adminConfigStorage'
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
  const raw =
    err?.message ??
    err?.error?.message ??
    err?.details ??
    String(err ?? '')
  const lower = raw.toLowerCase()

  if (
    /invalid token|invalid jwt|jwt expired|pgrst301|malformed jwt|unauthorized/.test(
      lower
    ) ||
    (err?.statusCode === 401 && /token|jwt|auth/i.test(raw))
  ) {
    return 'Sync serveur : la clé anonyme ou l’URL InsForge ne correspond pas au projet. Dans le dashboard InsForge, copiez l’URL du backend et la clé publique « anon » (pas la clé secrète). Sur Vercel : Settings → Environment Variables → VITE_INSFORGE_URL (sans / à la fin) et VITE_INSFORGE_ANON_KEY, puis redéployez. Vérifiez les espaces en début/fin de clé.'
  }
  if (/failed to fetch|network|load failed|echec|econnrefused/i.test(lower)) {
    return 'Impossible de joindre le serveur InsForge (réseau ou URL incorrecte). Vérifiez VITE_INSFORGE_URL et votre connexion.'
  }
  if (/relation|does not exist|42p01|pgrst205/i.test(lower)) {
    return 'Tables SQL manquantes côté InsForge. Exécutez le script insforge-shop-schema.sql sur votre base.'
  }
  return raw || 'Synchronisation InsForge impossible.'
}

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const remoteEnabled = Boolean(insforgeShop)

  const [products, setProducts] = useState(() =>
    loadJson(STORAGE_KEYS.products, initialProducts)
  )
  const [orders, setOrders] = useState(() =>
    applyOrderExtrasToOrders(loadJson(STORAGE_KEYS.orders, []))
  )
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
        setOrders(applyOrderExtrasToOrders(o))
        setSettings({ ...defaultSettings, ...s })
        setRemoteError(null)
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setRemoteError(formatShopSyncError(e))
        setProducts(loadJson(STORAGE_KEYS.products, initialProducts))
        setOrders(
          applyOrderExtrasToOrders(loadJson(STORAGE_KEYS.orders, []))
        )
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

  const EXTRA_ORDER_KEYS = ['courierId', 'internalNote', 'deliveryZoneId']

  const patchOrder = useCallback((orderId, patch) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
    )
    if (patch.status != null && insforgeShop) {
      shopApi
        .updateOrderStatusDb(insforgeShop, orderId, patch.status)
        .catch((e) => {
          console.error('updateOrderStatusDb', e)
        })
    }
    const extra = {}
    for (const k of EXTRA_ORDER_KEYS) {
      if (patch[k] !== undefined) extra[k] = patch[k]
    }
    if (Object.keys(extra).length > 0) {
      mergeOrderExtras(orderId, extra)
    }
  }, [])

  const deleteOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    removeOrderExtras(orderId)
    if (!insforgeShop) return
    shopApi.deleteOrderDb(insforgeShop, orderId).catch((e) => {
      console.error('deleteOrderDb', e)
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
      patchOrder,
      deleteOrder,
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
      patchOrder,
      deleteOrder,
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
