import { signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'

import { accessorOf, useId } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { X } from './icons.tsx'
import styles from './tag-input.module.scss'

export interface TagInputProps {
  value?: string[] | (() => string[])
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  label?: string
  placeholder?: string
  maxTags?: number
  disabled?: boolean
  className?: string
  id?: string
}

export function TagInput({
  value: valueProp,
  defaultValue = [],
  onChange,
  label = 'Tags',
  placeholder = 'Add a tag…',
  maxTags = 12,
  disabled = false,
  className,
  id,
}: TagInputProps) {
  const [uncontrolled, setUncontrolled] = signal<string[]>(defaultValue)
  const controlled =
    valueProp === undefined ? null : accessorOf<string[]>(valueProp)
  const tags = (): string[] => (controlled ? controlled() : uncontrolled())

  const setTags = (next: string[]): void => {
    if (!controlled) setUncontrolled(next)
    onChange?.(next)
  }

  const [draft, setDraft] = signal('')
  const inputId = id ?? useId('tag-input')
  const atLimit = (): boolean => tags().length >= maxTags

  const add = (raw: string): void => {
    const next = raw.trim().replace(/,$/, '')
    if (!next) return
    const current = tags()
    if (current.length >= maxTags) return
    if (current.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft('')
      return
    }
    setTags([...current, next])
    setDraft('')
  }

  const remove = (index: number): void => {
    setTags(tags().filter((_, i) => i !== index))
  }

  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>

      <div className={cx(styles.shell, disabled && styles.disabled)}>
        <For each={tags} key={(tag, index) => `${tag}-${index}`}>
          {(tag, index) => (
            <span className={styles.chip}>
              {tag}
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label={`Remove ${tag}`}
                className={styles.remove}
              >
                <X aria-hidden />
              </button>
            </span>
          )}
        </For>

        <input
          id={inputId}
          value={() => draft()}
          onChange={(event) =>
            setDraft((event.target as HTMLInputElement).value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              add(draft())
            } else if (event.key === 'Backspace' && !draft() && tags().length) {
              remove(tags().length - 1)
            }
          }}
          onBlur={() => add(draft())}
          disabled={() => disabled || atLimit()}
          placeholder={() =>
            atLimit() ? 'Tag limit reached' : placeholder
          }
          aria-describedby={`${inputId}-count`}
          className={styles.control}
        />
      </div>

      <p id={`${inputId}-count`} className={styles.count}>
        {() => `${tags().length} of ${maxTags} tags`}
      </p>
    </div>
  )
}
