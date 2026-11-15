import { effect, onCleanup, signal } from '@vorzelajs/core'
import { accessorOf, useReducedMotion } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './number-ticker.module.scss'

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export interface NumberTickerProps {
  value: number | (() => number)
  from?: number
  duration?: number
  format?: (value: number) => string
  className?: string
  suffix?: string
}

export function NumberTicker({
  value,
  from = 0,
  duration = 700,
  format = (current) => Math.round(current).toLocaleString(),
  className,
  suffix,
}: NumberTickerProps) {
  const reduced = useReducedMotion()
  const valueAccessor = accessorOf(value)
  const [display, setDisplay] = signal(from)
  let previous = from

  effect(() => {
    const target = valueAccessor()
    if (
      reduced() ||
      typeof requestAnimationFrame === 'undefined' ||
      typeof performance === 'undefined'
    ) {
      previous = target
      setDisplay(target)
      return
    }

    const start = performance.now()
    const initial = previous
    let frame = 0

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration)
      const next = initial + (target - initial) * easeOutCubic(progress)
      setDisplay(next)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        previous = target
      }
    }

    frame = requestAnimationFrame(tick)
    const fallback = setTimeout(() => {
      setDisplay(target)
      previous = target
    }, duration + 120)
    fallback.unref?.()

    onCleanup(() => {
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
    })
  })

  return (
    <span className={cx(styles.root, className)}>
      <span aria-hidden>
        {() => `${format(display())}${suffix ?? ''}`}
      </span>
      <span className={styles.srOnly}>
        {() => `${format(valueAccessor())}${suffix ?? ''}`}
      </span>
    </span>
  )
}
