import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MascotMood } from './components/AiMascot'
import { DailyChallengeBanner } from './components/DailyChallengeBanner'
import { ApiSettings } from './components/ApiSettings'
import { BattleEmpty } from './components/BattleEmpty'
import { ChatThread } from './components/ChatThread'
import { ConfettiBurst } from './components/ConfettiBurst'
import { HudBar } from './components/HudBar'
import { MiracleMemorial } from './components/MiracleMemorial'
import { OnboardingGuide } from './components/OnboardingGuide'
import { TaskItem } from './components/TaskItem'
import { Toast } from './components/Toast'
import { useTimeline } from './hooks/useTimeline'
import { useBadges } from './hooks/useBadges'
import { useChatSession } from './hooks/useChatSession'
import { usePwaInstallHint } from './hooks/usePwaInstallHint'
import { useStats } from './hooks/useStats'
import { useTasks } from './hooks/useTasks'
import type { Stats, Task } from './types'
import { getEventRoast } from './utils/aiRoast'
import { loadApiConfig, canUseAi, aiProviderLabel, shouldShowAiBadge, type ApiConfig } from './utils/apiConfig'
import { useServerAi } from './hooks/useServerAi'
import { sortActiveTasksByRot } from './utils/sortTasks'
import {
  applyTheme,
  getThemeLabel,
  loadTheme,
  saveTheme,
  toggleTheme,
  type ThemeId,
} from './utils/theme'
import { getTaskRot } from './utils/taskRot'
import {
  checkChallengeComplete,
  getOrCreateDailyChallenge,
  markChallengeDone,
  pickChallengeReward,
  type DailyChallenge,
} from './utils/dailyChallenge'
import { bumpDailyStat, isChallengeFailed, loadDailyStats, type DailyStats } from './utils/dailyStats'
import {
  loadDailySnapshots,
  mergeSnapshotsFromImport,
  recordDailySnapshot,
  type DailySnapshot,
} from './utils/dailySnapshots'

type MobileTab = 'chat' | 'tasks'

export default function App() {
  const { tasks, persist, clearCompleted, replaceAll } = useTasks()
  const { stats, persistStats } = useStats()
  const { badges, checkAndUnlock, replaceFromImport } = useBadges()
  const { entries: timelineEntries, append: appendTimeline, replaceFromImport: replaceTimelineImport } =
    useTimeline()
  const totalSnoozes = tasks.reduce((s, t) => s + (t.snoozeCount ?? 0), 0)
  const activeTasks = useMemo(
    () => sortActiveTasksByRot(tasks.filter((t) => !t.completed)),
    [tasks]
  )
  const doneCount = tasks.filter((t) => t.completed).length

  const onAiRoast = useCallback(
    (text: string) => {
      appendTimeline('roast', text)
    },
    [appendTimeline]
  )

  const chat = useChatSession(tasks, activeTasks.length, totalSnoozes, onAiRoast)
  const { setChatMessages, uid: chatUid } = chat

  const [apiConfig, setApiConfig] = useState<ApiConfig>(loadApiConfig)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [memorialOpen, setMemorialOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeId>(loadTheme)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [inputFocused, setInputFocused] = useState(false)
  const [moodOverride, setMoodOverride] = useState<MascotMood | null>(null)
  const [onboardingReset, setOnboardingReset] = useState(0)
  const [guideHudExpanded, setGuideHudExpanded] = useState(false)
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>(() => loadDailySnapshots())
  const [challenge, setChallenge] = useState<DailyChallenge>(() => getOrCreateDailyChallenge())
  const [challengeDismissed, setChallengeDismissed] = useState(false)
  const { serverAi, isPending: serverAiPending } = useServerAi()

  const flashMood = useCallback((mood: MascotMood, ms = 2000) => {
    setMoodOverride(mood)
    setTimeout(() => setMoodOverride(null), ms)
  }, [])

  const tryCompleteChallenge = useCallback(
    (daily: DailyStats) => {
      if (challenge.done || challengeDismissed) return
      if (isChallengeFailed(challenge.id, daily)) return
      if (checkChallengeComplete(challenge, daily)) {
        markChallengeDone(challenge)
        setChallenge((c) => ({ ...c, done: true }))
        setToast(pickChallengeReward(challenge.date))
      }
    },
    [challenge, challengeDismissed]
  )

  const notifyNewBadges = useCallback(
    (nextStats: Stats, nextTasks: Task[]) => {
      const newly = checkAndUnlock(nextStats, nextTasks)
      if (newly.length === 0) return
      setConfettiBurst((n) => n + 1)
      flashMood('celebrating', 2500)
      const first = newly[0]
      const suffix = newly.length > 1 ? ` 等 ${newly.length} 枚` : ''
      setToast(`🏅 解锁徽章：${first.emoji} ${first.title}${suffix}`)
    },
    [checkAndUnlock, flashMood]
  )

  useEffect(() => {
    setSnapshots(recordDailySnapshot(tasks, stats))
  }, [tasks, stats])

  useEffect(() => {
    notifyNewBadges(stats, tasks)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- 启动时补检已有进度

  useEffect(() => {
    const timer = setInterval(() => {
      notifyNewBadges(stats, tasks)
    }, 60_000)
    return () => clearInterval(timer)
  }, [stats, tasks, notifyNewBadges])

  usePwaInstallHint(setToast)

  useEffect(() => {
    const syncConfig = (e: Event) => {
      const detail = (e as CustomEvent<ApiConfig>).detail
      if (detail) setApiConfig(detail)
    }
    window.addEventListener('chaotic-api-config', syncConfig)
    return () => window.removeEventListener('chaotic-api-config', syncConfig)
  }, [])

  const pushBattleReport = useCallback(
    (text: string, taskId?: string) => {
      setChatMessages((prev) => [...prev, { id: chatUid(), role: 'report', text }])
      appendTimeline('report', text, taskId)
    },
    [setChatMessages, chatUid, appendTimeline]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = chat.input.trim()
    if (!trimmed || chat.loading || chat.pendingTask) return

    chat.setChatMessages([{ id: chat.uid(), role: 'user', text: trimmed }])
    appendTimeline('user', trimmed)
    chat.setPendingTask(trimmed)
    chat.setAttemptCount(1)
    chat.setInput('')
    setMobileTab('chat')
    await chat.requestRoast(trimmed, 1)
  }

  const handleDismiss = () => {
    setConfettiBurst((n) => n + 1)
    appendTimeline('user', '好吧算了（劝退成功）')
    chat.clearChat()
    chat.setInput('')
    const daily = bumpDailyStat('rejected')
    const nextStats = { ...stats, rejected: stats.rejected + 1 }
    persistStats(nextStats)
    notifyNewBadges(nextStats, tasks)
    tryCompleteChallenge(daily)
  }

  const handleThemeToggle = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
    applyTheme(next)
  }

  const handleOnboardingStep = (step: number) => {
    if (step === 0) {
      setMobileTab('chat')
      setGuideHudExpanded(false)
    } else if (step === 1 || step === 2) {
      setMobileTab('tasks')
      setGuideHudExpanded(false)
    } else {
      setGuideHudExpanded(true)
    }
  }

  const handleForceAdd = async () => {
    if (!chat.pendingTask) return

    if (chat.attemptCount === 1) {
      chat.setAttemptCount(2)
      await chat.requestRoast(chat.pendingTask, 2)
      return
    }

    const lastAi = [...chat.chatMessages].reverse().find((m) => m.role === 'ai')
    const newTask: Task = {
      id: chat.uid(),
      text: chat.pendingTask,
      createdAt: Date.now(),
      completed: false,
      roast: lastAi?.text ?? '',
    }
    persist([newTask, ...tasks])
    appendTimeline('task_added', `强行加入：${newTask.text}`, newTask.id)
    const daily = bumpDailyStat('added')
    chat.clearChat()
    chat.setInput('')
    setMobileTab('tasks')
    notifyNewBadges(stats, [newTask, ...tasks])
    tryCompleteChallenge(daily)
  }

  const handleComplete = async (
    id: string,
    escapeCount: number,
    completionRoast: string,
    viaSurrender = false
  ) => {
    const task = tasks.find((t) => t.id === id)
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            completed: true,
            escapeCount,
            completionRoast,
            completedAt: Date.now(),
          }
        : t
    )
    persist(updatedTasks)
    const nextStats: Stats = {
      ...stats,
      completed: stats.completed + 1,
      escaped: stats.escaped + escapeCount,
      surrendered: viaSurrender ? (stats.surrendered ?? 0) + 1 : stats.surrendered,
    }
    persistStats(nextStats)

    setConfettiBurst((n) => n + 1)
    flashMood('celebrating', 2500)
    notifyNewBadges(nextStats, updatedTasks)
    appendTimeline(
      'task_done',
      `奇迹完成：${task?.text ?? id}${viaSurrender ? '（认命）' : ''}${escapeCount > 0 ? ` · 抓 ${escapeCount} 次` : ''}`,
      id,
      { escapeCount, viaSurrender }
    )
    const daily = bumpDailyStat('done')
    tryCompleteChallenge(daily)

    if (task) {
      const rot = getTaskRot(task.createdAt)
      const result = await getEventRoast({
        task: task.text,
        hour: new Date().getHours(),
        attemptCount: 1,
        existingTasks: tasks.map((t) => t.text),
        event: 'complete',
        escapeCount,
        rotLevel: rot.level,
      })
      pushBattleReport(result.text, id)
    }
  }

  const handleDelete = (id: string) => {
    persist(tasks.filter((t) => t.id !== id))
  }

  const handleSnooze = async (id: string, excuse: string) => {
    const task = tasks.find((t) => t.id === id)
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            snoozeCount: (t.snoozeCount ?? 0) + 1,
            lastSnoozeExcuse: excuse,
          }
        : t
    )
    persist(updatedTasks)
    const nextStats = { ...stats, snoozed: stats.snoozed + 1 }
    persistStats(nextStats)
    setToast(`甩锅成功：${excuse}`)
    flashMood('disappointed', 2000)
    notifyNewBadges(nextStats, updatedTasks)
    appendTimeline('task_snooze', `甩锅：${task?.text ?? id} — ${excuse}`, id)
    bumpDailyStat('snoozed')
    tryCompleteChallenge(loadDailyStats())

    if (task) {
      const rot = getTaskRot(task.createdAt)
      const result = await getEventRoast({
        task: task.text,
        hour: new Date().getHours(),
        attemptCount: 1,
        existingTasks: tasks.map((t) => t.text),
        event: 'snooze',
        snoozeExcuse: excuse,
        rotLevel: rot.level,
      })
      pushBattleReport(result.text, id)
    }
  }

  const aiConnected = canUseAi(apiConfig, serverAi)
  const showAiBadge = shouldShowAiBadge(apiConfig, serverAi)
  const hasAiReply = chat.chatMessages.some((m) => m.role === 'ai')
  const showRecovery = !!chat.pendingTask && !chat.loading && !hasAiReply
  const showActions = !chat.loading && hasAiReply && !!chat.pendingTask
  const streamingRoast = chat.loading && !!chat.roast

  const handleRetryRoast = () => {
    if (!chat.pendingTask) return
    chat.dismissSessionBanner()
    void chat.requestRoast(chat.pendingTask, chat.attemptCount || 1)
  }

  const handleAbandonStuck = () => {
    chat.clearChat()
    chat.setInput('')
    chat.dismissSessionBanner()
  }

  return (
    <div className="site">
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-scanlines" aria-hidden="true" />

      <header className="site-header">
        <div className="container header-inner">
          <div className="site-brand">
            <h1>赛博抬杠待办</h1>
          </div>
          <div className="header-actions">
            <span className={`status-badge ${aiConnected ? 'is-live' : showAiBadge ? 'is-hosted' : ''}`}>
              <span className="status-dot" />
              {serverAiPending
                ? 'AI · 连接中'
                : showAiBadge
                  ? `AI · ${aiProviderLabel(apiConfig, serverAi)}${!aiConnected ? '（关）' : ''}`
                  : '本地抬杠'}
            </span>
            <button
              type="button"
              className="btn btn-soft btn-theme"
              onClick={handleThemeToggle}
              title={`切换主题（当前：${getThemeLabel(theme)}）`}
              aria-label={`切换主题（当前：${getThemeLabel(theme)}）`}
            >
              {theme === 'dark' ? '🌙' : '⬛'}{' '}
              <span className="btn-theme-label">{getThemeLabel(theme)}</span>
            </button>
            <button
              type="button"
              className="btn btn-soft btn-ai-config"
              onClick={() => setSettingsOpen(true)}
              aria-label="AI 配置"
            >
              ⚙ <span className="btn-ai-label">AI 配置</span>
            </button>
          </div>
        </div>
      </header>

      {!challengeDismissed && (
        <DailyChallengeBanner
          challenge={challenge}
          daily={loadDailyStats()}
          onDismiss={() => setChallengeDismissed(true)}
        />
      )}

      {(chat.sessionRestored || showRecovery) && (
        <div className="session-banner container">
          <span>
            {showRecovery ? '抬杠请求未完成' : '你还有一场未完的抬杠'}（{chat.pendingTask}）
          </span>
          <div className="session-banner-actions">
            {showRecovery && (
              <>
                <button type="button" className="btn btn-accent btn-sm" onClick={handleRetryRoast}>
                  重新请求
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleAbandonStuck}>
                  放弃
                </button>
              </>
            )}
            {!showRecovery && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={chat.dismissSessionBanner}>
                知道了
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mobile-tabs-bar">
        <div className="container mobile-tabs">
          <button
            type="button"
            className={`mobile-tab ${mobileTab === 'chat' ? 'is-active' : ''}`}
            onClick={() => setMobileTab('chat')}
          >
            抬杠
            {chat.pendingTask && <span className="mobile-tab-dot" aria-label="有待决抬杠" />}
          </button>
          <button
            type="button"
            className={`mobile-tab ${mobileTab === 'tasks' ? 'is-active' : ''}`}
            onClick={() => setMobileTab('tasks')}
          >
            待办
            {activeTasks.length > 0 && (
              <span className="mobile-tab-badge">{activeTasks.length}</span>
            )}
          </button>
        </div>
      </div>

      <main className="container page">
        <div className="stage-grid">
          <div className="stage-column">
            <div className="desktop-col-tab">抬杠</div>
            <section
              id="onboard-chat"
              className={`chat-stage surface-card ${mobileTab === 'chat' ? 'stage-visible' : 'stage-hidden-mobile'}`}
            >
              <div className="stage-head stage-head-fixed">
                <h2 className="stage-head-title-desktop">AI 对话区</h2>
                <p>发一条任务，看我怎么怼你</p>
              </div>

              <div className="chat-stage-body">
                <ChatThread
                  messages={chat.chatMessages}
                  roast={streamingRoast ? chat.roast : ''}
                  loading={chat.loading}
                  streaming={streamingRoast}
                  attemptCount={chat.attemptCount}
                  showActions={showActions}
                  showRecovery={showRecovery}
                  moodOverride={moodOverride}
                  timelineEntries={timelineEntries}
                  onDismiss={handleDismiss}
                  onForceAdd={handleForceAdd}
                  onRetry={handleRetryRoast}
                  onAbandon={handleAbandonStuck}
                />

                {chat.apiError && <p className="api-error">{chat.apiError}</p>}
              </div>

              <form onSubmit={handleSubmit} className="composer-form composer-form-fixed">
                <input
                  id="task-input"
                  type="text"
                  value={chat.input}
                  onChange={(e) => chat.setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="例如：今晚 8 点背单词"
                  disabled={chat.loading || !!chat.pendingTask}
                  maxLength={120}
                />
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={!chat.input.trim() || chat.loading || !!chat.pendingTask}
                >
                  发送
                </button>
              </form>
            </section>
          </div>

          <div className="stage-column">
            <div className="desktop-col-tab desktop-col-tab--battle">
              待办
              {activeTasks.length > 0 && (
                <span className="desktop-col-badge">{activeTasks.length}</span>
              )}
            </div>
            <section
              id="onboard-battle"
              className={`battle-stage surface-card ${mobileTab === 'tasks' ? 'stage-visible' : 'stage-hidden-mobile'}`}
            >
              <div className="stage-head stage-head-row stage-head-fixed">
                <div>
                  <h2 className="stage-head-title-desktop">待办战场</h2>
                  <p id="onboard-memorial" className="battle-memorial-hint">
                    💀 完成的奇迹进纪念馆{doneCount > 0 ? `（已有 ${doneCount} 条）` : ''}
                  </p>
                </div>
                <span className="badge">{activeTasks.length}</span>
              </div>

              {doneCount > 0 && (
                <button
                  type="button"
                  className="memorial-link-btn"
                  onClick={() => setMemorialOpen(true)}
                >
                  💀 奇迹纪念馆 ({doneCount})
                </button>
              )}

              {activeTasks.length > 8 && (
                <p className="battle-hint">{activeTasks.length} 项进行中 · 越烂越靠上</p>
              )}

              <div className="battle-scroll">
                {activeTasks.length === 0 ? (
                  <BattleEmpty />
                ) : (
                  <ul className="task-list">
                    {activeTasks.map((task, i) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        index={i}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                        onSnooze={handleSnooze}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <HudBar
        tasks={tasks}
        stats={stats}
        badges={badges}
        snapshots={snapshots}
        timeline={timelineEntries}
        compact={inputFocused}
        onTasksChange={replaceAll}
        onStatsChange={persistStats}
        onBadgesImport={replaceFromImport}
        onTimelineImport={replaceTimelineImport}
        onSnapshotsImport={(incoming) => setSnapshots(mergeSnapshotsFromImport(incoming))}
        onClearCompleted={clearCompleted}
        onToast={setToast}
        onResetOnboarding={() => {
          setGuideHudExpanded(false)
          setOnboardingReset((n) => n + 1)
        }}
        onOpenMemorial={() => setMemorialOpen(true)}
        guideExpanded={guideHudExpanded}
        onDismissGuideExpand={() => setGuideHudExpanded(false)}
      />

      <MiracleMemorial
        open={memorialOpen}
        onClose={() => setMemorialOpen(false)}
        tasks={tasks}
        badges={badges}
      />

      <ApiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={setApiConfig}
        serverAi={serverAi}
      />

      <ConfettiBurst burst={confettiBurst} />

      <OnboardingGuide
        onStepChange={handleOnboardingStep}
        onFinish={() => setGuideHudExpanded(false)}
        resetToken={onboardingReset}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
