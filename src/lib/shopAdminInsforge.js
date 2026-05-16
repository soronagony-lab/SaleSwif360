/** Logistique, marketing et config admin — persistance InsForge */

import { loadAdminConfig } from '@/lib/adminConfigStorage'

function mapZoneRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    fee: Number(row.fee ?? 0),
    note: row.note ?? '',
  }
}

function mapCourierRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    active: row.active !== false,
  }
}

function mapWaTemplateRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    angle: row.angle ?? 'information',
    body: row.body,
  }
}

function mapFollowUpRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
  }
}

function mapCollaboratorRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    active: row.active !== false,
  }
}

function mapCampaignLogRow(row) {
  if (!row) return null
  return {
    mode: row.mode,
    templateId: row.template_id,
    phone: row.phone,
    preview: row.preview,
    at: row.logged_at,
  }
}

async function replaceTextKeyedTable(insforge, table, rows, toRow) {
  const { data: existing, error: selErr } = await insforge.database
    .from(table)
    .select('id')
  if (selErr) throw selErr

  const keepIds = new Set(rows.map((r) => r.id))
  for (const ex of existing || []) {
    if (!keepIds.has(ex.id)) {
      const { error } = await insforge.database.from(table).delete().eq('id', ex.id)
      if (error) throw error
    }
  }

  for (const item of rows) {
    const row = toRow(item)
    const { error } = await insforge.database.from(table).upsert([row], { onConflict: 'id' })
    if (error) throw error
  }
}

export async function fetchAdminConfig(insforge) {
  const [
    zonesRes,
    couriersRes,
    waRes,
    followRes,
    collabRes,
    logRes,
  ] = await Promise.all([
    insforge.database.from('delivery_zones').select('*').order('sort_order', { ascending: true }),
    insforge.database.from('couriers').select('*').order('created_at', { ascending: true }),
    insforge.database.from('whatsapp_templates').select('*').order('created_at', { ascending: true }),
    insforge.database.from('order_follow_up_templates').select('*').order('created_at', { ascending: true }),
    insforge.database.from('shop_collaborators').select('*').order('created_at', { ascending: true }),
    insforge.database
      .from('marketing_campaign_log')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(100),
  ])

  const errors = [
    zonesRes.error,
    couriersRes.error,
    waRes.error,
    followRes.error,
    collabRes.error,
    logRes.error,
  ].filter(Boolean)
  if (errors.length) throw errors[0]

  const zones = (zonesRes.data || []).map(mapZoneRow).filter(Boolean)
  const couriers = (couriersRes.data || []).map(mapCourierRow).filter(Boolean)
  const whatsappTemplates = (waRes.data || []).map(mapWaTemplateRow).filter(Boolean)
  const orderFollowUpTemplates = (followRes.data || []).map(mapFollowUpRow).filter(Boolean)
  const collaborators = (collabRes.data || []).map(mapCollaboratorRow).filter(Boolean)
  const campaignLog = (logRes.data || []).map(mapCampaignLogRow).filter(Boolean)

  const hasAny =
    zones.length > 0 ||
    couriers.length > 0 ||
    whatsappTemplates.length > 0 ||
    orderFollowUpTemplates.length > 0 ||
    collaborators.length > 0 ||
    campaignLog.length > 0

  return {
    hasAny,
    config: {
      zones,
      couriers,
      collaborators,
      whatsappTemplates,
      orderFollowUpTemplates,
      campaignLog,
    },
  }
}

export async function seedAdminConfig(insforge, config) {
  await persistAdminConfig(insforge, config)
}

export async function persistAdminConfig(insforge, config) {
  const zones = config.zones || []
  const couriers = config.couriers || []
  const collaborators = config.collaborators || []
  const whatsappTemplates = config.whatsappTemplates || []
  const orderFollowUpTemplates = config.orderFollowUpTemplates || []

  await replaceTextKeyedTable(
    insforge,
    'delivery_zones',
    zones.map((z, i) => ({
      id: z.id,
      name: z.name,
      fee: z.fee ?? 0,
      note: z.note ?? '',
      sort_order: i,
    })),
    (z) => z
  )

  await replaceTextKeyedTable(
    insforge,
    'couriers',
    couriers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? '',
      active: c.active !== false,
    })),
    (c) => c
  )

  await replaceTextKeyedTable(
    insforge,
    'shop_collaborators',
    collaborators.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role ?? '',
      email: m.email ?? '',
      phone: m.phone ?? '',
      active: m.active !== false,
    })),
    (m) => m
  )

  await replaceTextKeyedTable(
    insforge,
    'whatsapp_templates',
    whatsappTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      angle: t.angle ?? 'information',
      body: t.body,
    })),
    (t) => t
  )

  await replaceTextKeyedTable(
    insforge,
    'order_follow_up_templates',
    orderFollowUpTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      body: t.body,
    })),
    (t) => t
  )
}

export async function appendCampaignLogDb(insforge, entry) {
  const row = {
    mode: entry.mode ?? null,
    template_id: entry.templateId ?? null,
    phone: entry.phone ?? null,
    preview: entry.preview ?? entry.message ?? null,
    logged_at: entry.at ?? new Date().toISOString(),
  }
  const { error } = await insforge.database.from('marketing_campaign_log').insert([row])
  if (error) throw error
}

/** Premier chargement : fusionne défauts locaux si BDD partiellement vide */
export async function loadAdminConfigRemote(insforge) {
  try {
    const remote = await fetchAdminConfig(insforge)
    if (remote.hasAny) {
      const local = loadAdminConfig()
      return {
        ...local,
        ...remote.config,
        orderFollowUpTemplates:
          remote.config.orderFollowUpTemplates.length > 0
            ? remote.config.orderFollowUpTemplates
            : local.orderFollowUpTemplates,
        whatsappTemplates:
          remote.config.whatsappTemplates.length > 0
            ? remote.config.whatsappTemplates
            : local.whatsappTemplates,
        zones:
          remote.config.zones.length > 0 ? remote.config.zones : local.zones,
      }
    }
    const local = loadAdminConfig()
    await seedAdminConfig(insforge, local)
    return local
  } catch (e) {
    console.warn('loadAdminConfigRemote', e)
    return loadAdminConfig()
  }
}
