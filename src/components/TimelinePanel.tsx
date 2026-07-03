import { useEffect, useRef } from 'react'
import type { TimelineEntry } from '../types'
import { formatTimelineTime, timelineKindLabel } from '../utils/timeline'

interface Props {
  entries: TimelineEntry[]
}

export function TimelinePanel({ entries }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="timeline-panel timeline-panel--empty">
        <p>还没有摆烂记录。加任务、抬杠、完成或甩锅后会出现在这里。</p>
      </div>
    )
  }

  return (
    <div className="timeline-panel" ref={scrollRef}>
      <ul className="timeline-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`timeline-item timeline-item--${entry.kind}`}>
            <div className="timeline-item-head">
              <span className="timeline-kind">{timelineKindLabel(entry.kind)}</span>
              <time className="timeline-time" dateTime={new Date(entry.at).toISOString()}>
                {formatTimelineTime(entry.at)}
              </time>
            </div>
            <p className="timeline-text">{entry.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
