import { useCallback, useEffect, useRef, useState } from 'react'
import { ESCAPE_TAUNTS } from '../utils/roastEngine'

interface Props {
  onComplete: (viaSurrender?: boolean) => void
  disabled?: boolean
  onEscape?: (count: number) => void
  fleeRadius?: number
  arenaHeight?: number
  glitch?: boolean
  /** 移动端：降低灵敏度、加大触区 */
  mobile?: boolean
  /** 认命按钮出现所需逃跑次数 */
  surrenderAt?: number
}

const BUTTON_W = 120
const BUTTON_H = 40
const DEFAULT_SURRENDER_AT = 10
const MOVE_THRESHOLD = 12

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches
}

export function EscapingCheckbox({
  onComplete,
  disabled,
  onEscape,
  fleeRadius = 90,
  arenaHeight = 120,
  glitch = false,
  mobile = false,
  surrenderAt = DEFAULT_SURRENDER_AT,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [escapeCount, setEscapeCount] = useState(0)
  const [taunt, setTaunt] = useState('')
  const [caught, setCaught] = useState(false)

  const escapeCountRef = useRef(0)
  const suppressClickRef = useRef(false)
  const gestureRef = useRef({
    active: false,
    moved: false,
    startedOnButton: false,
    fledThisGesture: false,
    startX: 0,
    startY: 0,
  })

  const touchMode = mobile || isTouchDevice()
  const effectiveRadius = touchMode ? fleeRadius * 0.85 : fleeRadius
  const touchPadding = touchMode ? 28 : 0

  const randomPos = useCallback(
    (cursorX?: number, cursorY?: number) => {
      const arena = arenaRef.current
      if (!arena) return { x: 0, y: 0 }
      const rect = arena.getBoundingClientRect()
      const maxX = Math.max(0, rect.width - BUTTON_W)
      const maxY = Math.max(0, rect.height - BUTTON_H)

      for (let attempt = 0; attempt < 20; attempt++) {
        const x = Math.random() * maxX
        const y = Math.random() * maxY
        if (cursorX === undefined || cursorY === undefined) return { x, y }

        const btnCenterX = rect.left + x + BUTTON_W / 2
        const btnCenterY = rect.top + y + BUTTON_H / 2
        const dist = Math.hypot(btnCenterX - cursorX, btnCenterY - cursorY)
        if (dist > effectiveRadius + 40) return { x, y }
      }
      return { x: Math.random() * maxX, y: Math.random() * maxY }
    },
    [effectiveRadius]
  )

  const registerEscape = useCallback(() => {
    setEscapeCount((c) => {
      const next = c + 1
      escapeCountRef.current = next
      onEscape?.(next)
      if (next % 3 === 0) {
        setTaunt(ESCAPE_TAUNTS[Math.floor(Math.random() * ESCAPE_TAUNTS.length)])
        setTimeout(() => setTaunt(''), 1200)
      }
      return next
    })
  }, [onEscape])

  const isOnButton = useCallback((clientX: number, clientY: number) => {
    const btn = btnRef.current
    if (!btn) return false
    const rect = btn.getBoundingClientRect()
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    )
  }, [])

  const fleeIfNear = useCallback(
    (clientX: number, clientY: number, force = false) => {
      const btn = btnRef.current
      if (!btn) return false
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.hypot(clientX - cx, clientY - cy)

      if (force || dist < effectiveRadius + touchPadding) {
        setPos(randomPos(clientX, clientY))
        registerEscape()
        return true
      }
      return false
    },
    [effectiveRadius, touchPadding, randomPos, registerEscape]
  )

  useEffect(() => {
    escapeCountRef.current = escapeCount
  }, [escapeCount])

  useEffect(() => {
    setPos(randomPos())
  }, [randomPos])

  useEffect(() => {
    if (disabled || caught) return

    const arena = arenaRef.current
    if (!arena) return

    const onMouseMove = (e: MouseEvent) => fleeIfNear(e.clientX, e.clientY)

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const g = gestureRef.current
      if (touchMode && g.active) {
        const moved = Math.hypot(t.clientX - g.startX, t.clientY - g.startY)
        if (moved > MOVE_THRESHOLD) g.moved = true
      }
      fleeIfNear(t.clientX, t.clientY)
    }

    arena.addEventListener('mousemove', onMouseMove)
    arena.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      arena.removeEventListener('mousemove', onMouseMove)
      arena.removeEventListener('touchmove', onTouchMove)
    }
  }, [disabled, caught, fleeIfNear, touchMode])

  useEffect(() => {
    if (!touchMode || disabled || caught) return

    const arena = arenaRef.current
    if (!arena) return

    const resetGesture = () => {
      gestureRef.current.active = false
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      e.preventDefault()
      arena.setPointerCapture(e.pointerId)

      gestureRef.current = {
        active: true,
        moved: false,
        startedOnButton: isOnButton(e.clientX, e.clientY),
        fledThisGesture: false,
        startX: e.clientX,
        startY: e.clientY,
      }

      if (gestureRef.current.startedOnButton && escapeCountRef.current === 0) {
        fleeIfNear(e.clientX, e.clientY, true)
        gestureRef.current.fledThisGesture = true
        suppressClickRef.current = true
        return
      }

      if (!gestureRef.current.startedOnButton) {
        fleeIfNear(e.clientX, e.clientY)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || !gestureRef.current.active) return
      const g = gestureRef.current
      const moved = Math.hypot(e.clientX - g.startX, e.clientY - g.startY)
      if (moved > MOVE_THRESHOLD) g.moved = true
      fleeIfNear(e.clientX, e.clientY)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      if (arena.hasPointerCapture(e.pointerId)) {
        arena.releasePointerCapture(e.pointerId)
      }

      if (!gestureRef.current.active) {
        resetGesture()
        return
      }

      const g = gestureRef.current
      const endedOnButton = isOnButton(e.clientX, e.clientY)

      if (!g.fledThisGesture && endedOnButton && escapeCountRef.current > 0) {
        finishRef.current()
      } else if (
        !g.fledThisGesture &&
        g.startedOnButton &&
        g.moved &&
        escapeCountRef.current > 0
      ) {
        finishRef.current()
      }

      resetGesture()
    }

    arena.addEventListener('pointerdown', onPointerDown)
    arena.addEventListener('pointermove', onPointerMove)
    arena.addEventListener('pointerup', onPointerUp)
    arena.addEventListener('pointercancel', onPointerUp)
    return () => {
      arena.removeEventListener('pointerdown', onPointerDown)
      arena.removeEventListener('pointermove', onPointerMove)
      arena.removeEventListener('pointerup', onPointerUp)
      arena.removeEventListener('pointercancel', onPointerUp)
    }
  }, [touchMode, disabled, caught, fleeIfNear, isOnButton])

  const finishRef = useRef(() => {})
  const finish = useCallback(
    (viaSurrender = false) => {
      if (disabled || caught) return
      setCaught(true)
      onComplete(viaSurrender)
    },
    [disabled, caught, onComplete]
  )

  useEffect(() => {
    finishRef.current = finish
  }, [finish])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (touchMode) {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
      }
      return
    }
    finish()
  }

  if (disabled) {
    return (
      <button type="button" className="escape-btn done" disabled>
        ✓ 已完成
      </button>
    )
  }

  return (
    <div
      className={`escape-arena ${glitch ? 'escape-arena--glitch' : ''} ${touchMode ? 'escape-arena--mobile' : ''}`}
      ref={arenaRef}
      style={{ height: arenaHeight }}
    >
      {taunt && <div className="escape-taunt">{taunt}</div>}
      {escapeCount > 0 && (
        <div className="escape-counter">已逃跑 {escapeCount} 次</div>
      )}
      {escapeCount >= surrenderAt && (
        <button type="button" className="escape-surrender" onClick={() => finish(true)}>
          算了，我认命
        </button>
      )}
      <button
        ref={btnRef}
        type="button"
        className={`escape-btn ${caught ? 'caught' : ''}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onClick={handleClick}
        aria-label="完成打卡"
      >
        ✓ 完成打卡
      </button>
    </div>
  )
}
