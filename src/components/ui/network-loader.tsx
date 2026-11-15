/**
 * Top-of-viewport progress bar for network activity.
 *
 * Two ways to drive it:
 *
 * 1. Automatically: `<NetworkLoader auto />` patches `window.fetch` while it
 *    is mounted and counts in-flight requests.
 * 2. Manually: `useNetworkLoader()` then `loader.start()` / `loader.done()` /
 *    `loader.error()` around any async work.
 *
 * The bar is indeterminate on purpose: it trickles toward 90% while work is
 * pending and snaps to 100% when the last request settles.
 */
import { effect, onCleanup, signal, untrack } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { useReducedMotion } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { CSSProperties } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { Spinner } from './spinner.tsx'
import styles from './network-loader.module.scss'

let pending = 0
let failures = 0
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

/** Subscribe to in-flight changes (used by `NetworkLoader`). */
export function subscribeNetworkLoader(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Snapshot for the loader component. */
export function getPendingNetworkRequests(): number {
  return pending
}

/** Register the start of a request. Pair every call with done/error. */
export function startNetworkLoader(): void {
  pending += 1
  emit()
}

/** Register a successful request. */
export function finishNetworkLoader(): void {
  pending = Math.max(0, pending - 1)
  emit()
}

/** Register a failed request — the bar completes in the destructive colour. */
export function failNetworkLoader(): void {
  pending = Math.max(0, pending - 1)
  failures += 1
  emit()
}

/** Forget everything in flight (e.g. on logout or route reset). */
export function resetNetworkLoader(): void {
  pending = 0
  failures = 0
  emit()
}

/** How many requests are currently in flight. */
export function pendingNetworkRequests(): number {
  return pending
}

/** Read-and-reset the failure flag when the bar completes. */
export function consumeNetworkLoaderFailure(): boolean {
  const failed = failures > 0
  failures = 0
  return failed
}

/** Imperative controls for any async work. */
export function useNetworkLoader(): {
  start: typeof startNetworkLoader
  done: typeof finishNetworkLoader
  error: typeof failNetworkLoader
  reset: typeof resetNetworkLoader
  readonly pending: number
} {
  return {
    start: startNetworkLoader,
    done: finishNetworkLoader,
    error: failNetworkLoader,
    reset: resetNetworkLoader,
    get pending() {
      return pendingNetworkRequests()
    },
  }
}

let patchDepth = 0
let originalFetch: typeof window.fetch | undefined

/** Patch `window.fetch` once, counting every request in flight. */
function patchFetch(): void {
  if (typeof window === 'undefined' || patchDepth++ > 0) return
  if (!window.fetch) {
    patchDepth = 0
    return
  }
  originalFetch = window.fetch
  window.fetch = async (...args: Parameters<typeof window.fetch>) => {
    startNetworkLoader()
    try {
      const response = await originalFetch!.apply(window, args)
      if (response.ok) finishNetworkLoader()
      else failNetworkLoader()
      return response
    } catch (error) {
      failNetworkLoader()
      throw error
    }
  }
}

/** Restore the original fetch when the last auto loader unmounts. */
function unpatchFetch(): void {
  if (typeof window === 'undefined') return
  patchDepth = Math.max(0, patchDepth - 1)
  if (patchDepth === 0 && originalFetch) {
    window.fetch = originalFetch
    originalFetch = undefined
  }
}

export type NetworkLoaderProps = {
  /** Patch `window.fetch` while mounted. */
  auto?: boolean
  /** Wait this long before showing, so fast requests never flash the bar. */
  delay?: number
  /** Keep the bar on screen at least this long once shown. */
  minimum?: number
  /** Interval between trickle steps, in ms. */
  speed?: number
  /** Bar colour. Defaults to the primary token. */
  color?: string
  /** Colour used when a tracked request failed. */
  errorColor?: string
  /** Bar thickness in px. */
  height?: number
  /** Stacking order. */
  zIndex?: number
  /** Pin the bar to the top or bottom edge. */
  position?: 'top' | 'bottom'
  /** Show a small spinner at the trailing edge. */
  showSpinner?: boolean
  /** Soft glow under the bar. */
  glow?: boolean
  /** Accessible name. */
  label?: string
  className?: string
  /** Class names for the coloured bar itself. */
  barClassName?: string
}

export function NetworkLoader({
  auto = false,
  delay = 150,
  minimum = 320,
  speed = 220,
  color,
  errorColor,
  height = 3,
  zIndex = 9999,
  position = 'top',
  showSpinner = false,
  glow = false,
  label = 'Loading',
  className,
  barClassName,
}: NetworkLoaderProps) {
  const reduce = useReducedMotion()
  const [pendingCount, setPendingCount] = signal(getPendingNetworkRequests())

  const [visible, setVisible] = signal(false)
  const [progress, setProgress] = signal(0)
  const [errored, setErrored] = signal(false)

  let visibleRef = false
  let shownAt = 0
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  let trickleTimer: ReturnType<typeof setInterval> | null = null

  const clearTrickle = (): void => {
    if (trickleTimer) {
      clearInterval(trickleTimer)
      trickleTimer = null
    }
  }

  const clearShow = (): void => {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  const clearHide = (): void => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const show = (): void => {
    clearHide()
    visibleRef = true
    shownAt = Date.now()
    setErrored(false)
    setProgress(8)
    setVisible(true)
    if (untrack(reduce)) return
    clearTrickle()
    trickleTimer = setInterval(() => {
      setProgress((value) => {
        if (value >= 90) return value
        // Ease toward 90% without ever arriving.
        return Math.min(90, value + Math.max(0.6, (90 - value) * 0.12))
      })
    }, speed)
    trickleTimer.unref?.()
  }

  const complete = (hasError: boolean): void => {
    clearShow()
    clearTrickle()
    setErrored(hasError)
    setProgress(100)
    const elapsed = Date.now() - shownAt
    const wait = Math.max(untrack(reduce) ? 60 : 200, minimum - elapsed)
    clearHide()
    hideTimer = setTimeout(() => {
      hideTimer = null
      visibleRef = false
      setVisible(false)
      setProgress(0)
      setErrored(false)
    }, wait)
    hideTimer.unref?.()
  }

  effect(() => {
    setPendingCount(getPendingNetworkRequests())
    const unsubscribe = subscribeNetworkLoader(() => {
      setPendingCount(getPendingNetworkRequests())
    })
    onCleanup(unsubscribe)
  })

  // React to the in-flight count: start on the first request, finish on the last.
  effect(() => {
    if (pendingCount() > 0) {
      if (visibleRef || showTimer) return
      showTimer = setTimeout(() => {
        showTimer = null
        if (getPendingNetworkRequests() > 0) show()
      }, delay)
      showTimer.unref?.()
      return
    }
    // Nothing left in flight.
    if (showTimer) {
      // Finished before the bar ever appeared — stay silent.
      clearShow()
      return
    }
    if (!visibleRef) return
    complete(consumeNetworkLoaderFailure())
  })

  effect(() => {
    if (!auto) return
    patchFetch()
    onCleanup(unpatchFetch)
  })

  onCleanup(() => {
    clearShow()
    clearHide()
    clearTrickle()
  })

  const barColor = (): string =>
    errored()
      ? (errorColor ?? 'hsl(var(--destructive))')
      : (color ?? 'hsl(var(--primary))')

  return (
    <Portal>
      <div
        className={cx(
          styles.root,
          position === 'top' ? styles.top : styles.bottom,
          className,
        )}
        style={{ zIndex }}
      >
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={() => (visible() ? Math.round(progress()) : undefined)}
          aria-valuetext={() => (visible() ? `${Math.round(progress())}%` : undefined)}
          aria-hidden={() => (visible() ? undefined : true)}
          className={styles.track}
          style={{ height: `${height}px` }}
        >
          <div
            className={cx(styles.bar, barClassName)}
            style={(): CSSProperties => {
              const currentColor = barColor()
              return {
                width: `${progress()}%`,
                background: currentColor,
                opacity: visible() ? 1 : 0,
                ...(glow ? { boxShadow: `0 0 10px ${currentColor}` } : {}),
              }
            }}
          />
          <Show when={() => showSpinner}>
            <span
              aria-hidden
              className={() =>
                cx(
                  styles.spinner,
                  position === 'top' ? styles.spinnerTop : styles.spinnerBottom,
                  visible() ? styles.spinnerVisible : styles.spinnerHidden,
                )
              }
            >
              <Spinner size="sm" label={label} className={styles.spinnerRing} />
            </span>
          </Show>
        </div>
        <span className={styles.srOnly} role="status">
          {() => (visible() ? label : '')}
        </span>
      </div>
    </Portal>
  )
}
