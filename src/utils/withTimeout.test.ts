import { describe, expect, it, vi } from 'vitest'
import { withTimeout } from './withTimeout'

describe('withTimeout', () => {
  it('resolves when promise completes in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42)
  })

  it('rejects with custom message when promise is slow', async () => {
    vi.useFakeTimers()
    try {
      const never = new Promise<void>(() => {})
      const result = withTimeout(never, 100, '请求超时，请检查网络连接')
      const expecting = expect(result).rejects.toThrow('请求超时，请检查网络连接')
      await vi.runAllTimersAsync()
      await expecting
    } finally {
      vi.useRealTimers()
    }
  })
})
