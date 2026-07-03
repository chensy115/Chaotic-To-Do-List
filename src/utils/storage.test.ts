import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { Stats, Task } from '../types'
import { exportBackup, importBackup, loadTasksFromStorage, saveTasksToStorage, STORAGE_VERSION } from './storage'

const baseStats: Stats = { rejected: 1, escaped: 2, completed: 3, snoozed: 4 }

const sampleTask: Task = {
  id: 'task-1',
  text: '背单词',
  createdAt: 1_700_000_000_000,
  completed: false,
  escapeCount: 5,
}

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
})

describe('exportBackup / importBackup', () => {
  it('round-trips tasks and stats', () => {
    const json = exportBackup([sampleTask], baseStats)
    const result = importBackup(json)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].text).toBe('背单词')
    expect(result.stats).toEqual(baseStats)
  })

  it('includes version in export payload', () => {
    const data = JSON.parse(exportBackup([sampleTask], baseStats))
    expect(data.version).toBe(STORAGE_VERSION)
  })

  it('rejects invalid JSON', () => {
    expect(importBackup('not json')).toEqual({ error: 'JSON 解析失败' })
  })

  it('rejects backup without tasks array', () => {
    expect(importBackup(JSON.stringify({ stats: baseStats }))).toEqual({ error: '缺少 tasks 数组' })
  })

  it('rejects when all tasks fail normalization', () => {
    const json = JSON.stringify({ tasks: [{ id: 1 }] })
    expect(importBackup(json)).toEqual({ error: '没有有效的任务数据' })
  })

  it('rejects more than 500 tasks', () => {
    const tasks = Array.from({ length: 501 }, (_, i) => ({
      id: `t-${i}`,
      text: 'x',
      createdAt: 1,
    }))
    expect(importBackup(JSON.stringify({ tasks }))).toEqual({ error: '任务数量超出上限（500）' })
  })
})

describe('loadTasksFromStorage / saveTasksToStorage', () => {
  it('persists and reloads tasks', () => {
    saveTasksToStorage([sampleTask])
    expect(loadTasksFromStorage()).toEqual([sampleTask])
  })

  it('returns empty array for corrupt storage', () => {
    localStorage.setItem('chaotic-todos', '{bad')
    expect(loadTasksFromStorage()).toEqual([])
  })
})
