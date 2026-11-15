import { effect, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { DismissableLayer } from '../primitives/dismissable-layer.tsx'
import { ChevronDown, ChevronRight } from './icons.tsx'
import styles from './cascader.module.scss'

export type CascaderOption = {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

export interface CascaderProps {
  options: CascaderOption[] | (() => CascaderOption[])
  value?: string[] | (() => string[])
  defaultValue?: string[]
  onChange?: (value: string[], selected: CascaderOption[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  separator?: string
}

function findOption(
  options: CascaderOption[],
  value: string,
): CascaderOption | undefined {
  return options.find((option) => option.value === value)
}

function resolve(
  options: CascaderOption[],
  path: string[],
): CascaderOption[] {
  const result: CascaderOption[] = []
  let current = options
  for (const value of path) {
    const option = findOption(current, value)
    if (!option) break
    result.push(option)
    current = option.children ?? []
  }
  return result
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Multi-level select for dependent options. */
export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
  label,
  placeholder = 'Select an option',
  disabled = false,
  className,
  id,
  separator = ' / ',
}: CascaderProps) {
  const optionsValue = accessorOf(options)
  const valueAccessor = value === undefined ? null : accessorOf(value)

  const [open, setOpen] = signal(false)
  const [internal, setInternal] = signal<string[]>(defaultValue)
  const [path, setPath] = signal<string[]>(
    valueAccessor ? valueAccessor() : defaultValue,
  )

  const selected = (): string[] =>
    valueAccessor ? valueAccessor() : internal()

  effect(() => {
    if (!open()) return
    setPath(selected())
  })

  const choose = (option: CascaderOption): void => {
    if (option.disabled) return
    const nextPath = [...path(), option.value]
    setPath(nextPath)
    if (option.children?.length) return
    if (!valueAccessor) setInternal(nextPath)
    onChange?.(nextPath, resolve(optionsValue(), nextPath))
    setOpen(false)
  }

  const columns = (): CascaderOption[][] => {
    const result: CascaderOption[][] = []
    let current = optionsValue()
    for (const valuePart of path()) {
      if (!current.length) break
      result.push(current)
      const next = findOption(current, valuePart)
      current = next?.children ?? []
    }
    if (current.length) result.push(current)
    return result
  }

  const selectedOptions = (): CascaderOption[] =>
    resolve(optionsValue(), selected())

  return (
    <div className={cx(styles.root, className)}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx(styles.trigger)}
        onClick={() => setOpen(!open())}
      >
        <span
          className={() =>
            selectedOptions().length ? '' : styles.placeholder
          }
        >
          {() =>
            selectedOptions().length
              ? selectedOptions()
                  .map((option) => option.label)
                  .join(separator)
              : placeholder
          }
        </span>
        <ChevronDown
          className={reactive(() => cx(styles.chevron, open() && styles.open))}
          aria-hidden
        />
      </button>

      <Show when={open}>
        {() => (
          <DismissableLayer onDismiss={() => setOpen(false)}>
            <div
              className={styles.panel}
              role="listbox"
              aria-label={label ?? placeholder}
            >
              <For each={columns}>
                {(column, depth) => (
                  <ul className={styles.column} role="group">
                    <For each={() => column}>
                      {(option) => {
                        const active = (): boolean =>
                          path()[depth] === option.value
                        const isSelected = (): boolean =>
                          selected()[depth] === option.value &&
                          depth === selected().length - 1
                        return (
                          <li>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              disabled={option.disabled}
                              className={() =>
                                cx(
                                  styles.option,
                                  active() && styles.optionActive,
                                  isSelected() && styles.optionSelected,
                                )
                              }
                              onClick={() => choose(option)}
                            >
                              {option.label}
                              {option.children?.length ? (
                                <ChevronRight
                                  className={styles.optionArrow}
                                  aria-hidden
                                  size={13}
                                />
                              ) : null}
                            </button>
                          </li>
                        )
                      }}
                    </For>
                  </ul>
                )}
              </For>
            </div>
          </DismissableLayer>
        )}
      </Show>
    </div>
  )
}
