import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  aiProviderLabel,
  canUseAi,
  hasHostedAi,
  isUserApiConfigured,
  loadApiConfig,
  resolveEffectiveApiConfig,
  saveApiConfig,
  shouldShowAiBadge,
} from './apiConfig'
import type { ServerAiStatus } from './serverAi'

const serverAi: ServerAiStatus = {
  available: true,
  provider: 'deepseek',
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1',
}

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('hosted AI helpers', () => {
  it('canUseAi when server available and enabled', () => {
    saveApiConfig({ ...loadApiConfig(), enabled: true, apiKey: '' })
    expect(canUseAi(loadApiConfig(), serverAi)).toBe(true)
    expect(isUserApiConfigured(loadApiConfig())).toBe(false)
  })

  it('resolveEffectiveApiConfig uses server model when no user key', () => {
    const cfg = { ...loadApiConfig(), enabled: true, apiKey: '' }
    const effective = resolveEffectiveApiConfig(cfg, serverAi)
    expect(effective.model).toBe('deepseek-chat')
    expect(effective.baseUrl).toBe('https://api.deepseek.com/v1')
  })

  it('aiProviderLabel shows hosted provider', () => {
    const cfg = { ...loadApiConfig(), enabled: true, apiKey: '' }
    expect(aiProviderLabel(cfg, serverAi)).toBe('deepseek')
  })

  it('shouldShowAiBadge when hosted even if enabled false', () => {
    const cfg = { ...loadApiConfig(), enabled: false, apiKey: '' }
    expect(hasHostedAi(serverAi)).toBe(true)
    expect(canUseAi(cfg, serverAi)).toBe(false)
    expect(shouldShowAiBadge(cfg, serverAi)).toBe(true)
  })
})
