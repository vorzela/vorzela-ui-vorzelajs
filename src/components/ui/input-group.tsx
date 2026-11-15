import { cx } from '../../lib/cx.ts'
import type { HTMLAttributes, InputHTMLAttributes } from '../../types.ts'
import { forwardRef } from '../../types.ts'
import { BareInput } from './input.tsx'
import styles from './input-group.module.scss'

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack segments vertically instead of a single connected row. */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Connected control group — share one border / focus ring across addons and
 * inputs.
 */
export function InputGroup({
  className,
  orientation = 'horizontal',
  ...props
}: InputGroupProps) {
  return (
    <div
      role="group"
      data-orientation={orientation}
      className={cx(
        styles.group,
        orientation === 'vertical' && styles.vertical,
        className,
      )}
      {...props}
    />
  )
}

export interface InputGroupAddonProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end'
}

export function InputGroupAddon({
  className,
  align = 'start',
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      data-slot="addon"
      data-align={align}
      className={cx(styles.addon, className)}
      {...props}
    />
  )
}

export function InputGroupText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx(styles.text, className)} {...props} />
}

export const InputGroupInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function InputGroupInput({ className, ...props }, ref) {
  return (
    <span className={styles.inputWrap}>
      <BareInput ref={ref} className={cx(styles.control, className)} {...props} />
    </span>
  )
})
