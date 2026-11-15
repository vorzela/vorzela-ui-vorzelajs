import { effect, signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { ChevronRight } from './icons.tsx'
import styles from './tree-view.module.scss'
import type { KeyboardEvent, ReactNode } from '../../types.ts'

export type TreeNode = {
  id: string
  label: ReactNode
  icon?: ReactNode
  children?: TreeNode[]
}

type FlatNode = {
  node: TreeNode
  depth: number
  parentId: string | null
  hasChildren: boolean
}

export interface TreeViewProps {
  nodes: TreeNode[] | (() => TreeNode[])
  defaultExpanded?: string[]
  selectedId?: string | (() => string | undefined)
  onSelect?: (node: TreeNode) => void
  label?: string
  className?: string
}

export function TreeView({
  nodes: nodesProp,
  defaultExpanded = [],
  selectedId,
  onSelect,
  label = 'Tree',
  className,
}: TreeViewProps) {
  const nodes = accessorOf(nodesProp)
  const selected = selectedId === undefined ? null : accessorOf(selectedId)
  const [expanded, setExpanded] = signal<Set<string>>(
    new Set(defaultExpanded),
  )
  const refs = new Map<string, HTMLDivElement>()
  let cache = new Map<string, FlatNode>()

  /**
   * Flatten the visible rows while reusing row objects. `For` replaces a row
   * when the item identity changes, so stable objects keep expanded siblings
   * in place (and their DOM nodes focused) when a branch opens or closes.
   */
  const rows = (): FlatNode[] => {
    const list = nodes()
    const open = expanded()
    const next = new Map<string, FlatNode>()
    const out: FlatNode[] = []

    const walk = (
      entries: TreeNode[],
      depth: number,
      parentId: string | null,
    ): void => {
      for (const node of entries) {
        const hasChildren = Boolean(node.children?.length)
        let entry = cache.get(node.id)
        if (
          !entry ||
          entry.node !== node ||
          entry.depth !== depth ||
          entry.parentId !== parentId ||
          entry.hasChildren !== hasChildren
        ) {
          entry = { node, depth, parentId, hasChildren }
        }
        next.set(node.id, entry)
        out.push(entry)

        if (hasChildren && open.has(node.id)) {
          walk(node.children!, depth + 1, node.id)
        }
      }
    }

    walk(list, 0, null)
    cache = next
    return out
  }

  const isSelected = (row: FlatNode): boolean =>
    selected?.() === row.node.id

  // `For` disposes effects created inside its rows when its list changes, so
  // the key encodes every visual state that a row renders. A state change
  // rebuilds only the affected row with fresh static attributes.
  const rowKey = (row: FlatNode): string =>
    `${row.node.id}:${expanded().has(row.node.id) ? '1' : '0'}:${
      isSelected(row) ? '1' : '0'
    }`

  // Ref callbacks receive elements only; prune rows that left the tree so
  // detached DOM is not retained by the ref map.
  effect(() => {
    const ids = new Set(rows().map((row) => row.node.id))
    for (const id of Array.from(refs.keys())) {
      if (!ids.has(id)) refs.delete(id)
    }
  })

  const toggle = (id: string): void => {
    const hadFocus =
      typeof document !== 'undefined' && document.activeElement === refs.get(id)
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // Row keys change with the expansion state, so the focused DOM node is
    // replaced. Restore focus on the rebuilt row for keyboard users.
    if (hadFocus) refs.get(id)?.focus()
  }

  const focusRow = (id: string): void => {
    refs.get(id)?.focus()
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    row: FlatNode,
  ): void => {
    const currentRows = rows()
    const index = currentRows.findIndex(
      (entry) => entry.node.id === row.node.id,
    )
    const isOpen = expanded().has(row.node.id)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = currentRows[index + 1]
      if (next) focusRow(next.node.id)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const previous = currentRows[index - 1]
      if (previous) focusRow(previous.node.id)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (row.hasChildren && !isOpen) toggle(row.node.id)
      else if (row.hasChildren && isOpen) {
        const next = currentRows[index + 1]
        if (next && next.depth > row.depth) focusRow(next.node.id)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (row.hasChildren && isOpen) toggle(row.node.id)
      else if (row.parentId) focusRow(row.parentId)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (row.hasChildren) toggle(row.node.id)
      onSelect?.(row.node)
    }
  }

  return (
    <div role="tree" aria-label={label} className={cx(styles.root, className)}>
      <For each={rows} key={rowKey}>
        {(row, index) => {
          const open = expanded().has(row.node.id)
          const active = isSelected(row)

          return (
            <div
              ref={(node) => {
                if (node) refs.set(row.node.id, node as HTMLDivElement)
              }}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-expanded={
                row.hasChildren ? (open ? 'true' : 'false') : undefined
              }
              aria-selected={active ? 'true' : 'false'}
              tabIndex={index === 0 ? 0 : -1}
              onClick={() => {
                onSelect?.(row.node)
                if (row.hasChildren) toggle(row.node.id)
              }}
              onKeyDown={(event) =>
                handleKeyDown(
                  event as unknown as KeyboardEvent<HTMLDivElement>,
                  row,
                )
              }
              className={cx(styles.row, active && styles.selected)}
              style={{ paddingLeft: `${row.depth * 16 + 8}px` }}
            >
              {row.hasChildren ? (
                <ChevronRight
                  className={cx(
                    styles.chevron,
                    open && styles.chevronOpen,
                  )}
                  aria-hidden
                />
              ) : (
                <span className={styles.chevronSpacer} aria-hidden />
              )}
              {row.node.icon ? (
                <span className={styles.icon} aria-hidden>
                  {row.node.icon}
                </span>
              ) : null}
              <span className={styles.label}>{row.node.label}</span>
            </div>
          )
        }}
      </For>
    </div>
  )
}
