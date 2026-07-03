import { useCallback, useState } from 'react'
import type { Task } from '../types'
import { loadTasksFromStorage, saveTasksToStorage } from '../utils/storage'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage)

  const persist = useCallback((next: Task[]) => {
    setTasks(next)
    saveTasksToStorage(next)
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => {
      const next = prev.filter((t) => !t.completed)
      saveTasksToStorage(next)
      return next
    })
  }, [])

  const replaceAll = useCallback((next: Task[]) => {
    persist(next)
  }, [persist])

  return { tasks, persist, clearCompleted, replaceAll }
}
