/** Segments d’URL après `/admin/` — tableau de bord */
const SEGMENT_TO_PAGE = {
  commandes: 'orders',
  produits: 'products',
  clients: 'customers',
  marketing: 'marketing',
  logistique: 'logistics',
  parametres: 'settings',
}

const PAGE_TO_PATH = {
  dashboard: '/admin',
  orders: '/admin/commandes',
  products: '/admin/produits',
  customers: '/admin/clients',
  marketing: '/admin/marketing',
  logistics: '/admin/logistique',
  settings: '/admin/parametres',
}

/**
 * @returns {{ page: string, invalid: boolean }}
 */
export function parseAdminPath(pathname) {
  const path =
    String(pathname || '/').replace(/\/+/g, '/').replace(/\/+$/, '') || '/'
  if (!path.startsWith('/admin')) {
    return { page: 'dashboard', invalid: true }
  }
  if (path === '/admin') {
    return { page: 'dashboard', invalid: false }
  }
  const sub = path.slice('/admin/'.length)
  if (!sub || sub.includes('/')) {
    return { page: 'dashboard', invalid: true }
  }
  const page = SEGMENT_TO_PAGE[sub]
  if (!page) {
    return { page: 'dashboard', invalid: true }
  }
  return { page, invalid: false }
}

export function pathForAdminPage(page) {
  return PAGE_TO_PATH[page] ?? '/admin'
}
