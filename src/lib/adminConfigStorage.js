/** Persistance locale : zones, livreurs, collaborateurs, modèles WhatsApp, journal campagnes */

const STORAGE_KEY = 'ssflp_admin_config'
const ORDER_EXTRAS_KEY = 'ssflp_order_extras'
const DEFAULT_ZONES = [
  {
    id: 'z_seed_1',
    name: 'Abidjan Nord (Cocody, Bingerville…)',
    fee: 2000,
    note: '',
  },
  {
    id: 'z_seed_2',
    name: 'Abidjan Sud (Marcory, Koumassi…)',
    fee: 2500,
    note: '',
  },
  {
    id: 'z_seed_3',
    name: 'Intérieur du pays',
    fee: 5000,
    note: '',
  },
]

const DEFAULT_WHATSAPP_TEMPLATES = [
  {
    id: 'wt_inf_1',
    title: 'Suivi commande (info)',
    angle: 'information',
    body:
      'Bonjour {{nom}}, petite info : votre commande chez {{boutique}} est bien prise en charge. Besoin d’un créneau de livraison ? Répondez à ce message.',
  },
  {
    id: 'wt_inf_2',
    title: 'Confirmation d’adresse',
    angle: 'information',
    body:
      'Bonjour {{nom}}, pour finaliser la livraison, pouvez-vous confirmer votre adresse et un numéro joignable ? Merci, équipe {{boutique}}.',
  },
  {
    id: 'wt_mkt_1',
    title: 'Offre limitée',
    angle: 'marketing',
    body:
      'Bonjour {{nom}} ! {{boutique}} : profitez d’une offre sur nos produits cette semaine. Dites « OUI » pour recevoir le détail en image.',
  },
  {
    id: 'wt_mkt_2',
    title: 'Réactivation panier',
    angle: 'marketing',
    body:
      'Bonjour {{nom}}, vous aviez regardé nos produits Forever Living. Un conseiller peut vous aider à choisir — répondez « CONSEIL ».',
  },
]

function defaultConfig() {
  return {
    zones: DEFAULT_ZONES.map((z) => ({ ...z })),
    couriers: [],
    collaborators: [],
    whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES.map((t) => ({ ...t })),
    campaignLog: [],
  }
}

function loadOrderExtrasMap() {
  try {
    const raw = localStorage.getItem(ORDER_EXTRAS_KEY)
    if (!raw) {
      const legacy = localStorage.getItem(STORAGE_KEY)
      if (legacy) {
        const p = JSON.parse(legacy)
        if (p?.orderExtras && typeof p.orderExtras === 'object') {
          localStorage.setItem(ORDER_EXTRAS_KEY, JSON.stringify(p.orderExtras))
          return p.orderExtras
        }
      }
      return {}
    }
    const p = JSON.parse(raw)
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

function saveOrderExtrasMap(map) {
  try {
    localStorage.setItem(ORDER_EXTRAS_KEY, JSON.stringify(map))
  } catch (e) {
    console.error('saveOrderExtrasMap', e)
  }
}

export function loadAdminConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig()
    const parsed = JSON.parse(raw)
    return {
      ...defaultConfig(),
      ...parsed,
      zones: Array.isArray(parsed.zones) ? parsed.zones : defaultConfig().zones,
      couriers: Array.isArray(parsed.couriers) ? parsed.couriers : [],
      collaborators: Array.isArray(parsed.collaborators)
        ? parsed.collaborators
        : [],
      whatsappTemplates: Array.isArray(parsed.whatsappTemplates)
        ? parsed.whatsappTemplates
        : Array.isArray(parsed.whatsAppTemplates)
          ? parsed.whatsAppTemplates
          : defaultConfig().whatsappTemplates,
      campaignLog: Array.isArray(parsed.campaignLog) ? parsed.campaignLog : [],
    }
  } catch {
    return defaultConfig()
  }
}

export function saveAdminConfig(config) {
  try {
    const { orderExtras: _omit, ...rest } = config
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch (e) {
    console.error('saveAdminConfig', e)
  }
}

export function mergeOrderExtras(orderId, patch) {
  const id = String(orderId)
  const map = loadOrderExtrasMap()
  map[id] = { ...map[id], ...patch }
  saveOrderExtrasMap(map)
}

export function removeOrderExtras(orderId) {
  const id = String(orderId)
  const map = loadOrderExtrasMap()
  if (map[id]) {
    delete map[id]
    saveOrderExtrasMap(map)
  }
}

export function applyOrderExtrasToOrders(orders) {
  const extras = loadOrderExtrasMap()
  return orders.map((o) => ({
    ...o,
    ...(extras[String(o.id)] || {}),
  }))
}
