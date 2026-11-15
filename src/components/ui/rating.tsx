import { signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Star } from './icons.tsx'
import styles from './rating.module.scss'

/**
 * Star rating.
 *
 * `value` is a plain number, so `2.5` renders as two full stars plus a half.
 * Pass `step={0.5}` to let people *choose* halves; the default `1` keeps
 * whole-star input.
 *
 * Semantics: one ARIA slider (a single tab stop) rather than a radiogroup,
 * because a fractional value cannot be expressed by a set of `aria-checked`
 * radios.
 */
export interface RatingProps {
  value: number | (() => number)
  onChange?: (value: number) => void
  max?: number
  /** Smallest increment. Use `0.5` for half stars. */
  step?: 1 | 0.5
  readOnly?: boolean
  label?: string
  showValue?: boolean
  className?: string
}

export function Rating({
  value: valueProp,
  onChange,
  max = 5,
  step = 1,
  readOnly = false,
  label = 'Rating',
  showValue = false,
  className,
}: RatingProps) {
  const value = accessorOf<number>(valueProp)
  const [hover, setHover] = signal<number | null>(null)
  const stripRef: { current: HTMLDivElement | null } = { current: null }
  const shown = (): number => hover() ?? value()

  const interactive = !readOnly && Boolean(onChange)

  const clamp = (next: number): number => Math.min(max, Math.max(0, next))
  const snap = (next: number): number => Math.round(next / step) * step

  /** Map a pointer position to the value under it. */
  const valueFromPointer = (clientX: number): number => {
    const element = stripRef.current
    if (!element) return value()
    const rect = element.getBoundingClientRect()
    if (rect.width === 0) return value()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = ratio * max
    // Left/right half of a star selects the lower/higher value.
    return step === 1
      ? Math.min(max, Math.floor(raw) + 1)
      : Math.min(max, Math.floor(raw / step) * step + step)
  }

  const select = (next: number): void => {
    if (!interactive) return
    const bounded = clamp(snap(next))
    if (bounded !== value()) onChange?.(bounded)
  }

  return (
    <div className={cx(styles.root, className)}>
      <div
        ref={stripRef}
        role="slider"
        tabIndex={interactive ? 0 : -1}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={() => value()}
        aria-valuetext={() => `${value()} out of ${max}`}
        aria-readonly={readOnly ? 'true' : undefined}
        aria-orientation="horizontal"
        onPointerMove={(event: globalThis.PointerEvent) => {
          if (interactive) setHover(valueFromPointer(event.clientX))
        }}
        onPointerLeave={() => {
          if (interactive) setHover(null)
        }}
        onClick={(event) => {
          if (interactive) select(valueFromPointer(event.clientX))
        }}
        onKeyDown={(event) => {
          if (!interactive) return
          let next: number
          switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp':
              next = value() + step
              break
            case 'ArrowLeft':
            case 'ArrowDown':
              next = value() - step
              break
            case 'PageUp':
              next = value() + 1
              break
            case 'PageDown':
              next = value() - 1
              break
            case 'Home':
              next = 0
              break
            case 'End':
              next = max
              break
            default:
              return
          }
          event.preventDefault()
          setHover(null)
          select(next)
        }}
        className={cx(styles.strip, interactive && styles.interactive)}
      >
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={styles.starWrap} aria-hidden>
            <Star className={styles.starOutline} strokeWidth={1.5} />
            <span
              className={styles.starFill}
              style={() => ({
                width: `${Math.min(1, Math.max(0, shown() - index)) * 100}%`,
              })}
            >
              <Star className={styles.starFilled} strokeWidth={1.5} />
            </span>
          </span>
        ))}
      </div>
      {showValue ? (
        <span className={styles.value}>
          {() => `${value().toFixed(1)} / ${max}`}
        </span>
      ) : null}
    </div>
  )
}
