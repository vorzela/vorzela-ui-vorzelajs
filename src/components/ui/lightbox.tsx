import { effect, onCleanup } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Portal } from '../primitives/portal.tsx'
import { X } from './icons.tsx'
import styles from './lightbox.module.scss'

export interface LightboxProps {
  open: boolean | (() => boolean)
  src: string
  alt?: string
  onClose: () => void
  caption?: string
  className?: string
}

function LightboxPanel(props: Omit<LightboxProps, 'open'>) {
  effect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') props.onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    onCleanup(() => document.removeEventListener('keydown', onKeyDown))
  })

  return (
    <Portal>
      <div
        className={cx(styles.root, props.className)}
        role="dialog"
        aria-modal="true"
        aria-label={props.alt || 'Image preview'}
        onClick={() => props.onClose()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={(event) => {
            event.stopPropagation()
            props.onClose()
          }}
          aria-label="Close"
        >
          <X aria-hidden />
        </button>
        <figure className={styles.figure} onClick={(event) => event.stopPropagation()}>
          <img className={styles.image} src={props.src} alt={props.alt ?? ''} />
          {props.caption ? <figcaption className={styles.caption}>{props.caption}</figcaption> : null}
        </figure>
      </div>
    </Portal>
  )
}

/** Full-screen image viewer. */
export function Lightbox({ open, ...props }: LightboxProps) {
  const isOpen = accessorOf(open)
  return (
    <Show when={isOpen}>
      {() => <LightboxPanel {...props} />}
    </Show>
  )
}
