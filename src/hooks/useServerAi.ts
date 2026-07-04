import { useEffect, useState } from 'react'
import { loadApiConfig, saveApiConfig } from '../utils/apiConfig'
import { fetchServerAiStatus, type ServerAiStatus } from '../utils/serverAi'

export type ServerAiLoadState = 'pending' | 'ready'

export function useServerAi() {
  const [loadState, setLoadState] = useState<ServerAiLoadState>('pending')
  const [serverAi, setServerAi] = useState<ServerAiStatus>({ available: false })

  useEffect(() => {
    let cancelled = false

    fetchServerAiStatus().then((status) => {
      if (cancelled) return

      setServerAi(status)
      setLoadState('ready')

      if (!status.available) return

      const cfg = loadApiConfig()
      if (cfg.enabled) return
      const next = { ...cfg, enabled: true }
      saveApiConfig(next)
      window.dispatchEvent(new CustomEvent('chaotic-api-config', { detail: next }))
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { serverAi, loadState, isPending: loadState === 'pending' }
}
