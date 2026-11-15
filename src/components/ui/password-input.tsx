import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Eye, EyeOff } from './icons.tsx'
import { Label } from './label.tsx'
import styles from './password-input.module.scss'

const STRENGTH = [
  { label: 'Too short', tone: 'destructive' },
  { label: 'Weak', tone: 'destructive' },
  { label: 'Fair', tone: 'warning' },
  { label: 'Good', tone: 'info' },
  { label: 'Strong', tone: 'success' },
] as const

type StrengthTone = (typeof STRENGTH)[number]['tone']

const TONE: Record<StrengthTone, string> = {
  destructive: styles.toneDestructive,
  warning: styles.toneWarning,
  info: styles.toneInfo,
  success: styles.toneSuccess,
}

function scorePassword(value: string): number {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(4, score)
}

export interface PasswordStrengthInputProps {
  value: string | (() => string)
  onChange: (value: string) => void
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  autoComplete?: string
  showStrength?: boolean
  className?: string
  id?: string
}

export function PasswordStrengthInput({
  value: valueProp,
  onChange,
  label = 'Password',
  hint,
  error,
  disabled = false,
  autoComplete = 'current-password',
  showStrength = true,
  className,
  id,
}: PasswordStrengthInputProps) {
  const [visible, setVisible] = signal(false)
  const generatedId = useId('password')
  const inputId = id ?? generatedId
  const strengthId = `${inputId}-strength`
  const value = accessorOf<string>(valueProp)
  const score = (): number => scorePassword(value())
  const strength = (): (typeof STRENGTH)[number] => STRENGTH[score()]

  return (
    <div className={cx(styles.root, className)}>
      <Label htmlFor={inputId}>{label}</Label>

      <div className={cx(styles.shell, error && styles.invalid)}>
        <input
          id={inputId}
          type={() => (visible() ? 'text' : 'password')}
          value={value}
          onChange={(event) =>
            onChange((event.currentTarget as HTMLInputElement).value)
          }
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [
              error ? `${inputId}-error` : null,
              hint ? `${inputId}-hint` : null,
              showStrength ? strengthId : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={styles.input}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible())}
          disabled={disabled}
          aria-label={() => (visible() ? 'Hide password' : 'Show password')}
          aria-pressed={() => (visible() ? 'true' : 'false')}
          className={styles.toggle}
        >
          <Show
            when={visible}
            fallback={<Eye aria-hidden className={styles.toggleIcon} />}
          >
            <EyeOff aria-hidden className={styles.toggleIcon} />
          </Show>
        </button>
      </div>

      <Show when={() => showStrength && Boolean(value())}>
        <div id={strengthId} aria-live="polite" className={styles.strength}>
          <div className={styles.bars} aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={() =>
                  cx(
                    styles.bar,
                    index < Math.max(1, score()) && TONE[strength().tone],
                  )
                }
              />
            ))}
          </div>
          <p className={styles.strengthText}>
            Password strength:{' '}
            <span className={styles.strengthValue}>{() => strength().label}</span>
          </p>
        </div>
      </Show>

      {hint && !error ? (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
