import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'
import { useReducedMotion } from '../hooks/index.ts'
import { easeOutCubic } from './chart-utils.ts'

type MaybeAccessor<T> = T | Accessor<T>

function accessorOf<T>(value: MaybeAccessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value
}

/**
 * Animates 0 → 1 on mount and whenever `resetKey` changes. Reads through an
 * accessor so chart attributes can bind directly. The RAF and fallback timer
 * are always cancelled on cleanup or reset.
 */
export function useAnimatedProgress({
  duration = 600,
  enabled = true,
  resetKey = '',
}: {
  duration?: number
  enabled?: MaybeAccessor<boolean>
  resetKey?: MaybeAccessor<string>
}): Accessor<number> {
  const reduced = useReducedMotion()
  const [progress, setProgress] = signal(0)
  const readEnabled = accessorOf(enabled)
  const readResetKey = accessorOf(resetKey)

  effect(() => {
    const active = readEnabled() && !reduced()
    // Read the key so a changed key restarts the animation.
    readResetKey()

    if (!active) {
      setProgress(1)
      return
    }

    if (
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      setProgress(1)
      return
    }

    setProgress(0)
    let frame = 0
    let start = 0
    let finished = false

    const tick = (now: number) => {
      if (!start) start = now
      const next = Math.min(1, (now - start) / duration)
      setProgress(easeOutCubic(next))
      if (next < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        finished = true
      }
    }
    frame = requestAnimationFrame(tick)

    // Embedded browsers and background tabs can throttle RAF indefinitely.
    // Guarantee the chart settles on its real values regardless.
    const fallback = window.setTimeout(() => {
      if (!finished) {
        finished = true
        setProgress(1)
      }
    }, duration + 120)

    onCleanup(() => {
      cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    })
  })

  return progress
}
