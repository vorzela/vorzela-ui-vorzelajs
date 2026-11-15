import { effect, onCleanup, signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import { lockBodyScroll, trapFocus } from '../../lib/overlay.ts'
import type { ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { X } from './icons.tsx'
import styles from './modal.module.scss'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZE: Record<ModalSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  full: styles.sizeFull,
}

export interface ModalProps {
  open: boolean | (() => boolean)
  onClose: () => void
  title?: string
  'aria-label'?: string
  size?: ModalSize
  hideClose?: boolean
  className?: string
  children?: ReactNode
  footer?: ReactNode
}

/**
 * Centred dialog with a focus trap and body scroll lock.
 *
 * `open` may be a signal accessor, so a parent can toggle the dialog without
 * re-running this component.
 */
export function Modal({
  open,
  onClose,
  title,
  'aria-label': ariaLabel,
  size = 'md',
  hideClose,
  className,
  children,
  footer,
}: ModalProps) {
  const titleId = useId('modal')
  const [panel, setPanel] = signal<HTMLDivElement | null>(null)
  const isOpen = accessorOf(open)

  effect(() => {
    const node = panel()
    if (!isOpen() || !node) return
    const unlock = lockBodyScroll()
    const releaseTrap = trapFocus(node, () => onClose())
    onCleanup(() => {
      releaseTrap()
      unlock()
    })
  })

  return (
    <Show when={isOpen}>
      {() => (
        <Portal>
          <div className={styles.root}>
            <div
              className={styles.overlay}
              aria-hidden="true"
              onClick={() => onClose()}
            />

            <div
              ref={(node) => setPanel(node as HTMLDivElement)}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-label={!title ? (ariaLabel ?? 'Dialog') : undefined}
              tabIndex={-1}
              className={cx(styles.panel, SIZE[size], className)}
              onClick={(event) => event.stopPropagation()}
            >
              {title || !hideClose ? (
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
                      aria-label="Close"
                    >
                      <X aria-hidden />
                    </button>
                  )}
                </div>
              ) : null}

              <div className={styles.body}>{children}</div>

              {footer ? <div className={styles.footer}>{footer}</div> : null}
            </div>
          </div>
        </Portal>
      )}
    </Show>
  )
}
