import { describe, expect, it, beforeEach, vi } from 'vitest'
import { loadApiConfig, saveApiConfig } from './apiConfig'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('apiConfig personality', () => {
  it('persists personality across save and load', () => {
    const config = loadApiConfig()
    saveApiConfig({ ...config, personality: 'colleague' })
    expect(loadApiConfig().personality).toBe('colleague')

    saveApiConfig({ ...loadApiConfig(), personality: 'roommate' })
    expect(loadApiConfig().personality).toBe('roommate')
  })

  it('defaults invalid personality to mentor', () => {
    localStorage.setItem('chaotic-api-config', JSON.stringify({ personality: 'invalid' }))
    expect(loadApiConfig().personality).toBe('mentor')
  })
})
