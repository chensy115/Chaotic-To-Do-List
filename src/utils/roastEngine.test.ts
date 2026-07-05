import { describe, expect, it } from 'vitest'
import { generateRoast, isDuplicateTask, normalizeTaskText } from './roastEngine'

describe('normalizeTaskText', () => {
  it('strips spaces and punctuation', () => {
    expect(normalizeTaskText('今晚 8 点背单词')).toBe('今晚8点背单词')
  })
})

describe('isDuplicateTask', () => {
  it('detects exact duplicate', () => {
    expect(isDuplicateTask('背单词', ['背单词', '健身'])).toBe(true)
  })

  it('detects substring match', () => {
    expect(isDuplicateTask('今晚背单词', ['背单词'])).toBe(true)
  })
})

describe('generateRoast', () => {
  it('returns persist roast on second attempt', () => {
    const text = generateRoast({
      task: '跑步',
      hour: 10,
      attemptCount: 2,
      existingTasks: [],
    })
    expect(text.length).toBeGreaterThan(0)
    expect(text).toMatch(/跑步|运动|入库|记上|加吧|逃跑|流汗|健身|跑步机|汗/)
  })

  it('persist roast mentions task-specific words', () => {
    const text = generateRoast({
      task: '攒钱去日本',
      hour: 10,
      attemptCount: 2,
      existingTasks: [],
    })
    expect(text).toMatch(/日本|机票|攒|入库|记上/)
  })

  it('returns duplicate roast for repeated task', () => {
    const text = generateRoast({
      task: '背单词',
      hour: 10,
      attemptCount: 1,
      existingTasks: ['背单词'],
    })
    expect(text).toMatch(/又来|似曾相识|复读|duplicate/)
  })

  it('handles complete event', () => {
    const text = generateRoast({
      task: '跑步',
      hour: 10,
      attemptCount: 1,
      existingTasks: [],
      event: 'complete',
      escapeCount: 3,
    })
    expect(text).toContain('3')
  })
})
