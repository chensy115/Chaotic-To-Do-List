import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { clearChatSession, loadChatSession, saveChatSession } from './chatSession'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-04T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('chatSession', () => {
  it('saves and loads a fresh session', () => {
    saveChatSession({
      pendingTask: '写周报',
      chatMessages: [{ id: '1', role: 'user', text: '写周报' }],
      attemptCount: 1,
    })

    const session = loadChatSession()
    expect(session?.pendingTask).toBe('写周报')
    expect(session?.attemptCount).toBe(1)
  })

  it('returns null when session is older than 24 hours', () => {
    saveChatSession({
      pendingTask: '过期任务',
      chatMessages: [],
      attemptCount: 0,
    })

    vi.setSystemTime(new Date('2026-07-05T12:00:01'))
    expect(loadChatSession()).toBeNull()
  })

  it('clearChatSession removes stored data', () => {
    saveChatSession({
      pendingTask: 'x',
      chatMessages: [],
      attemptCount: 0,
    })
    clearChatSession()
    expect(loadChatSession()).toBeNull()
  })
})
