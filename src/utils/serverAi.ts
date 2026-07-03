export interface ServerAiStatus {
  available: boolean
  provider?: string
  model?: string
  baseUrl?: string
}

let cached: ServerAiStatus | null = null
let inflight: Promise<ServerAiStatus> | null = null

export function getServerAiStatus(): ServerAiStatus | null {
  return cached
}

export async function fetchServerAiStatus(): Promise<ServerAiStatus> {
  if (cached) return cached
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetch('/api/ai-status')
      if (!res.ok) {
        cached = { available: false }
        return cached
      }
      const data = (await res.json()) as ServerAiStatus
      cached = {
        available: Boolean(data.available),
        provider: data.provider,
        model: data.model,
        baseUrl: data.baseUrl?.replace(/\/$/, ''),
      }
      return cached
    } catch {
      cached = { available: false }
      return cached
    } finally {
      inflight = null
    }
  })()

  return inflight
}

/** 测试 / 开发时重置缓存 */
export function resetServerAiCache() {
  cached = null
  inflight = null
}
