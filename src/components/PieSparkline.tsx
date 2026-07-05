import { getLast7DayPiePoints, type DailySnapshot } from '../utils/dailySnapshots'

interface Props {
  snapshots: DailySnapshot[]
}

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'] as const

/** 画饼指数 → 单日 emoji（与 getPieComment 区间对齐） */
export function pieIndexToEmoji(pieIndex: number | null): string {
  if (pieIndex == null) return '·'
  if (pieIndex >= 85) return '🔥'
  if (pieIndex >= 60) return '🥞'
  if (pieIndex >= 35) return '😎'
  return '🐟'
}

function weekdayLabel(dateKey: string): string {
  return WEEKDAY[new Date(`${dateKey}T12:00:00`).getDay()]
}

function dayTitle(dateKey: string, pieIndex: number | null): string {
  const label = pieIndex == null ? '无数据' : `${pieIndex}%`
  return `${dateKey.slice(5)} 周${weekdayLabel(dateKey)}: ${label}`
}

export function PieSparkline({ snapshots }: Props) {
  const points = getLast7DayPiePoints(snapshots)
  const ariaLabel = points
    .map((p) => {
      const wd = weekdayLabel(p.date)
      const v = p.pieIndex == null ? '无数据' : `${p.pieIndex}%`
      return `${p.date.slice(5)}周${wd}${v}`
    })
    .join('，')

  return (
    <div className="pie-sparkline">
      <span className="pie-sparkline-label">7 日画饼</span>
      <div className="pie-sparkline-days" role="img" aria-label={`近 7 日画饼：${ariaLabel}`}>
        {points.map((p) => {
          const empty = p.pieIndex == null
          return (
            <span
              key={p.date}
              className={`pie-sparkline-day${empty ? ' pie-sparkline-day--empty' : ''}`}
              title={dayTitle(p.date, p.pieIndex)}
            >
              <span className="pie-sparkline-emoji" aria-hidden="true">
                {pieIndexToEmoji(p.pieIndex)}
              </span>
              <span className="pie-sparkline-wd" aria-hidden="true">
                {weekdayLabel(p.date)}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
