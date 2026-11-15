/**
 * components/ui/drawer.tsx
 *
 * Slide-over drawer — focus-trapped, scroll-lock safe.
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import { lockBodyScroll, trapFocus } from '../../lib/overlay.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { X } from './icons.tsx'
import styles from './drawer.module.scss'

export type DrawerSide = 'left' | 'right'

export interface DrawerProps {
  open: boolean | (() => boolean)
  onClose: () => void
  title?: string
  'aria-label'?: string
  hideClose?: boolean
  /** Slide-in edge. Default: left. */
  side?: DrawerSide
  className?: string
  children?: ReactNode
}

export function Drawer({
  open,
  onClose,
  title,
  'aria-label': ariaLabel,
  hideClose,
  side = 'left',
  className,
  children,
}: DrawerProps) {
  const titleId = useId('drawer-title')
  const [panel, setPanel] = signal<HTMLDivElement | null>(null)
  const isOpen = accessorOf(open)

  effect(() => {
    const node = panel()
    if (!isOpen() || !node || typeof document === 'undefined') return
    const unlock = lockBodyScroll()
    const releaseTrap = trapFocus(node, () => onClose())
    onCleanup(() => {
      releaseTrap()
      unlock()
    })
  })

  const fromLeft = side === 'left'

  return (
    <Show when={isOpen}>
      {() => {
        const content = (
          <Portal>
            <div
              className={styles.overlay}
              aria-hidden="true"
              onClick={() => onClose()}
            />

            <div
              ref={(element) => setPanel(element as HTMLDivElement)}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-label={!title ? (ariaLabel ?? 'Drawer') : undefined}
              tabIndex={-1}
              className={cx(
                styles.panel,
                fromLeft ? styles.sideLeft : styles.sideRight,
                className,
              )}
            >
              <div className={styles.header}>
                {title ? (
                  <h2 id={titleId} className={styles.title}>
                    {title}
                  </h2>
                ) : null}

                {hideClose ? null : (
                  <button
                    type="button"
                    className={styles.close}
                    onClick={() => onClose()}
                    aria-label="Close drawer"
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className={styles.body}>{children}</div>
            </div>
          </Portal>
        )

        onCleanup(() => setPanel(null))
        return content
      }}
    </Show>
  )
}
