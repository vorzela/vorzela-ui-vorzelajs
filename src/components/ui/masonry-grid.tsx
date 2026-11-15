/**
 * Staggered masonry (shortest-column packing).
 *
 * Modes:
 *  - children — small lists (demos)
 *  - itemCount + renderItem — large feeds with viewport virtualization
 *
 * Virtualization keeps DOM light: only items intersecting the scrollport
 * (+ overscan) are mounted. Heights are cached; images call `reflow` on load.
 */
import { computed, effect, onCleanup, signal } from '@vorzelajs/core'
import { For } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { CSSProperties, ReactNode } from '../../types.ts'
import { forwardRef } from '../../types.ts'
import styles from './masonry-grid.module.scss'

export interface MasonryGridHandle {
  /** Live scroll container (always current). */
  getScrollElement: () => HTMLDivElement | null
  /** Force remeasure + pack (e.g. after external size changes). */
  reflow: () => void
  smoothScrollTo: (options: ScrollToOptions) => void
  smoothScrollBy: (options: ScrollToOptions) => void
}

export interface MasonryGridProps {
  /** Small lists — prefer `itemCount`/`renderItem` for large feeds. */
  children?: ReactNode
  /** Large-feed API (virtualized). Accepts a signal accessor. */
  itemCount?: number | (() => number)
  renderItem?: (index: number) => ReactNode
  getItemKey?: (index: number) => string | number
  /** Initial height guess before measure (px). Improves first paint. */
  estimatedItemHeight?: number
  /** Extra pixels above/below viewport to keep mounted (default 600). */
  overscanPixels?: number
  columns?: number
  gap?: number
  scrollable?: boolean
  maxHeight?: string | number
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

type ItemPos = { x: number; y: number; w: number; h: number }

function pack(
  count: number,
  heights: number[],
  width: number,
  columns: number,
  gap: number,
): { positions: ItemPos[]; gridHeight: number } {
  const cols = Math.max(1, columns)
  const colW = (width - gap * (cols - 1)) / cols
  const colHeights = Array.from({ length: cols }, () => 0)
  const positions: ItemPos[] = []

  for (let index = 0; index < count; index += 1) {
    const height = Math.max(0, heights[index] ?? 0)
    let shortest = 0
    for (let column = 1; column < cols; column += 1) {
      if ((colHeights[column] as number) < (colHeights[shortest] as number)) {
        shortest = column
      }
    }
    positions.push({
      x: shortest * (colW + gap),
      y: colHeights[shortest] as number,
      w: colW,
      h: height,
    })
    colHeights[shortest] = (colHeights[shortest] as number) + height + gap
  }

  const tallest = Math.max(0, ...colHeights)
  return {
    positions,
    gridHeight: tallest > 0 ? tallest - gap : 0,
  }
}

function childNodes(children: ReactNode): unknown[] {
  if (children == null) return []
  if (Array.isArray(children)) return children
  if (
    typeof children === 'object' &&
    children !== null &&
    'nodeType' in children &&
    (children as { nodeType: number }).nodeType === 11
  ) {
    return Array.from((children as DocumentFragment).childNodes)
  }
  return [children]
}

export const MasonryGrid = forwardRef<MasonryGridHandle, MasonryGridProps>(
  function MasonryGrid(
    {
      children,
      itemCount: itemCountProp,
      renderItem,
      getItemKey,
      estimatedItemHeight = 280,
      overscanPixels = 600,
      columns = 2,
      gap = 12,
      scrollable = true,
      maxHeight = '70vh',
      className,
      style,
      'aria-label': ariaLabel = 'Masonry grid',
    },
    ref,
  ) {
    const [scrollElement, setScrollElement] = signal<HTMLDivElement | null>(null)
    const [gridElement, setGridElement] = signal<HTMLDivElement | null>(null)
    const itemRefs = new Map<number, HTMLDivElement>()
    const heightCache = new Map<number, number>()

    const virtualized = Boolean(renderItem)
    const itemCountValue = accessorOf(itemCountProp ?? 0)
    const childArray = virtualized ? [] : childNodes(children)

    const [width, setWidth] = signal(0)
    const [scrollTop, setScrollTop] = signal(0)
    const [viewportH, setViewportH] = signal(0)
    const [version, setVersion] = signal(0)

    const itemCount = (): number =>
      virtualized ? itemCountValue() : childArray.length

    const heights = computed(() => {
      // `version` is read so cache updates invalidate this list.
      void version()
      const list: number[] = []
      for (let index = 0; index < itemCount(); index += 1) {
        list.push(heightCache.get(index) ?? estimatedItemHeight)
      }
      return list
    })

    const packed = computed(() => {
      if (width() <= 0 || itemCount() === 0) {
        return { positions: [] as ItemPos[], gridHeight: 0 }
      }
      return pack(itemCount(), heights(), width(), columns, gap)
    })

    const visibleRange = computed(() => {
      const positions = packed().positions
      if (!virtualized || positions.length === 0) {
        return { start: 0, end: itemCount() }
      }
      const top = scrollTop() - overscanPixels
      const bottom = scrollTop() + viewportH() + overscanPixels
      let start = 0
      let end = itemCount()
      for (let index = 0; index < positions.length; index += 1) {
        const position = positions[index] as ItemPos
        if (position.y + position.h < top) start = index + 1
        if (position.y > bottom) {
          end = index
          break
        }
      }
      return {
        start: Math.max(0, start),
        end: Math.min(itemCount(), Math.max(start, end)),
      }
    })

    const reflow = (): void => {
      const host = gridElement()
      if (!host) return
      const measuredWidth = host.clientWidth
      if (measuredWidth > 0 && measuredWidth !== width()) setWidth(measuredWidth)

      let changed = false
      for (const [index, element] of itemRefs) {
        const height = element.offsetHeight
        if (height > 0 && heightCache.get(index) !== height) {
          heightCache.set(index, height)
          changed = true
        }
      }
      if (changed) setVersion((current) => current + 1)
    }

    effect(() => {
      void itemCount()
      void columns
      void gap
      reflow()
    })

    effect(() => {
      const host = gridElement()
      if (!host || typeof ResizeObserver === 'undefined') return
      // Re-observe whenever the rendered window or measured heights change.
      const range = visibleRange()
      void version()
      const live = new Set<number>()
      for (let index = range.start; index < range.end; index += 1) live.add(index)
      for (const index of Array.from(itemRefs.keys())) {
        if (!live.has(index)) itemRefs.delete(index)
      }
      const observer = new ResizeObserver(() => reflow())
      observer.observe(host)
      for (const element of itemRefs.values()) observer.observe(element)
      onCleanup(() => observer.disconnect())
    })

    effect(() => {
      const scroller = scrollElement()
      if (!scroller || !scrollable) return

      const onScroll = (): void => {
        setScrollTop(scroller.scrollTop)
        setViewportH(scroller.clientHeight)
      }
      onScroll()
      scroller.addEventListener('scroll', onScroll, { passive: true })

      const observer =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(onScroll)
          : null
      observer?.observe(scroller)

      onCleanup(() => {
        scroller.removeEventListener('scroll', onScroll)
        observer?.disconnect()
      })
    })

    // Images / async content — remeasure when media finishes loading.
    effect(() => {
      const host = gridElement()
      if (!host) return
      const onLoad = (event: Event): void => {
        if ((event.target as HTMLElement | null)?.tagName === 'IMG') reflow()
      }
      host.addEventListener('load', onLoad, true)
      onCleanup(() => host.removeEventListener('load', onLoad, true))
    })

    const smoothScrollTo = (options: ScrollToOptions): void => {
      const element = scrollElement()
      if (!element) return
      try {
        element.scrollTo({ ...options, behavior: 'smooth' })
      } catch {
        element.scrollTo(options.left ?? element.scrollLeft, options.top ?? element.scrollTop)
      }
    }

    const smoothScrollBy = (options: ScrollToOptions): void => {
      const element = scrollElement()
      if (!element) return
      try {
        element.scrollBy({ ...options, behavior: 'smooth' })
      } catch {
        element.scrollBy(options.left ?? 0, options.top ?? 0)
      }
    }

    const handle: MasonryGridHandle = {
      getScrollElement: () => scrollElement(),
      reflow,
      smoothScrollTo,
      smoothScrollBy,
    }

    effect(() => {
      if (typeof ref === 'function') ref(handle)
      else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as { current: MasonryGridHandle | null }).current = handle
      }
      onCleanup(() => {
        if (typeof ref === 'function') ref(null)
        else if (ref && typeof ref === 'object' && 'current' in ref) {
          ;(ref as { current: MasonryGridHandle | null }).current = null
        }
      })
    })

    const indices = (): number[] => {
      const range = visibleRange()
      const list: number[] = []
      for (let index = range.start; index < range.end; index += 1) list.push(index)
      return list
    }

    const grid = (
      <div
        ref={(element) => setGridElement(element as HTMLDivElement)}
        className={() => cx(styles.grid, !scrollable && className)}
        style={(): CSSProperties => ({
          ...(packed().gridHeight ? { height: `${packed().gridHeight}px` } : {}),
          ...(!scrollable ? style : undefined),
        })}
      >
        <For each={indices} key={(index) => getItemKey?.(index) ?? index}>
          {(index) => {
            const position = packed().positions[index]
            const node = virtualized
              ? renderItem?.(index)
              : childArray[index]
            return (
              <div
                ref={(element) => {
                  if (element) itemRefs.set(index, element as HTMLDivElement)
                  else itemRefs.delete(index)
                }}
                className={styles.item}
                style={(): CSSProperties => {
                  const current = packed().positions[index] ?? position
                  return current
                    ? {
                        width: `${current.w}px`,
                        transform: `translate3d(${current.x}px, ${current.y}px, 0)`,
                      }
                    : {
                        width:
                          width() > 0
                            ? `${(width() - gap * (columns - 1)) / columns}px`
                            : `calc((100% - ${(columns - 1) * gap}px) / ${columns})`,
                        visibility: 'hidden',
                      }
                }}
              >
                {node}
              </div>
            )
          }}
        </For>
      </div>
    )

    return scrollable ? (
      <div
        ref={(element) => setScrollElement(element as HTMLDivElement)}
        role="region"
        aria-label={ariaLabel}
        aria-busy={() => width() === 0}
        className={cx(styles.scroll, className)}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          WebkitOverflowScrolling: 'touch',
          ...style,
        }}
      >
        {grid}
      </div>
    ) : (
      grid
    )
  },
)

export interface MasonryTileProps {
  children: ReactNode
  price?: string
  title?: string
  meta?: string
  onClick?: () => void
  className?: string
  imageAspectRatio?: number
}

export function MasonryTile({
  children,
  price,
  title,
  meta,
  onClick,
  className,
  imageAspectRatio = 1,
}: MasonryTileProps) {
  const a11yName = [price, title, meta].filter(Boolean).join(', ')
  const content = (
    <>
      <div
        className={styles.media}
        style={{ aspectRatio: String(imageAspectRatio) }}
        aria-hidden={onClick ? true : undefined}
      >
        {children}
      </div>
      {price ? <p className={styles.price}>{price}</p> : null}
      {title ? <p className={styles.tileTitle}>{title}</p> : null}
      {meta ? <p className={styles.meta}>{meta}</p> : null}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={a11yName || undefined}
        className={cx(styles.tile, styles.tileInteractive, className)}
      >
        {content}
      </button>
    )
  }

  return <div className={cx(styles.tile, className)}>{content}</div>
}
