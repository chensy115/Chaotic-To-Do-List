import { getLast7DayPiePoints, type DailySnapshot } from '../utils/dailySnapshots'

interface Props {
  snapshots: DailySnapshot[]
}

export function PieSparkline({ snapshots }: Props) {
  const points = getLast7DayPiePoints(snapshots)
  const w = 120
  const h = 32
  const max = 100
  const step = w / Math.max(1, points.length - 1)

  const coords = points.map((p, i) => {
    const v = p.pieIndex ?? 0
    const x = i * step
    const y = h - (v / max) * h
    return `${x},${y}`
  })

  const polyline = coords.join(' ')

  return (
    <div className="pie-sparkline" title="近 7 日画饼指数">
      <span className="pie-sparkline-label">7 日画饼</span>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        <polyline
          fill="none"
          stroke="var(--neon-cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
          points={polyline}
        />
        {points.map((p, i) => {
          const v = p.pieIndex ?? 0
          return (
            <circle
              key={p.date}
              cx={i * step}
              cy={h - (v / max) * h}
              r="2.5"
              fill={p.pieIndex == null ? 'var(--text-dim)' : 'var(--neon-pink)'}
            >
              <title>{`${p.date.slice(5)}: ${p.pieIndex ?? '无数据'}%`}</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}
