import { useEffect, useState } from 'react'

/** 窄屏、矮屏或触屏/粗指针设备（与 layout 断点一致） */
export function detectMobileLayout(breakpoint = 839) {
  if (typeof window === 'undefined') return false
  return window.matchMedia(
    `(max-width: ${breakpoint}px), (max-height: 639px), (pointer: coarse)`
  ).matches
}

export function useIsMobile(breakpoint = 839) {
  const [isMobile, setIsMobile] = useState(() => detectMobileLayout(breakpoint))

  useEffect(() => {
    const queries = [
      window.matchMedia(`(max-width: ${breakpoint}px)`),
      window.matchMedia('(max-height: 639px)'),
      window.matchMedia('(pointer: coarse)'),
    ]
    const update = () => setIsMobile(queries.some((mq) => mq.matches))
    update()
    for (const mq of queries) mq.addEventListener('change', update)
    return () => {
      for (const mq of queries) mq.removeEventListener('change', update)
    }
  }, [breakpoint])

  return isMobile
}
