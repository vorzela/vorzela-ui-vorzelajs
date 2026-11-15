import { computed, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { Button } from './button.tsx'
import { ChevronLeft, ChevronRight } from './icons.tsx'
import styles from './transfer.module.scss'

export type TransferItem = {
  key: string
  label: string
  description?: string
  disabled?: boolean
}

export type TransferDirection = 'left' | 'right'

export interface TransferProps {
  dataSource: TransferItem[] | (() => TransferItem[])
  targetKeys?: string[] | (() => string[])
  defaultTargetKeys?: string[]
  onChange?: (keys: string[], direction: TransferDirection, moved: string[]) => void
  titles?: [string, string]
  searchable?: boolean
  showCount?: boolean
  disabled?: boolean
  height?: number | string
  className?: string
  'aria-label'?: string
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

/** Two-pane selection list for moving items between source and target. */
export function Transfer({
  dataSource,
  targetKeys,
  defaultTargetKeys = [],
  onChange,
  titles = ['Source', 'Selected'],
  searchable = true,
  showCount = true,
  disabled = false,
  height = 240,
  className,
  'aria-label': ariaLabel = 'Transfer list',
}: TransferProps) {
  const sourceValue = accessorOf(dataSource)
  const targetAccessor = targetKeys === undefined ? null : accessorOf(targetKeys)
  const [internalKeys, setInternalKeys] = signal<string[]>(defaultTargetKeys)
  const [leftQuery, setLeftQuery] = signal('')
  const [rightQuery, setRightQuery] = signal('')
  const [leftChecked, setLeftChecked] = signal<string[]>([])
  const [rightChecked, setRightChecked] = signal<string[]>([])

  const keys = (): string[] =>
    targetAccessor ? targetAccessor() : internalKeys()
  const keySet = computed(() => new Set(keys()))
  const source = computed(() =>
    sourceValue().filter((item) => !keySet().has(item.key)),
  )
  const target = computed(() =>
    sourceValue().filter((item) => keySet().has(item.key)),
  )

  const filter = (items: TransferItem[], query: string): TransferItem[] => {
    const value = query.trim().toLowerCase()
    if (!value) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(value) ||
        (item.description?.toLowerCase().includes(value) ?? false),
    )
  }

  const leftItems = computed(() => filter(source(), leftQuery()))
  const rightItems = computed(() => filter(target(), rightQuery()))

  const update = (
    next: string[],
    direction: TransferDirection,
    moved: string[],
  ): void => {
    if (!targetAccessor) setInternalKeys(next)
    onChange?.(next, direction, moved)
  }

  const move = (direction: TransferDirection): void => {
    const moving = direction === 'right' ? leftChecked() : rightChecked()
    if (moving.length === 0) return
    const next =
      direction === 'right'
        ? [...keys(), ...moving.filter((key) => !keySet().has(key))]
        : keys().filter((key) => !moving.includes(key))
    update(next, direction, moving)
    if (direction === 'right') setLeftChecked([])
    else setRightChecked([])
  }

  const toggle = (list: string[], key: string, checked: boolean): string[] =>
    checked ? [...list, key] : list.filter((item) => item !== key)

  const renderPane = (
    items: () => TransferItem[],
    checked: () => string[],
    setChecked: (keys: string[]) => void,
    query: () => string,
    setQuery: (query: string) => void,
    title: string,
  ) => (
    <div className={styles.pane}>
      <div className={styles.paneHead}>
        <p className={styles.title}>{title}</p>
        {showCount ? (
          <span className={styles.count}>{() => items().length}</span>
        ) : null}
      </div>
      {searchable ? (
        <input
          type="search"
          value={query}
          placeholder={`Search ${title.toLowerCase()}…`}
          aria-label={`Search ${title}`}
          className={styles.search}
          onChange={(event) => {
            const target = event.target as HTMLInputElement
            setQuery(target.value)
          }}
          onInput={(event) => {
            const target = event.target as HTMLInputElement
            setQuery(target.value)
          }}
        />
      ) : null}
      <ul className={styles.list} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <Show
          when={() => items().length === 0}
          fallback={
            <For each={items} key={(item) => item.key}>
              {(item) => {
                const isChecked = (): boolean => checked().includes(item.key)
                return (
                  <li>
                    <label
                      className={() =>
                        cx(styles.row, item.disabled && styles.rowDisabled)
                      }
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isChecked}
                        disabled={disabled || item.disabled}
                        onChange={(event) => {
                          const target = event.target as HTMLInputElement
                          setChecked(
                            toggle(checked(), item.key, target.checked),
                          )
                        }}
                      />
                      <span className={styles.text}>
                        <span className={styles.label}>{item.label}</span>
                        {item.description ? (
                          <span className={styles.description}>
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                )
              }}
            </For>
          }
        >
          <li className={styles.empty}>No items</li>
        </Show>
      </ul>
    </div>
  )

  return (
    <div className={cx(styles.root, className)} role="group" aria-label={ariaLabel}>
      {renderPane(
        leftItems,
        leftChecked,
        setLeftChecked,
        leftQuery,
        setLeftQuery,
        titles[0],
      )}
      <div className={styles.actions}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Move selected to the right"
          disabled={reactive(() => disabled || leftChecked().length === 0)}
          onClick={() => move('right')}
        >
          <ChevronRight aria-hidden size={16} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Move selected to the left"
          disabled={reactive(() => disabled || rightChecked().length === 0)}
          onClick={() => move('left')}
        >
          <ChevronLeft aria-hidden size={16} />
        </Button>
      </div>
      {renderPane(
        rightItems,
        rightChecked,
        setRightChecked,
        rightQuery,
        setRightQuery,
        titles[1],
      )}
    </div>
  )
}
