import { useEffect, useRef, useState } from 'react'
import type { Stats, Task, TimelineEntry } from '../types'
import type { UnlockedBadge } from '../utils/badges'
import { calcPieIndex, getPieComment, getSlackerTitle } from '../utils/slackerProfile'
import { generateSlackerReport } from '../utils/slackerReport'
import type { DailySnapshot } from '../utils/dailySnapshots'
import { generateWeeklyReport } from '../utils/weeklyReport'
import {
  clearOnboardingFlag,
  downloadBackup,
  importBackup,
} from '../utils/storage'
import { downloadBlob, renderElementToPng } from '../utils/shareCardImage'
import { AnimatedNumber } from './AnimatedNumber'
import { PieSparkline } from './PieSparkline'
import { ReportPreviewModal } from './ReportPreviewModal'
import { ShareCard } from './ShareCard'
import { WeeklyShareCard } from './WeeklyShareCard'

type ReportView = 'daily' | 'weekly' | null

interface Props {
  tasks: Task[]
  stats: Stats
  badges: UnlockedBadge[]
  snapshots: DailySnapshot[]
  timeline: TimelineEntry[]
  compact?: boolean
  onTasksChange: (tasks: Task[]) => void
  onStatsChange: (stats: Stats) => void
  onBadgesImport: (badges: UnlockedBadge[] | undefined) => void
  onTimelineImport: (timeline: TimelineEntry[] | undefined) => void
  onSnapshotsImport: (snapshots: DailySnapshot[] | undefined) => void
  onClearCompleted: () => void
  onToast: (message: string) => void
  onResetOnboarding: () => void
  onOpenMemorial: () => void
  guideExpanded?: boolean
  onDismissGuideExpand?: () => void
}

const STAT_ITEMS = [
  { key: 'rejected' as const, label: '劝退', icon: '🛡' },
  { key: 'escaped' as const, label: '逃跑', icon: '🏃' },
  { key: 'snoozed' as const, label: '甩锅', icon: '📅' },
  { key: 'completed' as const, label: '完成', icon: '💀' },
]

export function HudBar({
  tasks,
  stats,
  badges,
  snapshots,
  timeline,
  compact = false,
  onTasksChange,
  onStatsChange,
  onBadgesImport,
  onTimelineImport,
  onSnapshotsImport,
  onClearCompleted,
  onToast,
  onResetOnboarding,
  onOpenMemorial,
  guideExpanded = false,
  onDismissGuideExpand,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)
  const [savingDailyImage, setSavingDailyImage] = useState(false)
  const [savingWeeklyImage, setSavingWeeklyImage] = useState(false)
  const [reportView, setReportView] = useState<ReportView>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const dailyShareRef = useRef<HTMLDivElement>(null)
  const weeklyShareRef = useRef<HTMLDivElement>(null)
  const pieIndex = calcPieIndex(tasks, stats)
  const profile = getSlackerTitle(stats, pieIndex)
  const doneCount = tasks.filter((t) => t.completed).length
  const showExpanded = expanded || guideExpanded

  useEffect(() => {
    if (!compact) setForceOpen(false)
  }, [compact])

  const showCompact = compact && !forceOpen

  const dailyReportText = generateSlackerReport(tasks, stats)
  const weeklyReportText = generateWeeklyReport(tasks, stats, badges, snapshots)

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(dailyReportText)
      onToast('摆烂报告已复制到剪贴板')
    } catch {
      onToast('复制失败，请手动复制')
    }
  }

  const saveDailyReportImage = async () => {
    const el = dailyShareRef.current
    if (!el) {
      onToast('卡片未就绪，请稍后再试')
      return
    }
    setSavingDailyImage(true)
    try {
      const blob = await renderElementToPng(el)
      if (!blob) {
        onToast('图片生成失败，已改为复制文本')
        await copyReport()
        return
      }
      const date = new Date().toISOString().slice(0, 10)
      await downloadBlob(blob, `chaotic-report-${date}.png`)
      onToast('摆烂报告图片已保存')
    } catch {
      onToast('图片生成失败，已改为复制文本')
      await copyReport()
    } finally {
      setSavingDailyImage(false)
    }
  }

  const copyWeeklyReport = async () => {
    try {
      await navigator.clipboard.writeText(weeklyReportText)
      onToast('本周摆烂周报已复制')
    } catch {
      onToast('复制失败，请手动复制')
    }
  }

  const saveWeeklyReportImage = async () => {
    const el = weeklyShareRef.current
    if (!el) {
      onToast('卡片未就绪，请稍后再试')
      return
    }
    setSavingWeeklyImage(true)
    try {
      const blob = await renderElementToPng(el)
      if (!blob) {
        onToast('图片生成失败，已改为复制文本')
        await copyWeeklyReport()
        return
      }
      const date = new Date().toISOString().slice(0, 10)
      await downloadBlob(blob, `chaotic-weekly-${date}.png`)
      onToast('本周周报图片已保存')
    } catch {
      onToast('图片生成失败，已改为复制文本')
      await copyWeeklyReport()
    } finally {
      setSavingWeeklyImage(false)
    }
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = importBackup(String(reader.result ?? ''))
      if ('error' in result) {
        onToast(result.error)
        return
      }
      onTasksChange(result.tasks)
      onStatsChange(result.stats)
      onBadgesImport(result.badges)
      onTimelineImport(result.timeline)
      onSnapshotsImport(result.snapshots)
      onToast(`导入成功：${result.tasks.length} 条任务`)
    }
    reader.readAsText(file)
  }

  const confirmClearDone = () => {
    if (doneCount === 0) {
      onToast('没有已完成的任务')
      return
    }
    if (window.confirm(`清空 ${doneCount} 条已完成任务？此操作不可撤销。`)) {
      onClearCompleted()
      onToast('已清空已完成')
    }
  }

  const toggleExpanded = () => {
    if (showExpanded) {
      setExpanded(false)
      if (guideExpanded) onDismissGuideExpand?.()
    } else {
      setExpanded(true)
    }
  }

  if (showCompact) {
    return (
      <footer id="onboard-hud" className="hud-bar hud-bar--compact">
        <div className="container hud-inner hud-inner--compact">
          <button
            type="button"
            className="hud-compact-mini"
            onClick={() => setForceOpen(true)}
          >
            <span className="hud-pie-title">{profile.emoji} 画饼</span>
            <AnimatedNumber value={pieIndex} suffix="%" className="hud-pie-num" />
            <span className="hud-toggle">展开 ▴</span>
          </button>
        </div>
      </footer>
    )
  }

  return (
    <>
      <div className="share-card-host" aria-hidden="true">
        <ShareCard ref={dailyShareRef} tasks={tasks} stats={stats} />
        <WeeklyShareCard
          ref={weeklyShareRef}
          tasks={tasks}
          stats={stats}
          badges={badges}
          snapshots={snapshots}
        />
      </div>

      <footer id="onboard-hud" className={`hud-bar ${showExpanded ? 'is-expanded' : ''}`}>
        <div className="container hud-inner">
          <button
            type="button"
            className="hud-compact"
            onClick={toggleExpanded}
            aria-expanded={showExpanded}
          >
            <div className="hud-stats-row">
              {STAT_ITEMS.map(({ key, label, icon }) => (
                <span key={key} className="hud-stat-chip">
                  <span className="hud-stat-icon">{icon}</span>
                  <span className="hud-stat-val">{stats[key]}</span>
                  <span className="hud-stat-label">{label}</span>
                </span>
              ))}
            </div>

            <div className="hud-pie-block">
              <div className="hud-pie-head">
                <span className="hud-pie-title">{profile.emoji} {profile.title}</span>
                <AnimatedNumber value={pieIndex} suffix="%" className="hud-pie-num" />
              </div>
              <div className="hud-pie-bar">
                <div className="hud-pie-fill" style={{ width: `${pieIndex}%` }} />
              </div>
            </div>

            <span className="hud-toggle">{showExpanded ? '收起 ▾' : '档案 ▴'}</span>
          </button>

          {showExpanded && (
            <div className="hud-expanded animate-in">
              <p className="hud-desc">{profile.subtitle}</p>
              <p className="hud-footnote">{getPieComment(pieIndex)}</p>
              <PieSparkline snapshots={snapshots} />
              <div className="hud-actions">
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={onOpenMemorial}
                >
                  💀 纪念馆 ({doneCount})
                </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setReportView('daily')}>
                  摆烂报告
                </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setReportView('weekly')}>
                本周周报
              </button>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => downloadBackup(tasks, stats, badges, timeline, snapshots)}
              >
                导出文件
              </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => importRef.current?.click()}>
                  导入
                </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={confirmClearDone}>
                  清空已完成
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    clearOnboardingFlag()
                    onResetOnboarding()
                    onToast('新手引导已重置')
                  }}
                >
                  重置引导
                </button>
              </div>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.target.value = ''
                }}
              />
            </div>
          )}
        </div>
      </footer>

      <ReportPreviewModal
        open={reportView === 'daily'}
        title="📋 今日摆烂报告"
        content={dailyReportText}
        onClose={() => setReportView(null)}
        onToast={onToast}
        onSaveImage={saveDailyReportImage}
        savingImage={savingDailyImage}
      />

      <ReportPreviewModal
        open={reportView === 'weekly'}
        title="📋 本周摆烂周报"
        content={weeklyReportText}
        onClose={() => setReportView(null)}
        onToast={onToast}
        onSaveImage={saveWeeklyReportImage}
        savingImage={savingWeeklyImage}
      />
    </>
  )
}
