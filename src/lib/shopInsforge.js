/** Mappers et accès DB boutique InsForge (PostgREST) */

import { BRAND } from '@/lib/brand'

const TEMP_ID_THRESHOLD = 1_000_000_000_000 // > ~2001 en ms — ids locaux Date.now()

export async function fetchAllShopRemote(insforge) {
  const [products, orders, settings] = await Promise.all([
    fetchProducts(insforge),
    fetchOrders(insforge),
    fetchShopSettings(insforge),
  ])
  return { products, orders, settings }
}

function parseImagesColumn(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw)
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }
  return []
}

export function isTemporaryProductId(id) {
  const n = Number(id)
  return Number.isFinite(n) && n >= TEMP_ID_THRESHOLD
}

export function mapProductRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price),
    stock: Number(row.stock ?? 0),
    description: row.description ?? '',
    detailedDescription: row.detailed_description ?? '',
    images: parseImagesColumn(row.images),
  }
}

export function mapProductToRow(p) {
  return {
    name: p.name,
    price: p.price,
    stock: p.stock ?? 0,
    description: p.description ?? '',
    detailed_description: p.detailedDescription ?? '',
    images: p.images ?? [],
  }
}

export function mapOrderRow(row) {
  if (!row) return null
  const created = row.created_at ? new Date(row.created_at) : new Date()
  return {
    id: Number(row.id),
    productId: row.product_id != null ? Number(row.product_id) : null,
    productName: row.product_name,
    price: Number(row.price),
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    status: row.status,
    date: created.toLocaleString('fr-FR'),
  }
}

export function mapSettingsRow(row) {
  if (!row) return {}
  return {
    shopName: row.shop_name ?? BRAND.name,
    whatsApp: row.whats_app ?? '',
    relanceMessage: row.relance_message ?? '',
    facebookPixelId: row.facebook_pixel_id ?? '',
    ga4Id: row.ga4_id ?? '',
  }
}

export function mapSettingsToRow(patch) {
  const o = {}
  if (patch.shopName !== undefined) o.shop_name = patch.shopName
  if (patch.whatsApp !== undefined) o.whats_app = patch.whatsApp
  if (patch.relanceMessage !== undefined) o.relance_message = patch.relanceMessage
  if (patch.facebookPixelId !== undefined) o.facebook_pixel_id = patch.facebookPixelId
  if (patch.ga4Id !== undefined) o.ga4_id = patch.ga4Id
  o.updated_at = new Date().toISOString()
  return o
}

export async function fetchProducts(insforge) {
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapProductRow).filter(Boolean)
}

export async function fetchOrders(insforge) {
  const { data, error } = await insforge.database
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapOrderRow).filter(Boolean)
}

export async function fetchShopSettings(insforge) {
  const { data, error } = await insforge.database
    .from('shop_settings')
    .select('*')
    .eq('id', 1)
    .limit(1)
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return mapSettingsRow(row)
}

export async function persistProducts(insforge, products) {
  const { data: existingRows, error: selErr } = await insforge.database
    .from('products')
    .select('id')
  if (selErr) throw selErr

  const dbIds = new Set((existingRows || []).map((r) => Number(r.id)))
  let next = products.map((p) => ({ ...p }))

  for (let i = 0; i < next.length; i++) {
    const p = next[i]
    if (!isTemporaryProductId(p.id)) continue
    const row = mapProductToRow(p)
    const { data, error } = await insforge.database
      .from('products')
      .insert([row])
      .select()
    if (error) throw error
    const inserted = data?.[0]
    if (inserted) {
      next[i] = mapProductRow(inserted)
    }
  }

  const finalIds = new Set(next.map((p) => Number(p.id)))
  for (const id of dbIds) {
    if (!finalIds.has(id)) {
      const { error } = await insforge.database
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  }

  for (const p of next) {
    if (isTemporaryProductId(p.id)) continue
    const row = mapProductToRow(p)
    const { error } = await insforge.database
      .from('products')
      .update(row)
      .eq('id', p.id)
    if (error) throw error
  }

  return next
}

export async function insertOrder(insforge, payload) {
  const row = {
    product_id: payload.productId ?? null,
    product_name: payload.productName,
    price: payload.price,
    customer_name: payload.customerName,
    phone: payload.phone,
    city: payload.city,
    address: payload.address,
    status: payload.status ?? 'Nouvelle',
  }
  const { data, error } = await insforge.database
    .from('orders')
    .insert([row])
    .select()
  if (error) throw error
  const inserted = data?.[0]
  return inserted ? mapOrderRow(inserted) : null
}

export async function updateOrderStatusDb(insforge, orderId, status) {
  const { error } = await insforge.database
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  if (error) throw error
}

export async function deleteOrderDb(insforge, orderId) {
  const { error } = await insforge.database
    .from('orders')
    .delete()
    .eq('id', orderId)
  if (error) throw error
}

export async function upsertShopSettings(insforge, patch) {
  const row = mapSettingsToRow(patch)
  const { error } = await insforge.database
    .from('shop_settings')
    .update(row)
    .eq('id', 1)
  if (error) throw error
}
