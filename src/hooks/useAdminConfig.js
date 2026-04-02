import { useCallback, useEffect, useState } from 'react'
import { loadAdminConfig, saveAdminConfig } from '@/lib/adminConfigStorage'

export function useAdminConfig() {
  const [config, setConfig] = useState(() => loadAdminConfig())

  useEffect(() => {
    saveAdminConfig(config)
  }, [config])

  const updateConfig = useCallback((patch) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  return { config, setConfig, updateConfig }
}
