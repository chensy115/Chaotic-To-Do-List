import { describe, expect, it } from 'vitest'
import { getTaskRot } from './taskRot'

describe('getTaskRot', () => {
  it('returns fresh rot for new task', () => {
    const rot = getTaskRot(Date.now())
    expect(rot.level).toBe(0)
    expect(rot.label).toBe('新鲜画饼')
  })

  it('returns higher level after 24h', () => {
    const rot = getTaskRot(Date.now() - 25 * 3_600_000)
    expect(rot.level).toBeGreaterThanOrEqual(1)
  })
})
