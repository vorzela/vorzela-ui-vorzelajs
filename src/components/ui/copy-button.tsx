import { Show } from '@vorzelajs/dom'

import { useCopyToClipboard } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { VisuallyHidden } from '../primitives/visually-hidden.tsx'
import { Button } from './button.tsx'
import type { ButtonSize, ButtonVariant } from './button.tsx'
import { Check, Copy } from './icons.tsx'
import styles from './copy-button.module.scss'

export interface CopyButtonProps {
  value: string
  label?: string
  copiedLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Copies a value on a user gesture and announces the result. */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'outline',
  size = 'sm',
  className,
}: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard()
  const copied = (): boolean => state() === 'copied'

  return (
    <span className={cx(styles.root, className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => void copy(value)}
      >
        <Show
          when={copied}
          fallback={
            <>
              <Copy aria-hidden />
              {label}
            </>
          }
        >
          <Check className={styles.successIcon} aria-hidden />
          {copiedLabel}
        </Show>
      </Button>
      <VisuallyHidden role="status" aria-live="polite">
        {() =>
          copied()
            ? 'Copied to clipboard'
            : state() === 'error'
              ? 'Copy failed'
              : ''
        }
      </VisuallyHidden>
    </span>
  )
}
