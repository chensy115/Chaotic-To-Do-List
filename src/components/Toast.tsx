import { useEffect, useState } from 'react'

interface Props {
  message: string | null
  onDone: () => void
}

export function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2800)
    return () => clearTimeout(timer)
  }, [message, onDone])

  if (!message) return null

  return (
    <div className={`toast ${visible ? 'toast-show' : ''}`} role="status">
      {message}
    </div>
  )
}
