import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../components/ChatThread'
import type { RoastContext, Task } from '../types'
import { getRoast } from '../utils/aiRoast'
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
} from '../utils/chatSession'

function uid() {
  return crypto.randomUUID()
}

export function useChatSession(
  tasks: Task[],
  activeTaskCount: number,
  totalSnoozes: number,
  onAiRoast?: (text: string) => void
) {
  const restored = loadChatSession()
  const [input, setInput] = useState('')
  const [pendingTask, setPendingTask] = useState(restored?.pendingTask ?? '')
  const [roast, setRoast] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptCount, setAttemptCount] = useState(restored?.attemptCount ?? 0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(restored?.chatMessages ?? [])
  const [apiError, setApiError] = useState('')
  const [sessionRestored, setSessionRestored] = useState(!!restored?.pendingTask)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback(
    (session: { pendingTask: string; chatMessages: ChatMessage[]; attemptCount: number }) => {
      if (!session.pendingTask) {
        clearChatSession()
        return
      }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveChatSession(session)
      }, 500)
    },
    []
  )

  useEffect(() => {
    scheduleSave({ pendingTask, chatMessages, attemptCount })
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [pendingTask, chatMessages, attemptCount, scheduleSave])

  const clearChat = useCallback(() => {
    setChatMessages([])
    setRoast('')
    setPendingTask('')
    setAttemptCount(0)
    clearChatSession()
  }, [])

  const requestRoast = useCallback(
    async (taskText: string, attempt: number) => {
      setLoading(true)
      setRoast('')
      setApiError('')

      const previousRoast =
        attempt > 1
          ? [...chatMessages].reverse().find((m) => m.role === 'ai')?.text
          : undefined

      const ctx: RoastContext = {
        task: taskText,
        hour: new Date().getHours(),
        attemptCount: attempt,
        existingTasks: tasks.map((t) => t.text),
        activeTaskTexts: tasks.filter((t) => !t.completed).map((t) => t.text),
        activeTaskCount,
        totalSnoozes,
        event: 'add',
        previousRoast,
      }

      const result = await getRoast(ctx, (chunk) => setRoast(chunk))
      setRoast(result.text)
      if (result.error) setApiError(result.error)
      setLoading(false)

      if (result.text) {
        setChatMessages((prev) => [...prev, { id: uid(), role: 'ai', text: result.text }])
        onAiRoast?.(result.text)
        setRoast('')
      }
    },
    [tasks, activeTaskCount, totalSnoozes, chatMessages, onAiRoast]
  )

  const dismissSessionBanner = useCallback(() => setSessionRestored(false), [])

  return {
    input,
    setInput,
    pendingTask,
    setPendingTask,
    roast,
    loading,
    attemptCount,
    setAttemptCount,
    chatMessages,
    setChatMessages,
    apiError,
    sessionRestored,
    dismissSessionBanner,
    clearChat,
    requestRoast,
    uid,
  }
}
