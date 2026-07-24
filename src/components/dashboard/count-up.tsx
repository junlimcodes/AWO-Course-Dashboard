'use client'

import { useState, useEffect } from 'react'

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function CountUp({ to, className }: { to: number; className?: string }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (to === 0) return
    let raf: number
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 900, 1)
        setN(Math.round(easeOut(p) * to))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, 200)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [to])

  return <span className={className}>{n}</span>
}
