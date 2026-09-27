import { useEffect, useRef, useState } from 'react'

/** Countdown timer. Calls onExpire once when it reaches zero. */
export function useCountdown(seconds: number | undefined, running: boolean, onExpire?: () => void) {
  const [left, setLeft] = useState(seconds ?? 0)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    setLeft(seconds ?? 0)
  }, [seconds])

  useEffect(() => {
    if (!running || seconds === undefined) return
    const started = Date.now()
    const initial = seconds
    setLeft(seconds)
    const id = setInterval(() => {
      const next = Math.max(0, initial - Math.floor((Date.now() - started) / 1000))
      setLeft(next)
      if (next === 0) {
        clearInterval(id)
        expireRef.current?.()
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, seconds])

  return left
}

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
