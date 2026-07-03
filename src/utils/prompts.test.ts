import { describe, expect, it } from 'vitest'
import { buildRoastMessages, buildRetryUserMessage } from './prompts'

describe('buildRoastMessages', () => {
  const baseCtx = {
    task: '我要背一百个单词',
    hour: 15,
    attemptCount: 1,
    existingTasks: [] as string[],
    event: 'add' as const,
  }

  it('uses single turn on first attempt', () => {
    const msgs = buildRoastMessages(baseCtx)
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('system')
    expect(msgs[1].role).toBe('user')
    expect(msgs[1].content).toContain('一百个单词')
  })

  it('uses multi-turn on second attempt with previous roast', () => {
    const previous = '一百个单词？你 abandon 还亮着呢。'
    const msgs = buildRoastMessages({
      ...baseCtx,
      attemptCount: 2,
      previousRoast: previous,
    })
    expect(msgs).toHaveLength(4)
    expect(msgs[0].role).toBe('system')
    expect(msgs[2].role).toBe('assistant')
    expect(msgs[2].content).toBe(previous)
    expect(msgs[3].role).toBe('user')
    expect(msgs[3].content).toMatch(/我偏要加/)
    expect(msgs[3].content).toMatch(/禁止/)
  })

  it('marks empty todo list as no-hallucination zone', () => {
    const msgs = buildRoastMessages({
      ...baseCtx,
      existingTasks: [],
      activeTaskTexts: [],
    })
    expect(msgs[1].content).toMatch(/清单为空/)
    expect(msgs[1].content).toMatch(/禁止编造/)
  })

  it('retry user message forbids time repetition', () => {
    const text = buildRetryUserMessage({ ...baseCtx, attemptCount: 2 })
    expect(text).toMatch(/禁止再提具体几点/)
  })
})
