import { useCallback, useEffect, useRef, useState } from 'react'
import { loadAdminConfig, saveAdminConfig } from '@/lib/adminConfigStorage'
import { insforgeShop } from '@/lib/insforgeClient'
import {
  appendCampaignLogDb,
  loadAdminConfigRemote,
  persistAdminConfig,
} from '@/lib/shopAdminInsforge'

export function useAdminConfig() {
  const [config, setConfig] = useState(() => loadAdminConfig())
  const remoteReady = useRef(false)
  const skipNextPersist = useRef(true)

  useEffect(() => {
    if (!insforgeShop) {
      remoteReady.current = true
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const merged = await loadAdminConfigRemote(insforgeShop)
        if (!cancelled) {
          setConfig(merged)
          saveAdminConfig(merged)
        }
      } catch (e) {
        console.error('useAdminConfig remote load', e)
      } finally {
        if (!cancelled) {
          remoteReady.current = true
          skipNextPersist.current = false
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveAdminConfig(config)
    if (!insforgeShop || !remoteReady.current || skipNextPersist.current) return
    const t = setTimeout(() => {
      persistAdminConfig(insforgeShop, config).catch((e) => {
        console.error('persistAdminConfig', e)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [config])

  const appendCampaignLog = useCallback((entry) => {
    const row = { ...entry, at: new Date().toISOString() }
    setConfig((c) => ({
      ...c,
      campaignLog: [row, ...(c.campaignLog || [])].slice(0, 100),
    }))
    if (insforgeShop) {
      appendCampaignLogDb(insforgeShop, row).catch((e) => {
        console.error('appendCampaignLogDb', e)
      })
    }
  }, [])

  const updateConfig = useCallback((patch) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  return { config, setConfig, updateConfig, appendCampaignLog }
}
