import type { DailyChallenge } from '../utils/dailyChallenge'
import { isChallengeFailed } from '../utils/dailyStats'
import type { DailyStats } from '../utils/dailyStats'

interface Props {
  challenge: DailyChallenge
  daily: DailyStats
  onDismiss: () => void
}

export function DailyChallengeBanner({ challenge, daily, onDismiss }: Props) {
  if (challenge.done) return null

  const failed = isChallengeFailed(challenge.id, daily)

  return (
    <div className={`daily-challenge ${failed ? 'daily-challenge--failed' : ''}`}>
      <div className="daily-challenge-inner container">
        <span className="daily-challenge-label">今日挑战</span>
        <span className="daily-challenge-title">{challenge.title}</span>
        {failed && <span className="daily-challenge-status">已翻车</span>}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss} aria-label="关闭">
          ×
        </button>
      </div>
    </div>
  )
}
