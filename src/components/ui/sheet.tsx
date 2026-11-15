/**
 * components/ui/sheet.tsx
 *
 * Slide-over sheet — four edges, focus-trapped, scroll-lock safe.
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
import styles from './sheet.module.scss'

export type SheetSide = 'top' | 'right' | 'bottom' | 'left'

const SIDE: Record<SheetSide, string> = {
  top: styles.sideTop,
  right: styles.sideRight,
  bottom: styles.sideBottom,
  left: styles.sideLeft,
}

export interface SheetProps {
  open: boolean | (() => boolean)
  onClose: () => void
  title?: string
  description?: string
  'aria-label'?: string
  side?: SheetSide
  hideClose?: boolean
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footer?: ReactNode
  children?: ReactNode
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  'aria-label': ariaLabel,
  side = 'right',
  hideClose,
  className,
  headerClassName,
  bodyClassName,
  footer,
  children,
}: SheetProps) {
  const titleId = useId('sheet-title')
  const descId = useId('sheet-description')
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

  const hasHeader = Boolean(title) || Boolean(description) || !hideClose

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
              aria-describedby={description ? descId : undefined}
              aria-label={!title ? (ariaLabel ?? 'Sheet') : undefined}
              tabIndex={-1}
              className={cx(styles.panel, SIDE[side], className)}
            >
              {hasHeader ? (
                <div className={cx(styles.header, headerClassName)}>
                  <div className={styles.heading}>
                    {title ? (
                      <h2 id={titleId} className={styles.title}>
                        {title}
                      </h2>
                    ) : null}

                    {description ? (
                      <p id={descId} className={styles.description}>
                        {description}
                      </p>
                    ) : null}
                  </div>

                  {hideClose ? null : (
                    <button
                      type="button"
                      className={styles.close}
                      onClick={() => onClose()}
                      aria-label="Close"
                    >
                      <X aria-hidden="true" />
                    </button>
                  )}
                </div>
              ) : null}

              <div className={cx(styles.body, bodyClassName)}>{children}</div>

              {footer ? <div className={styles.footer}>{footer}</div> : null}
            </div>
          </Portal>
        )

        onCleanup(() => setPanel(null))
        return content
      }}
    </Show>
  )
}

export { Sheet as SideSheet }
