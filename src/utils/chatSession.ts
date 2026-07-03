import type { ChatMessage } from '../components/ChatThread'

const STORAGE_KEY = 'chaotic-session-v1'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface ChatSession {
  pendingTask: string
  chatMessages: ChatMessage[]
  attemptCount: number
  updatedAt: number
}

export function loadChatSession(): ChatSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as ChatSession
    if (!session.pendingTask || Date.now() - session.updatedAt > MAX_AGE_MS) {
      clearChatSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveChatSession(session: Omit<ChatSession, 'updatedAt'> & { updatedAt?: number }) {
  const payload: ChatSession = {
    ...session,
    updatedAt: session.updatedAt ?? Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearChatSession() {
  localStorage.removeItem(STORAGE_KEY)
}
