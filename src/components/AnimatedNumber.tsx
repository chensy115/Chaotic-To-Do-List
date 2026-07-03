import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  suffix?: string
  className?: string
  duration?: number
}

export function AnimatedNumber({ value, suffix = '', className, duration = 600 }: Props) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    const start = performance.now()
    let frame: number

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}
