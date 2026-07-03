import { useCallback, useEffect, useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

export const ONBOARDING_STORAGE_KEY = 'chaotic-onboarding-v2'

const STEPS = [
  {
    targetId: 'onboard-chat',
    title: '① AI 对话区',
    body: '在这输入任务，AI 会先怼你。「好吧算了」= 劝退成功；「我偏要加」得怼两次才进战场。完成、甩锅后的战报也会回流到这里。',
    mobileBody: '「抬杠」Tab：发任务、看 AI 怼你、读战报——左侧主舞台都在这。',
  },
  {
    targetId: 'onboard-battle',
    title: '② 待办战场',
    body: '只有进行中的任务会在这。抓住逃跑的「✓ 完成打卡」才算完；「明日再战」是甩锅。腐败度越高排越前，列表在区域内滚动。',
    mobileBody: '「待办」Tab：只管还没完成的关卡。完成按钮会跑，抓住它！',
  },
  {
    targetId: 'onboard-memorial',
    title: '③ 奇迹纪念馆',
    body: '完成的奇迹不会堆在战场上——归档进纪念馆。评语、抓几次、当初 AI 怎么怼的，都在这查。有完成记录后，战场顶部也会出现快捷入口。',
    mobileBody: '完成的任务进纪念馆。有奇迹后，待办 Tab 顶部会出现快捷按钮。',
  },
  {
    targetId: 'onboard-hud',
    title: '④ 摆烂档案',
    body: '底部 HUD：劝退 / 逃跑 / 甩锅 / 完成统计 + 画饼指数。展开可查看摆烂报告、本周周报，或导出备份。',
    mobileBody: '底部「档案 ▴」：画饼指数、导出备份、纪念馆入口都在这里。',
  },
]

interface Props {
  onStepChange?: (step: number) => void
  onFinish?: () => void
  resetToken?: number
}

export function OnboardingGuide({ onStepChange, onFinish, resetToken = 0 }: Props) {
  const isMobile = useIsMobile(839)
  const [phase, setPhase] = useState<'hidden' | 'invite' | 'tour'>('hidden')
  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setStep(0)
        setSpotlight(null)
        setPhase('invite')
      } else {
        setPhase('hidden')
      }
    } catch {
      setStep(0)
      setSpotlight(null)
      setPhase('invite')
    }
  }, [resetToken])

  const finish = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setPhase('hidden')
    setSpotlight(null)
    onFinish?.()
  }, [onFinish])

  const startTour = () => {
    setStep(0)
    setSpotlight(null)
    setPhase('tour')
  }

  const updateSpotlight = useCallback(() => {
    const targetId = STEPS[step]?.targetId
    if (!targetId) return
    const el = document.getElementById(targetId)
    if (!el) {
      setSpotlight(null)
      return
    }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setSpotlight(el.getBoundingClientRect())
  }, [step])

  useEffect(() => {
    if (phase !== 'tour') return
    onStepChange?.(step)
    const delay = step >= 2 ? 180 : 50
    const timer = setTimeout(updateSpotlight, delay)
    const onResize = () => updateSpotlight()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [phase, step, onStepChange, updateSpotlight])

  useEffect(() => {
    if (phase !== 'tour') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, finish])

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((s) => s + 1)
  }

  if (phase === 'hidden') return null

  if (phase === 'invite') {
    return (
      <div className="onboarding-invite animate-in" role="dialog" aria-label="新手引导邀请">
        <p className="onboarding-invite-text">
          首次使用？<strong>4 步</strong>快速了解玩法（不挡屏，可随时跳过）
        </p>
        <div className="onboarding-invite-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
            直接使用
          </button>
          <button type="button" className="btn btn-accent btn-sm" onClick={startTour}>
            开始引导
          </button>
        </div>
      </div>
    )
  }

  const current = STEPS[step]
  const bodyText = isMobile && current.mobileBody ? current.mobileBody : current.body

  return (
    <div className="onboarding-root" role="dialog" aria-modal="true" aria-label="新手引导">
      <button
        type="button"
        className="onboarding-backdrop"
        onClick={finish}
        aria-label="跳过引导，直接使用"
      />

      {spotlight && (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotlight.top - 6,
            left: spotlight.left - 6,
            width: spotlight.width + 12,
            height: spotlight.height + 12,
          }}
        />
      )}

      <div className="onboarding-card animate-in">
        <p className="onboarding-step">
          {step + 1} / {STEPS.length}
        </p>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-body">{bodyText}</p>
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost onboarding-skip" onClick={finish}>
            跳过
          </button>
          <button type="button" className="btn btn-accent" onClick={next}>
            {step >= STEPS.length - 1 ? '开始抬杠' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
