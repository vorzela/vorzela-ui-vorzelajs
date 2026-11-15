import { signal } from '@vorzelajs/core'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './otp-input.module.scss'

export interface OtpInputProps {
  length?: number
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  label?: string
  className?: string
}

export function OtpInput({
  length = 6,
  value: valueProp,
  defaultValue = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  label = 'One-time code',
  className,
}: OtpInputProps) {
  const [uncontrolled, setUncontrolled] = signal(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<string>(valueProp)
  const code = (): string => (controlled ? controlled() : uncontrolled())

  const inputs: Array<HTMLInputElement | null> = []

  const setCode = (next: string): void => {
    if (!controlled) setUncontrolled(next)
    onChange?.(next)
  }

  const commit = (next: string): void => {
    setCode(next)
    if (next.length === length) onComplete?.(next)
  }

  const focusAt = (index: number): void => {
    const bounded = Math.max(0, Math.min(index, length - 1))
    inputs[bounded]?.focus()
    inputs[bounded]?.select()
  }

  const handleChange = (index: number, raw: string): void => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return

    const chars = code().padEnd(length, ' ').split('').slice(0, length)

    if (digits.length > 1) {
      for (let i = 0; i < digits.length && index + i < length; i += 1) {
        chars[index + i] = digits[i] as string
      }
      const next = chars.join('').replaceAll(' ', '').slice(0, length)
      commit(next)
      focusAt(Math.min(index + digits.length, length - 1))
      return
    }

    chars[index] = digits
    commit(chars.join('').replaceAll(' ', '').slice(0, length))
    if (index < length - 1) focusAt(index + 1)
  }

  const handleKeyDown = (
    index: number,
    event: globalThis.KeyboardEvent,
  ): void => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = code().split('')

      if (chars[index]) {
        chars[index] = ''
        commit(chars.join(''))
      } else if (index > 0) {
        chars[index - 1] = ''
        commit(chars.join(''))
        focusAt(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAt(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (event: globalThis.ClipboardEvent): void => {
    event.preventDefault()
    const digits = event.clipboardData?.getData('text').replace(/\D/g, '') ?? ''
    if (!digits) return
    commit(digits.slice(0, length))
    focusAt(Math.min(digits.length, length - 1))
  }

  return (
    <div role="group" aria-label={label} className={cx(styles.root, className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs[index] = node as HTMLInputElement | null
          }}
          value={() => code()[index] ?? ''}
          onChange={(event) =>
            handleChange(index, (event.target as HTMLInputElement).value)
          }
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => (event.target as HTMLInputElement).select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={styles.control}
        />
      ))}
    </div>
  )
}
