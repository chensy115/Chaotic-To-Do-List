import { describe, expect, it } from 'vitest'
import { pieIndexToEmoji } from './PieSparkline'

describe('pieIndexToEmoji', () => {
  it('returns dot for missing data', () => {
    expect(pieIndexToEmoji(null)).toBe('·')
  })

  it('maps ranges aligned with pie comments', () => {
    expect(pieIndexToEmoji(0)).toBe('🐟')
    expect(pieIndexToEmoji(34)).toBe('🐟')
    expect(pieIndexToEmoji(35)).toBe('😎')
    expect(pieIndexToEmoji(59)).toBe('😎')
    expect(pieIndexToEmoji(60)).toBe('🥞')
    expect(pieIndexToEmoji(84)).toBe('🥞')
    expect(pieIndexToEmoji(85)).toBe('🔥')
    expect(pieIndexToEmoji(100)).toBe('🔥')
  })
})
