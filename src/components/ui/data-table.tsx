import {
  createTable,
  flexRender,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@vorzelajs/table'
import { computed, effect, onCleanup, signal, untrack } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'

import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { appTableFeatures, type AppColumnDef } from '../../lib/table.ts'
import type { CSSProperties, ReactNode } from '../../types.ts'
import { Portal } from '../primitives/portal.tsx'
import { Checkbox } from './checkbox.tsx'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronsUpDown,
  Columns3,
  Search,
  X,
} from './icons.tsx'
import styles from './data-table.module.scss'
import tableStyles from './simple-data-table.module.scss'

type ClassValueOrFn<TContext> = string | ((context: TContext) => string)

export interface DataTableRowClassContext<TData> {
  row: TData
  rowIndex: number
  selected: boolean
  isEven: boolean
}

export interface DataTableCellClassContext<TData>
  extends DataTableRowClassContext<TData> {
  columnId: string
}

interface DataTableColumnMeta<TData> {
  headerClass?: string
  cellClass?: ClassValueOrFn<DataTableCellClassContext<TData>>
}

export interface DataTableClasses<TData> {
  toolbar?: string
  searchWrap?: string
  searchInput?: string
  actions?: string
  tableShell?: string
  table?: string
  head?: string
  headerRow?: string
  headerCell?: string
  body?: string
  row?: ClassValueOrFn<DataTableRowClassContext<TData>>
  selectedRow?: ClassValueOrFn<DataTableRowClassContext<TData>>
  cell?: ClassValueOrFn<DataTableCellClassContext<TData>>
  emptyState?: string
  bulkBar?: string
  pagination?: string
}

export type DataTableVariant = 'compact' | 'comfortable' | 'minimal'

function resolveClassName<TContext>(
  value: ClassValueOrFn<TContext> | undefined,
  context: TContext,
): string | undefined {
  return typeof value === 'function' ? value(context) : value
}

function getColumnMeta<TData>(column: {
  columnDef: { meta?: unknown }
}): DataTableColumnMeta<TData> | undefined {
  return column.columnDef.meta as DataTableColumnMeta<TData> | undefined
}

export interface DataTableProps<TData extends RowData> {
  data: TData[] | (() => TData[])
  columns: AppColumnDef<TData, unknown>[] | (() => AppColumnDef<TData, unknown>[])
  pagination?: boolean
  initialPageSize?: number
  pageSizeOptions?: number[]
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  onPaginationChange?: (state: PaginationState) => void
  manualSorting?: boolean
  onSortingChange?: (state: SortingState) => void
  manualFiltering?: boolean
  onGlobalFilterChange?: (value: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  variant?: DataTableVariant
  columnVisibilityToggle?: boolean
  enableRowSelection?: boolean
  onSelectionChange?: (rows: TData[]) => void
  bulkActions?: (selectedRows: TData[]) => ReactNode
  loading?: boolean | (() => boolean)
  skeletonRows?: number
  emptyMessage?: string
  toolbarActions?: ReactNode
  classes?: DataTableClasses<TData>
  className?: string
}

function SortIcon({
  direction,
}: {
  direction: () => 'asc' | 'desc' | false
}) {
  return (
    <span className={tableStyles.sortIcon}>
      <Show when={() => direction() === 'asc'}>
        {() => <ChevronUp aria-hidden />}
      </Show>
      <Show when={() => direction() === 'desc'}>
        {() => <ChevronDown aria-hidden />}
      </Show>
      <Show when={() => direction() === false}>
        {() => <ChevronsUpDown aria-hidden />}
      </Show>
    </span>
  )
}

interface ColVisColumn {
  id: string
  columnDef: { header?: unknown }
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (value?: boolean) => void
}

interface ColVisProps {
  anchor: () => HTMLButtonElement | null
  columns: ColVisColumn[]
  onClose: () => void
}

function ColVisPanel({ anchor, columns, onClose }: ColVisProps) {
  const [panel, setPanel] = signal<HTMLDivElement | null>(null)
  const [position, setPosition] = signal<{ top: string; left: string }>({
    top: '0px',
    left: '0px',
  })

  effect(() => {
    const element = anchor()
    if (!element || typeof window === 'undefined') return
    const rect = element.getBoundingClientRect()
    const panelWidth = 200
    const left = Math.min(
      rect.right - panelWidth,
      window.innerWidth - panelWidth - 8,
    )
    setPosition({
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(left, 8)}px`,
    })
  })

  effect(() => {
    if (typeof document === 'undefined') return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panel()?.contains(target)) return
      if (anchor()?.contains(target)) return
      onClose()
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    onCleanup(() => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    })
  })

  return (
    <Portal>
      <div
        ref={(node) => setPanel(node as HTMLDivElement)}
        role="dialog"
        aria-modal="false"
        aria-label="Toggle columns"
        style={() => position() as CSSProperties}
        className={styles.colPanel}
      >
        <p className={styles.colTitle}>Columns</p>
        <For each={() => columns} key={(column) => column.id}>
          {(column) =>
            column.id === '__select__' ? null : (
              <label className={styles.colOption}>
                <input
                  type="checkbox"
                  checked={() => column.getIsVisible()}
                  onChange={(event) =>
                    column.toggleVisibility(
                      (event.currentTarget as HTMLInputElement).checked,
                    )
                  }
                  className={styles.colCheck}
                />
                {String(column.columnDef.header ?? column.id)}
              </label>
            )
          }
        </For>
      </div>
    </Portal>
  )
}

/** Full data table: search, sorting, selection, column visibility and paging. */
export function DataTable<TData extends RowData>({
  data,
  columns,
  pagination,
  initialPageSize,
  pageSizeOptions,
  manualPagination,
  pageCount,
  rowCount,
  onPaginationChange,
  manualSorting,
  onSortingChange,
  manualFiltering,
  onGlobalFilterChange,
  searchable,
  searchPlaceholder,
  variant = 'comfortable',
  columnVisibilityToggle,
  enableRowSelection,
  onSelectionChange,
  bulkActions,
  loading,
  skeletonRows,
  emptyMessage,
  toolbarActions,
  classes,
  className,
}: DataTableProps<TData>) {
  const isSearchable = searchable !== false
  const isColVizEnabled = columnVisibilityToggle !== false
  const isPaginationEnabled = pagination !== false
  const skeletonCount = skeletonRows ?? 5
  const pageSizes = pageSizeOptions ?? [10, 25, 50, 100]

  const dataAccessor = accessorOf<TData[]>(data)
  const columnsAccessor = accessorOf<AppColumnDef<TData, unknown>[]>(columns)
  const loadingAccessor = accessorOf<boolean>(loading ?? false)

  const [searchInput, setSearchInput] = signal('')
  const [showColViz, setShowColViz] = signal(false)
  const [colVizBtn, setColVizBtn] = signal<HTMLButtonElement | null>(null)
  let debounce: ReturnType<typeof setTimeout> | null = null

  onCleanup(() => {
    if (debounce) {
      clearTimeout(debounce)
      debounce = null
    }
  })

  const makeSelectionColumn = (): AppColumnDef<TData, unknown> => ({
    id: '__select__',
    enableSorting: false,
    enableHiding: false,
    size: 48,
    header: ({ table }) => (
      <Checkbox
        checked={() => table.getIsAllPageRowsSelected()}
        indeterminate={() =>
          table.getIsSomePageRowsSelected() &&
          !table.getIsAllPageRowsSelected()
        }
        onChange={(value) => table.toggleAllPageRowsSelected(value)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={() => row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={(value) => row.toggleSelected(value)}
        aria-label={`Select row ${row.id}`}
      />
    ),
  })

  const buildColumns = (
    base: AppColumnDef<TData, unknown>[],
  ): AppColumnDef<TData, unknown>[] =>
    enableRowSelection ? [makeSelectionColumn(), ...base] : base

  const table = createTable({
    features: appTableFeatures,
    data: dataAccessor(),
    columns: buildColumns(columnsAccessor()),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize ?? 10,
      },
    },
    enableRowSelection: enableRowSelection ?? false,
    manualPagination: manualPagination ?? false,
    manualSorting: manualSorting ?? false,
    manualFiltering: manualFiltering ?? false,
    ...(pageCount !== undefined ? { pageCount } : {}),
    autoResetPageIndex: true,
  })

  // Data and columns are plain options for the table core. Watch accessor props
  // and push replacements through setOptions; the component itself stays
  // mounted. The first pass is skipped so an accessor that allocates a new
  // array per read does not trigger a redundant rebuild.
  let firstSync = true
  let lastData = dataAccessor()
  let lastColumns = columnsAccessor()
  effect(() => {
    const nextData = dataAccessor()
    const nextColumns = columnsAccessor()
    if (firstSync) {
      firstSync = false
      return
    }
    if (nextData === lastData && nextColumns === lastColumns) return
    lastData = nextData
    lastColumns = nextColumns
    untrack(() => {
      table.setOptions((previous) => ({
        ...previous,
        data: nextData,
        columns: buildColumns(nextColumns),
      }))
    })
  })

  const selectedRows = computed(() =>
    table.getSelectedRowModel().rows.map((row) => row.original),
  )

  effect(() => {
    if (!onSelectionChange) return
    onSelectionChange(selectedRows())
  })

  let lastSorting = table.atoms.sorting?.get()
  effect(() => {
    const next = table.atoms.sorting?.get()
    if (next === lastSorting) return
    lastSorting = next
    if (next) onSortingChange?.(next)
  })

  let lastPagination = table.atoms.pagination?.get()
  effect(() => {
    const next = table.atoms.pagination?.get()
    if (next === lastPagination) return
    lastPagination = next
    if (next) onPaginationChange?.(next)
  })

  const handleSearch = (raw: string) => {
    setSearchInput(raw)
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => {
      debounce = null
      table.setGlobalFilter(raw)
      onGlobalFilterChange?.(raw)
    }, 300)
  }

  const clearSearch = () => {
    setSearchInput('')
    if (debounce) {
      clearTimeout(debounce)
      debounce = null
    }
    table.setGlobalFilter('')
    onGlobalFilterChange?.('')
  }

  const paginationState = (): PaginationState =>
    table.atoms.pagination?.get() ?? {
      pageIndex: 0,
      pageSize: initialPageSize ?? 10,
    }
  const totalFiltered = () =>
    manualPagination
      ? (rowCount ?? 0)
      : table.getFilteredRowModel().rows.length
  const pageStart = () => {
    const state = paginationState()
    return state.pageIndex * state.pageSize + 1
  }
  const pageEnd = () => {
    const state = paginationState()
    const start = state.pageIndex * state.pageSize + 1
    return Math.min(start + state.pageSize - 1, totalFiltered())
  }
  const visibleLeafColumns = () =>
    table.getAllLeafColumns().filter((column) => column.getIsVisible())
  const skeletonIndices = () =>
    Array.from({ length: skeletonCount }, (_, index) => index)

  // Static rows and cells must not allocate one effect each. Only bind the
  // class when selection or a class callback can change it.
  const reactiveRowClass =
    enableRowSelection === true ||
    typeof classes?.row === 'function' ||
    typeof classes?.selectedRow === 'function'

  return (
    <div className={cx(tableStyles.root, className)} data-variant={variant}>
      <div className={cx(tableStyles.toolbar, classes?.toolbar)}>
        {isSearchable ? (
          <div className={cx(tableStyles.searchWrap, classes?.searchWrap)}>
            <span className={tableStyles.searchIcon}>
              <Search aria-hidden />
            </span>
            <input
              type="search"
              value={() => searchInput()}
              onInput={(event) =>
                handleSearch((event.currentTarget as HTMLInputElement).value)
              }
              placeholder={searchPlaceholder ?? 'Search…'}
              aria-label={searchPlaceholder ?? 'Search'}
              className={cx(tableStyles.search, classes?.searchInput)}
            />
            <Show when={() => searchInput().length > 0}>
              {() => (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className={tableStyles.clear}
                >
                  <X aria-hidden />
                </button>
              )}
            </Show>
          </div>
        ) : null}

        <div className={cx(styles.toolbarActions, classes?.actions)}>
          {isColVizEnabled ? (
            <>
              <button
                ref={(node) => setColVizBtn(node as HTMLButtonElement)}
                type="button"
                aria-expanded={() => (showColViz() ? 'true' : 'false')}
                aria-haspopup="dialog"
                onClick={() => setShowColViz((value) => !value)}
                className={() =>
                  cx(
                    styles.columnsButton,
                    showColViz() && styles.columnsButtonActive,
                  )
                }
              >
                <Columns3 aria-hidden />
                <span className={styles.columnsLabel}>Columns</span>
              </button>

              <Show when={showColViz}>
                {() => (
                  <ColVisPanel
                    anchor={colVizBtn}
                    columns={table.getAllLeafColumns()}
                    onClose={() => setShowColViz(false)}
                  />
                )}
              </Show>
            </>
          ) : null}

          {toolbarActions}
        </div>
      </div>

      <Show when={() => enableRowSelection === true && selectedRows().length > 0}>
        {() => (
          <div className={cx(styles.bulkBar, classes?.bulkBar)}>
            <div className={styles.bulkInfo}>
              <span className={styles.bulkCount}>
                {() => {
                  const count = selectedRows().length
                  return `${count} row${count === 1 ? '' : 's'} selected`
                }}
              </span>
              <button
                type="button"
                onClick={() => table.setRowSelection({})}
                className={styles.clearSelection}
              >
                Clear selection
              </button>
            </div>

            {bulkActions ? (
              <div className={styles.bulkActions}>
                {bulkActions(selectedRows())}
              </div>
            ) : null}
          </div>
        )}
      </Show>

      <div className={cx(tableStyles.shell, classes?.tableShell)}>
        <table className={cx(tableStyles.table, classes?.table)}>
          <thead className={cx(tableStyles.head, classes?.head)}>
            <For
              each={() => table.getHeaderGroups()}
              key={(headerGroup) => headerGroup.id}
            >
              {(headerGroup) => (
                <tr className={classes?.headerRow}>
                  <For
                    each={() => headerGroup.headers}
                    key={(header) => header.id}
                  >
                    {(header) => {
                      const columnMeta = getColumnMeta<TData>(header.column)
                      const canSort = () => header.column.getCanSort()
                      const sorted = () => header.column.getIsSorted()

                      return (
                        <th
                          colSpan={header.colSpan}
                          scope="col"
                          aria-sort={() =>
                            sorted() === 'asc'
                              ? 'ascending'
                              : sorted() === 'desc'
                                ? 'descending'
                                : canSort()
                                  ? 'none'
                                  : undefined
                          }
                          className={cx(
                            tableStyles.headerCell,
                            columnMeta?.headerClass,
                            classes?.headerCell,
                          )}
                          style={
                            header.column.columnDef.size
                              ? {
                                  width: `${header.column.columnDef.size}px`,
                                }
                              : undefined
                          }
                        >
                          <Show when={() => !header.isPlaceholder}>
                            {() =>
                              canSort() ? (
                                <button
                                  type="button"
                                  className={tableStyles.sortButton}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  <SortIcon direction={sorted} />
                                </button>
                              ) : (
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
                              )
                            }
                          </Show>
                        </th>
                      )
                    }}
                  </For>
                </tr>
              )}
            </For>
          </thead>

          <tbody className={cx(tableStyles.body, classes?.body)}>
            <Show when={loadingAccessor}>
              {() => (
                <For each={skeletonIndices} key={(index) => index}>
                  {(_index) => (
                    <tr className={tableStyles.row}>
                      <For
                        each={visibleLeafColumns}
                        key={(column) => column.id}
                      >
                        {(_column) => (
                          <td className={tableStyles.cell}>
                            <div className={tableStyles.skeleton} />
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              )}
            </Show>

            <Show
              when={() =>
                !loadingAccessor() && table.getRowModel().rows.length > 0
              }
            >
              {() => (
                <For
                  each={() => table.getRowModel().rows}
                  key={(row) => row.id}
                >
                  {(row) => {
                    const rowContext = (): DataTableRowClassContext<TData> => ({
                      row: row.original,
                      rowIndex: row.index,
                      selected: row.getIsSelected(),
                      isEven: row.index % 2 === 0,
                    })
                    const rowClassFor = (
                      context: DataTableRowClassContext<TData>,
                    ) =>
                      cx(
                        tableStyles.row,
                        context.selected && styles.selected,
                        resolveClassName(classes?.row, context),
                        context.selected &&
                          resolveClassName(classes?.selectedRow, context),
                      )

                    return (
                      <tr
                        className={
                          reactiveRowClass
                            ? () => rowClassFor(rowContext())
                            : rowClassFor(rowContext())
                        }
                      >
                        <For
                          each={() => row.getVisibleCells()}
                          key={(cell) => cell.id}
                        >
                          {(cell) => {
                            const cellContext =
                              (): DataTableCellClassContext<TData> => ({
                                ...rowContext(),
                                columnId: cell.column.id,
                              })
                            const columnMeta = getColumnMeta<TData>(
                              cell.column,
                            )
                            const reactiveCellClass =
                              reactiveRowClass ||
                              typeof classes?.cell === 'function' ||
                              typeof columnMeta?.cellClass === 'function'
                            const cellClassFor = (
                              context: DataTableCellClassContext<TData>,
                            ) =>
                              cx(
                                tableStyles.cell,
                                resolveClassName(classes?.cell, context),
                                resolveClassName(
                                  columnMeta?.cellClass,
                                  context,
                                ),
                              )

                            return (
                              <td
                                className={
                                  reactiveCellClass
                                    ? () => cellClassFor(cellContext())
                                    : cellClassFor(cellContext())
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            )
                          }}
                        </For>
                      </tr>
                    )
                  }}
                </For>
              )}
            </Show>

            <Show
              when={() =>
                !loadingAccessor() && table.getRowModel().rows.length === 0
              }
            >
              {() => (
                <tr>
                  <td
                    colSpan={visibleLeafColumns().length}
                    className={cx(tableStyles.empty, classes?.emptyState)}
                  >
                    {emptyMessage ?? 'No results found.'}
                  </td>
                </tr>
              )}
            </Show>
          </tbody>
        </table>
      </div>

      {isPaginationEnabled ? (
        <div className={cx(tableStyles.pagination, classes?.pagination)}>
          <div className={tableStyles.info}>
            <Show when={() => totalFiltered() > 0}>
              {() => (
                <span>
                  Showing{' '}
                  <span className={tableStyles.strong}>
                    {() => `${pageStart()}–${pageEnd()}`}
                  </span>{' '}
                  of{' '}
                  <span className={tableStyles.strong}>
                    {() => String(totalFiltered())}
                  </span>
                </span>
              )}
            </Show>

            <label className={tableStyles.pageSize}>
              <span>Rows:</span>
              <select
                value={() => paginationState().pageSize}
                onChange={(event) =>
                  table.setPageSize(
                    Number((event.currentTarget as HTMLSelectElement).value),
                  )
                }
                className={tableStyles.select}
              >
                <For each={() => pageSizes} key={(size) => size}>
                  {(size) => (
                    <option
                      value={size}
                      selected={() => paginationState().pageSize === size}
                    >
                      {size}
                    </option>
                  )}
                </For>
              </select>
            </label>
          </div>

          <div className={tableStyles.pages}>
            <button
              type="button"
              disabled={() => !table.getCanPreviousPage()}
              onClick={() => table.firstPage()}
              className={tableStyles.pageButton}
              aria-label="First page"
            >
              <ChevronsLeft aria-hidden />
            </button>
            <button
              type="button"
              disabled={() => !table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className={tableStyles.pageButton}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden />
            </button>

            <For
              each={() =>
                pageNumbers(
                  table.getPageCount(),
                  paginationState().pageIndex,
                )
              }
              key={(item, index) =>
                `${item}-${index}-${paginationState().pageIndex}`
              }
            >
              {(item) =>
                item === '…' ? (
                  <span className={tableStyles.ellipsis}>
                    <span aria-hidden>…</span>
                    <span className="vz-sr-only">More pages</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => table.setPageIndex(Number(item) - 1)}
                    aria-label={`Page ${item}`}
                    aria-current={() => {
                      const current = paginationState().pageIndex
                      return current === Number(item) - 1 ? 'page' : undefined
                    }}
                    className={() =>
                      cx(
                        tableStyles.pageNumber,
                        paginationState().pageIndex === Number(item) - 1 &&
                          tableStyles.pageNumberActive,
                      )
                    }
                  >
                    {item}
                  </button>
                )
              }
            </For>

            <button
              type="button"
              disabled={() => !table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className={tableStyles.pageButton}
              aria-label="Next page"
            >
              <ChevronRight aria-hidden />
            </button>
            <button
              type="button"
              disabled={() => !table.getCanNextPage()}
              onClick={() => table.lastPage()}
              className={tableStyles.pageButton}
              aria-label="Last page"
            >
              <ChevronsRight aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function pageNumbers(total: number, current: number): string[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => String(index + 1))
  }
  const pages: string[] = []
  const add = (page: number) => pages.push(String(page))
  add(1)
  if (current > 3) pages.push('…')
  for (
    let page = Math.max(2, current);
    page <= Math.min(total - 1, current + 2);
    page += 1
  ) {
    add(page)
  }
  if (current < total - 3) pages.push('…')
  add(total)
  return pages
}
