import { describe, expect, it, beforeEach, vi } from 'vitest'
import { appendTimelineEntry, sortTimeline, timelineKindLabel } from './timeline'
import type { TimelineEntry } from '../types'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('timeline', () => {
  it('sorts by time desc then kind priority', () => {
    const t = 1_700_000_000_000
    const entries: TimelineEntry[] = [
      { id: '1', at: t, kind: 'user', text: 'a' },
      { id: '2', at: t, kind: 'task_done', text: 'b' },
      { id: '3', at: t + 1, kind: 'roast', text: 'c' },
    ]
    const sorted = sortTimeline(entries)
    expect(sorted[0].kind).toBe('roast')
    expect(sorted[1].kind).toBe('task_done')
  })

  it('appends and trims to max', () => {
    const first = appendTimelineEntry({ kind: 'user', text: 'hello' })
    expect(first).toHaveLength(1)
    appendTimelineEntry({ kind: 'roast', text: 'world' }, first)
    const loaded = appendTimelineEntry({ kind: 'report', text: 'x' })
    expect(loaded.length).toBeGreaterThanOrEqual(2)
  })

  it('labels kinds in Chinese', () => {
    expect(timelineKindLabel('task_done')).toBe('完成')
  })
})
