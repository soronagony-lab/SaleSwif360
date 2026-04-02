import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
  facebookPixelId: '',
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
  const [products, setProducts] = useState(() =>
    loadJson(STORAGE_KEYS.products, initialProducts)
  )
  const [orders, setOrders] = useState(() =>
    loadJson(STORAGE_KEYS.orders, [])
  )
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...loadJson(STORAGE_KEYS.settings, {}),
  }))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const value = useMemo(
    () => ({
      products,
      setProducts,
      orders,
      setOrders,
      settings,
      updateSettings,
    }),
    [products, orders, settings, updateSettings]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop doit être utilisé dans ShopProvider')
  return ctx
}
