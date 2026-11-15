import { computed, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import styles from './mentions.module.scss'

export type MentionSuggestion = {
  id: string
  label: string
  description?: string
  avatar?: string
}

export interface MentionsProps {
  suggestions: MentionSuggestion[] | (() => MentionSuggestion[])
  value?: string | (() => string)
  defaultValue?: string
  onChange?: (value: string) => void
  onSelect?: (suggestion: MentionSuggestion) => void
  label?: string
  placeholder?: string
  hint?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  trigger?: string
  className?: string
  id?: string
  name?: string
  'aria-label'?: string
}

type MentionQuery = {
  start: number
  end: number
  query: string
}

/** Textarea with inline mention suggestions. */
export function Mentions({
  suggestions,
  value,
  defaultValue = '',
  onChange,
  onSelect,
  label,
  placeholder = 'Write a comment…',
  hint,
  rows = 4,
  maxLength,
  disabled = false,
  trigger = '@',
  className,
  id,
  name,
  'aria-label': ariaLabel,
}: MentionsProps) {
  const inputId = id ?? useId('mentions')
  const listId = `${inputId}-suggestions`
  const ref: { current: HTMLTextAreaElement | null } = { current: null }
  const suggestionsValue = accessorOf(suggestions)
  const valueAccessor = value === undefined ? null : accessorOf(value)

  const [internal, setInternal] = signal(defaultValue)
  const [query, setQuery] = signal<MentionQuery | null>(null)
  const [active, setActive] = signal(0)
  let blurTimer: ReturnType<typeof setTimeout> | undefined

  const text = (): string =>
    valueAccessor ? valueAccessor() : internal()

  const matches = computed(() => {
    const current = query()
    if (!current) return []
    const fragment = current.query.toLowerCase()
    return suggestionsValue()
      .filter((item) => item.label.toLowerCase().includes(fragment))
      .slice(0, 6)
  })
  const noMatches = computed(() => matches().length === 0)
  const hasQuery = computed(() => Boolean(query()))

  const setText = (next: string): void => {
    if (!valueAccessor) setInternal(next)
    onChange?.(next)
  }

  const detect = (next: string, caret: number): MentionQuery | null => {
    const before = next.slice(0, caret)
    const start = before.lastIndexOf(trigger)
    if (start === -1) return null
    const fragment = before.slice(start + trigger.length)
    if (/[\s\n]/.test(fragment)) return null
    return { start, end: caret, query: fragment }
  }

  const handleChange = (event: Event): void => {
    const target = event.target as HTMLTextAreaElement
    const next = target.value
    setText(next)
    setQuery(detect(next, target.selectionStart ?? next.length))
    setActive(0)
  }

  const select = (suggestion: MentionSuggestion): void => {
    const current = query()
    if (!current) return
    const before = text().slice(0, current.start)
    const after = text().slice(current.end)
    const next = `${before}${trigger}${suggestion.label} ${after}`
    setText(next)
    setQuery(null)
    onSelect?.(suggestion)
    requestAnimationFrame(() => {
      const caret = before.length + trigger.length + suggestion.label.length + 1
      ref.current?.focus()
      ref.current?.setSelectionRange(caret, caret)
    })
  }

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!query() || matches().length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (current + 1) % matches().length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (current - 1 + matches().length) % matches().length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const suggestion = matches()[active()]
      if (suggestion) select(suggestion)
    } else if (event.key === 'Escape') {
      setQuery(null)
    }
  }

  onCleanup(() => {
    clearTimeout(blurTimer)
  })

  return (
    <div className={cx(styles.root, className)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div className={styles.wrap}>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          rows={rows}
          value={text}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel ?? label}
          aria-autocomplete="list"
          aria-controls={() =>
            query() && matches().length ? listId : undefined
          }
          aria-expanded={() => Boolean(query() && matches().length)}
          aria-activedescendant={() => {
            const suggestion = matches()[active()]
            return query() && suggestion
              ? `${listId}-${suggestion.id}`
              : undefined
          }}
          className={styles.textarea}
          onInput={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            clearTimeout(blurTimer)
            blurTimer = setTimeout(() => setQuery(null), 120)
            blurTimer.unref?.()
          }}
        />
        <Show when={hasQuery}>
          {() => (
            <ul id={listId} role="listbox" className={styles.panel}>
              <Show
                when={noMatches}
                fallback={
                  <For each={matches} key={(suggestion) => suggestion.id}>
                    {(suggestion, index) => (
                      <li
                        id={`${listId}-${suggestion.id}`}
                        role="option"
                        aria-selected={() => index === active()}
                        className={() =>
                          cx(
                            styles.option,
                            index === active() && styles.active,
                          )
                        }
                        onMouseDown={(event: MouseEvent) => {
                          event.preventDefault()
                          select(suggestion)
                        }}
                        onMouseEnter={() => setActive(() => index)}
                      >
                        <span className={styles.avatar} aria-hidden>
                          {suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" />
                          ) : (
                            suggestion.label.slice(0, 1)
                          )}
                        </span>
                        <span className={styles.body}>
                          <span className={styles.name}>{suggestion.label}</span>
                          {suggestion.description ? (
                            <span className={styles.description}>
                              {suggestion.description}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    )}
                  </For>
                }
              >
                <li className={styles.empty}>No matches</li>
              </Show>
            </ul>
          )}
        </Show>
      </div>
      <div className={styles.hint}>
        {hint ? <span>{hint}</span> : <span />}
        {maxLength ? (
          <span className={styles.counter}>
            {() => `${text().length}/${maxLength}`}
          </span>
        ) : null}
      </div>
    </div>
  )
}
