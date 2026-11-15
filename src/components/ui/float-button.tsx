import { effect, onCleanup, signal } from '@vorzelajs/core'
import { cx } from '../../lib/cx.ts'
import { ArrowUp } from './icons.tsx'
import styles from './float-button.module.scss'
import type { ReactNode } from '../../types.ts'

export type FloatButtonPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'

const POSITION = {
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
} as const

export type FloatButtonSize = 'sm' | 'md' | 'lg'

export interface FloatButtonProps {
  icon?: ReactNode
  label?: string
  description?: string
  badge?: string | number
  position?: FloatButtonPosition
  size?: FloatButtonSize
  shape?: 'circle' | 'square'
  /** Render inside a positioned parent instead of the viewport. */
  contained?: boolean
  /** Scroll to the top when clicked. */
  backToTop?: boolean
  /** Show after this scroll offset. Defaults to 0 (always visible). */
  visibleAfter?: number
  disabled?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Floating action button, optionally doubling as a back-to-top control. */
export function FloatButton({
  icon,
  label,
  description,
  badge,
  position = 'bottom-right',
  size = 'md',
  shape = 'circle',
  contained = false,
  backToTop = false,
  visibleAfter = 0,
  disabled = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: FloatButtonProps) {
  const [visible, setVisible] = signal(visibleAfter <= 0)

  effect(() => {
    if (visibleAfter <= 0) {
      setVisible(true)
      return
    }
    if (typeof window === 'undefined') return

    const update = (): void => {
      setVisible(window.scrollY >= visibleAfter)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    onCleanup(() => window.removeEventListener('scroll', update))
  })

  const content = icon ?? (backToTop ? <ArrowUp aria-hidden size={18} /> : null)
  const name = ariaLabel ?? label ?? (backToTop ? 'Back to top' : 'Actions')

  return (
    <div
      className={reactive(() =>
        cx(
          styles.root,
          POSITION[position],
          contained && styles.contained,
          !visible() && styles.hidden,
          className,
        ),
      )}
    >
      {description ? <p className={styles.description}>{description}</p> : null}
      <button
        type="button"
        className={cx(
          styles.button,
          size === 'sm' && styles.sm,
          size === 'lg' && styles.lg,
          shape === 'square' && styles.square,
          label && styles.extended,
        )}
        aria-label={name}
        disabled={disabled}
        onClick={() => {
          if (backToTop) window.scrollTo({ top: 0, behavior: 'smooth' })
          onClick?.()
        }}
      >
        {content}
        {label ? <span className={styles.label}>{label}</span> : null}
        {badge != null ? <span className={styles.badge}>{badge}</span> : null}
      </button>
    </div>
  )
}
