import { useEffect, useRef, useState } from 'react'
import type { TimelineEntry } from '../types'
import { AiMascot, type MascotMood } from './AiMascot'
import { TimelinePanel } from './TimelinePanel'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai' | 'report'
  text: string
}

type MessageFilter = 'all' | 'roast' | 'report' | 'mine'
type ChatView = 'chat' | 'log'

interface Props {
  messages: ChatMessage[]
  roast: string
  loading: boolean
  streaming: boolean
  attemptCount: number
  showActions: boolean
  moodOverride?: MascotMood | null
  timelineEntries: TimelineEntry[]
  onDismiss: () => void
  onForceAdd: () => void
}

const IDLE_LINES = [
  '又想加任务？先过我这关。',
  '清单比你的脸还干净，继续保持。',
  '输入一条，看我怎么怼你 →',
]

const FILTERS: { id: MessageFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'roast', label: '抬杠' },
  { id: 'report', label: '战报' },
  { id: 'mine', label: '我的' },
]

const VIEWS: { id: ChatView; label: string }[] = [
  { id: 'chat', label: '对话' },
  { id: 'log', label: '日志' },
]

function getMood(
  loading: boolean,
  roast: string,
  showActions: boolean,
  attemptCount: number,
  override: MascotMood | null | undefined
): MascotMood {
  if (override) return override
  if (loading && !roast) return 'thinking'
  if (loading && roast) return 'roasting'
  if (showActions && attemptCount >= 2) return 'shocked'
  if (showActions) return 'smug'
  return 'idle'
}

function matchFilter(msg: ChatMessage, filter: MessageFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'mine') return msg.role === 'user'
  if (filter === 'roast') return msg.role === 'ai'
  return msg.role === 'report'
}

export function ChatThread({
  messages,
  roast,
  loading,
  streaming,
  attemptCount,
  showActions,
  moodOverride,
  timelineEntries,
  onDismiss,
  onForceAdd,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<MessageFilter>('all')
  const [view, setView] = useState<ChatView>('chat')
  const idleLine = IDLE_LINES[Math.floor(Date.now() / 60000) % IDLE_LINES.length]
  const mood = getMood(loading, roast, showActions, attemptCount, moodOverride)
  const hasActiveSession = loading || !!roast || messages.length > 0
  const filteredMessages = messages.filter((m) => matchFilter(m, filter))
  const showLiveRoast = filter === 'all' || filter === 'roast'

  useEffect(() => {
    if (view === 'log') return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, roast, loading, filter, view])

  return (
    <div className="chat-thread">
      <div className="chat-view-tabs" role="tablist" aria-label="对话视图">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`chat-view-tab ${view === id ? 'is-active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
            {id === 'log' && timelineEntries.length > 0 && (
              <span className="chat-view-badge">{timelineEntries.length}</span>
            )}
          </button>
        ))}
      </div>

      {view === 'log' ? (
        <TimelinePanel entries={timelineEntries} />
      ) : (
        <>
          <div className="chat-mascot-wrap">
            <AiMascot mood={mood} size={72} />
            {!hasActiveSession && <p className="chat-idle-line">{idleLine}</p>}
          </div>

          {messages.length > 0 && (
            <div className="chat-filters" role="tablist" aria-label="消息筛选">
              {FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  className={`chat-filter-pill ${filter === id ? 'is-active' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="chat-messages" ref={scrollRef} aria-live="polite" aria-relevant="additions">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble--${msg.role === 'report' ? 'report' : msg.role} animate-in`}
              >
                {msg.role === 'report' && <span className="chat-report-label">战报 · </span>}
                {msg.text}
              </div>
            ))}

            {filteredMessages.length === 0 && !loading && !roast && filter !== 'all' && (
              <p className="chat-filter-empty">这个分类下还没有消息</p>
            )}

            {loading && !roast && showLiveRoast && (
              <div className="chat-bubble chat-bubble--ai chat-bubble--loading">
                <div className="loading-wave">
                  <span /><span /><span />
                </div>
                <span>正在组织语言…</span>
              </div>
            )}

            {roast && showLiveRoast && (
              <div className="chat-bubble chat-bubble--ai animate-in">
                <p className={`chat-bubble-text ${streaming ? 'is-streaming' : ''}`}>{roast}</p>
              </div>
            )}
          </div>

          {showActions && (
            <div className="chat-chips animate-in">
              <button type="button" className="chip chip-soft" onClick={onDismiss}>
                好吧算了
              </button>
              <button
                type="button"
                className={`chip chip-accent ${attemptCount >= 2 ? 'chip-pulse' : ''}`}
                onClick={onForceAdd}
              >
                {attemptCount >= 2 ? '我就是要加！！！' : '我偏要加'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
