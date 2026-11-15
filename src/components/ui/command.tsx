import { effect, onCleanup, signal, type Accessor } from '@vorzelajs/core'
import { createContext, Show, useContext } from '@vorzelajs/dom'
import { useId } from '../../hooks/use-id.ts'
import { cx } from '../../lib/cx.ts'
import { lockBodyScroll } from '../../lib/overlay.ts'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from '../../types.ts'
import { DismissableLayer } from '../primitives/dismissable-layer.tsx'
import { FocusTrap } from '../primitives/focus-trap.tsx'
import { Portal } from '../primitives/portal.tsx'
import { Search } from './icons.tsx'
import styles from './command.module.scss'

interface CommandEntry {
  id: string
  value: string
  keywords: string[]
}

interface CommandContextValue {
  search: Accessor<string>
  setSearch: (search: string) => void
  listId: string
  list: Accessor<HTMLElement | null>
  setList: (node: HTMLElement | null) => void
  activeId: Accessor<string | null>
  setActiveId: (id: string | null) => void
  visibleIds: Accessor<Set<string>>
  reportVisibility: (id: string, visible: boolean) => void
}

const CommandContext = createContext<CommandContextValue | null>(
  null,
  'command',
)

function useCommand(component: string): CommandContextValue {
  const context = useContext(CommandContext)
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Command>.`)
  }
  return context
}

function textContent(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node === 'function') {
    return textContent((node as () => unknown)())
  }
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (typeof node === 'object') {
    const text = (node as { textContent?: unknown }).textContent
    if (typeof text === 'string') return text
  }
  return ''
}

function entryMatches(entry: CommandEntry, query: string): boolean {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return true

  const haystack = [entry.value, ...entry.keywords].join(' ').toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export type CommandProps = HTMLAttributes<HTMLDivElement>

/**
 * Root command palette surface. Filters its items from the shared search.
 *
 * Pass the palette contents as a function child so `CommandInput`,
 * `CommandList` and `CommandItem` are created inside the provider:
 * `<Command>{() => <><CommandInput /><CommandList /></>}</Command>`.
 */
export function Command({ className, children, ...props }: CommandProps) {
  const [search, setSearchValue] = signal('')
  const [activeId, setActiveId] = signal<string | null>(null)
  const [visibleIds, setVisibleIds] = signal<Set<string>>(new Set())
  const [list, setList] = signal<HTMLElement | null>(null)
  const listId = useId('command-list')

  const setSearch = (next: string): void => {
    setSearchValue(next)
    setActiveId(null)
  }

  const reportVisibility = (id: string, visible: boolean): void => {
    setVisibleIds((current) => {
      if (current.has(id) === visible) return current
      const next = new Set(current)
      if (visible) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const value: CommandContextValue = {
    search,
    setSearch,
    listId,
    list,
    setList,
    activeId,
    setActiveId,
    visibleIds,
    reportVisibility,
  }

  return (
    <CommandContext.Provider value={value}>
      {() => (
        <div
          className={cx(styles.root, className)}
          data-command-root
          {...props}
        >
          {typeof children === 'function'
            ? (children as () => unknown)()
            : children}
        </div>
      )}
    </CommandContext.Provider>
  )
}

export interface CommandInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (event: Event) => void
  onInput?: (event: Event) => void
  onKeyDown?: (event: KeyboardEvent) => void
}

export function CommandInput({
  className,
  onChange,
  onInput,
  onKeyDown,
  ...props
}: CommandInputProps) {
  const command = useCommand('CommandInput')

  const handleKeyDown = (event: KeyboardEvent): void => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (typeof document === 'undefined') return

    const list = command.list() ?? document.getElementById(command.listId)
    if (!list) return

    const items = Array.from(
      list.querySelectorAll<HTMLElement>(
        '[data-command-item]:not([disabled]):not([hidden])',
      ),
    )
    if (items.length === 0) return

    const currentId = command.activeId()
    const current = items.findIndex((item) => item.id === currentId)

    let next = current
    switch (event.key) {
      case 'ArrowDown':
        next = current < 0 ? 0 : (current + 1) % items.length
        break
      case 'ArrowUp':
        next =
          current < 0
            ? items.length - 1
            : (current - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      case 'Enter': {
        const target = items[current < 0 ? 0 : current]
        if (!target) return
        event.preventDefault()
        target.click()
        return
      }
      default:
        return
    }

    event.preventDefault()
    const target = items[next]
    if (!target) return
    command.setActiveId(target.id)
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'nearest' })
    }
  }

  return (
    <div className={styles.inputWrap}>
      <Search className={styles.searchIcon} aria-hidden="true" />
      <input
        {...props}
        role="combobox"
        aria-label="Search"
        aria-expanded="true"
        aria-controls={command.listId}
        aria-autocomplete="list"
        aria-activedescendant={() => command.activeId() ?? undefined}
        autoComplete="off"
        className={cx(styles.input, className)}
        value={() => command.search()}
        onInput={(event) => {
          const target = event.currentTarget as HTMLInputElement
          command.setSearch(target.value)
          onInput?.(event)
          onChange?.(event)
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export type CommandListProps = HTMLAttributes<HTMLDivElement>

export function CommandList({
  className,
  children,
  ...props
}: CommandListProps) {
  const { listId, setList } = useCommand('CommandList')

  onCleanup(() => setList(null))

  return (
    <div
      {...props}
      ref={(element) => setList(element as HTMLDivElement)}
      id={listId}
      role="listbox"
      aria-label="Command results"
      className={cx(styles.list, className)}
    >
      {children}
    </div>
  )
}

export type CommandEmptyProps = HTMLAttributes<HTMLDivElement>

export function CommandEmpty({
  className,
  children,
  ...props
}: CommandEmptyProps) {
  const { search, visibleIds } = useCommand('CommandEmpty')

  return (
    <Show
      when={() => search().trim().length > 0 && visibleIds().size === 0}
    >
      <div className={cx(styles.empty, className)} {...props}>
        {children}
      </div>
    </Show>
  )
}

export interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
  heading?: string
}

export function CommandGroup({
  heading,
  className,
  children,
  ...props
}: CommandGroupProps) {
  const { visibleIds } = useCommand('CommandGroup')
  const headingId = useId('command-group')
  const [groupNode, setGroupNode] = signal<HTMLDivElement | null>(null)
  const [groupHidden, setGroupHidden] = signal(false)
  let disposed = false

  // Group membership is resolved from the DOM: Vorzela creates children before
  // the group runs, so the group can inspect its own rendered items after the
  // microtask that follows the synchronous mount.
  effect(() => {
    visibleIds()
    const node = groupNode()
    if (!node) return

    queueMicrotask(() => {
      if (disposed) return
      const items = node.querySelectorAll('[data-command-item]')
      let anyVisible = false
      for (const item of items) {
        if (!item.hasAttribute('hidden')) {
          anyVisible = true
          break
        }
      }
      setGroupHidden(items.length > 0 && !anyVisible)
    })
  })

  onCleanup(() => {
    disposed = true
    setGroupNode(null)
  })

  return (
    <div
      ref={(element) => setGroupNode(element as HTMLDivElement)}
      role="group"
      aria-labelledby={heading ? headingId : undefined}
      className={cx(styles.group, className)}
      hidden={groupHidden}
      {...props}
    >
      {heading ? (
        <div id={headingId} className={styles.groupHeading}>
          {heading}
        </div>
      ) : null}
      {children}
    </div>
  )
}

export interface CommandItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void
  /** Stable filter value. Defaults to the item's text content. */
  value?: string
  /** Extra searchable terms that are not rendered. */
  keywords?: string[]
  onClick?: (event: MouseEvent) => void
  onPointerMove?: (event: PointerEvent) => void
}

export function CommandItem({
  className,
  children,
  onSelect,
  value,
  keywords,
  onClick,
  onPointerMove,
  id: idProp,
  ...props
}: CommandItemProps) {
  const command = useCommand('CommandItem')
  const generatedId = useId('command-item')
  const id = idProp ?? generatedId
  const entry: CommandEntry = {
    id,
    value: value ?? textContent(children).trim(),
    keywords: keywords ?? [],
  }
  const matches = (): boolean => entryMatches(entry, command.search())
  const itemStyle = (): Record<string, string> =>
    matches() ? {} : { display: 'none' }

  effect(() => {
    command.reportVisibility(id, matches())
  })

  onCleanup(() => {
    command.reportVisibility(id, false)
  })

  return (
    <button
      type="button"
      {...props}
      id={id}
      role="option"
      tabIndex={-1}
      aria-selected={() => String(command.activeId() === id)}
      hidden={() => !matches()}
      style={itemStyle}
      data-command-item
      data-active={() => (command.activeId() === id ? 'true' : undefined)}
      className={cx(styles.item, className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        command.setActiveId(id)
        onSelect?.()
      }}
      onPointerMove={(event: PointerEvent) => {
        onPointerMove?.(event)
        if (command.activeId() !== id) command.setActiveId(id)
      }}
    >
      {children}
    </button>
  )
}

export type CommandSeparatorProps = HTMLAttributes<HTMLDivElement>

export function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  return (
    <div
      role="separator"
      className={cx(styles.separator, className)}
      {...props}
    />
  )
}

export interface CommandDialogProps {
  open: boolean | (() => boolean)
  onOpenChange: (open: boolean) => void
  /**
   * Palette contents. Pass a function child when using `CommandInput`,
   * `CommandList` or `CommandItem`, because JSX is evaluated eagerly.
   */
  children: ReactNode
  /** Accessible name for the dialog. */
  label?: string
}

export function CommandDialog({
  open,
  onOpenChange,
  children,
  label = 'Command menu',
}: CommandDialogProps) {
  const isOpen = (): boolean =>
    typeof open === 'function' ? open() : open

  effect(() => {
    if (!isOpen() || typeof document === 'undefined') return
    const unlock = lockBodyScroll()
    onCleanup(unlock)
  })

  return (
    <Show when={isOpen}>
      {() => (
        <Portal>
          <div className={styles.overlay}>
            <div
              aria-hidden="true"
              className={styles.backdrop}
              onClick={() => onOpenChange(false)}
            />
            <FocusTrap className={styles.dialogWrap}>
              <DismissableLayer
                enabled={() => typeof document !== 'undefined'}
                onDismiss={() => onOpenChange(false)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={label}
                  className={styles.dialog}
                >
                  <Command>{children}</Command>
                </div>
              </DismissableLayer>
            </FocusTrap>
          </div>
        </Portal>
      )}
    </Show>
  )
}
