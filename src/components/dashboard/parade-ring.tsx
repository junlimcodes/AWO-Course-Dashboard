'use client'

import { useState, useEffect } from 'react'

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function useCountUp(target: number, delay = 300) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let raf: number
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1000, 1)
        setN(Math.round(easeOut(p) * target))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [target, delay])
  return n
}

type Props = {
  inCamp: number
  outOfCamp: number
  medical: number
  notUpdated: number
  total: number
  pct: number
}

export function ParadeRing({ inCamp, outOfCamp, medical, notUpdated, total, pct }: Props) {
  const [mounted, setMounted] = useState(false)
  const count = useCountUp(inCamp, 350)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 250)
    return () => clearTimeout(t)
  }, [])

  const r = 64
  const size = 164
  const cx = size / 2
  const circ = 2 * Math.PI * r

  const rawSegs = [
    { n: inCamp,     color: 'oklch(0.74 0.18 168)', label: 'ic' },
    { n: outOfCamp,  color: 'oklch(0.62 0.17 215)', label: 'ooc' },
    { n: medical,    color: 'oklch(0.78 0.17 75)',  label: 'med' },
    { n: notUpdated, color: 'oklch(0.58 0.22 15)',  label: 'nu' },
  ].filter(s => s.n > 0)

  let cum = 0
  const segs = rawSegs.map(s => {
    const len = total > 0 ? (s.n / total) * circ : 0
    const off = cum
    cum += len
    return { ...s, len, off }
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="13"
          />
          {/* Colour segments */}
          {segs.map((s, i) => (
            <circle
              key={s.label}
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={mounted ? `${s.len} ${circ - s.len}` : `0 ${circ}`}
              strokeDashoffset={-s.off}
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{
                transition: `stroke-dasharray 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`,
              }}
            />
          ))}
        </svg>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold tabular-nums leading-none text-white">{count}</span>
          <span className="text-xs text-white/40 mt-1 tabular-nums">/ {total}</span>
        </div>
      </div>

      <p className="text-xs text-white/35 tabular-nums">{pct}% accounted for</p>
    </div>
  )
}
