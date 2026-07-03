import { useEffect, useState, type CSSProperties } from 'react'

const COLORS = ['#00f5d4', '#ff006e', '#ffbe0b', '#00f5a0', '#e8e8f0']

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  dx: number
  dy: number
}

interface Props {
  /** 每次递增触发一次爆发 */
  burst: number
  origin?: 'chat' | 'center'
}

export function ConfettiBurst({ burst, origin = 'chat' }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (burst <= 0) return

    const anchor =
      origin === 'chat'
        ? document.querySelector('.chat-stage')?.getBoundingClientRect()
        : null

    const cx = anchor
      ? anchor.left + anchor.width / 2
      : window.innerWidth / 2
    const cy = anchor
      ? anchor.top + anchor.height * 0.45
      : window.innerHeight / 2

    const next: Particle[] = Array.from({ length: 36 }, (_, i) => ({
      id: burst * 100 + i,
      x: cx,
      y: cy,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.8,
      dx: (Math.random() - 0.5) * 280,
      dy: -80 - Math.random() * 220,
    }))

    setParticles(next)
    const timer = setTimeout(() => setParticles([]), 1400)
    return () => clearTimeout(timer)
  }, [burst, origin])

  if (particles.length === 0) return null

  return (
    <div className="confetti-layer" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: p.x,
              top: p.y,
              background: p.color,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rotation}deg`,
              '--scale': p.scale,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
