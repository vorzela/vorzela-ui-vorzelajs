import { effect, onCleanup, signal } from '@vorzelajs/core'

import { Skeleton } from '../components/ui/skeleton.tsx'
import { useContainerSize } from '../hooks/index.ts'
import { cx } from '../lib/cx.ts'
import type { ReactNode } from '../types.ts'
import { mountChart } from './chart-dom.ts'
import type {
  ChartDatum,
  ChartLegendItem,
  ChartSize,
  ChartTableColumn,
} from './chart-types.ts'
import styles from './charts.module.scss'

export type ChartFrameProps = {
  title?: ReactNode
  description?: ReactNode
  height?: number
  className?: string
  legend?: ChartLegendItem[]
  loading?: boolean
  error?: ReactNode
  empty?: boolean
  emptyMessage?: string
  actions?: ReactNode
  table?: {
    columns: ChartTableColumn[]
    rows: ChartDatum[]
    caption?: string
  }
  children: (size: ChartSize) => ReactNode
  'aria-label'?: string
}

/** Shared surface, sizing, legend, empty/error states and data table for charts. */
export function ChartFrame({
  title,
  description,
  height = 240,
  className,
  legend,
  loading = false,
  error,
  empty = false,
  emptyMessage = 'No data for this period.',
  actions,
  table,
  children,
  'aria-label': ariaLabel,
}: ChartFrameProps) {
  const { ref: measureRef, width } = useContainerSize<HTMLDivElement>()
  const [plot, setPlot] = signal<HTMLDivElement | null>(null)

  effect(() => {
    const host = plot()
    if (!host) return

    const measured = width()
    const frameHeight = height

    onCleanup(
      mountChart(host, () => {
        if (loading) return <Skeleton className={styles.plotSkeleton} />

        if (error) {
          return (
            <div role="alert" className={styles.state}>
              <p className={styles.stateTitle}>Chart unavailable</p>
              <p className={styles.stateDescription}>{error}</p>
            </div>
          )
        }

        if (empty) {
          return (
            <div className={styles.state}>
              <p className={styles.stateTitle}>No data</p>
              <p className={styles.stateDescription}>{emptyMessage}</p>
            </div>
          )
        }

        if (measured === 0) {
          return <Skeleton className={styles.plotSkeleton} />
        }

        return children({ width: measured, height: frameHeight })
      }),
    )
  })

  return (
    <figure aria-label={ariaLabel} className={cx(styles.frame, className)}>
      {title || description || actions ? (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title ? <figcaption className={styles.title}>{title}</figcaption> : null}
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}

      <div
        ref={(node) => {
          const element = node as HTMLDivElement | null
          measureRef(element)
          setPlot(element)
        }}
        style={{ height }}
        className={styles.plot}
      />

      {legend?.length ? (
        <ul className={styles.legend} aria-label="Legend">
          {legend.map((item) => (
            <li key={item.label} className={styles.legendItem}>
              <span
                aria-hidden
                className={cx(styles.legendSwatch, legendShape(item.shape))}
                style={{ background: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      {table?.rows.length ? (
        <details className={styles.dataDetails}>
          <summary className={styles.dataSummary}>View data table</summary>
          <div className={styles.dataScroll}>
            <table className={styles.dataTable}>
              {table.caption ? (
                <caption className={styles.dataCaption}>{table.caption}</caption>
              ) : null}
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column.key} scope="col">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {table.columns.map((column) => (
                      <td key={column.key}>
                        {column.format
                          ? column.format(row[column.key], row)
                          : String(row[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  )
}

function legendShape(shape: ChartLegendItem['shape']): string {
  if (shape === 'line') return styles.legendLine
  if (shape === 'circle') return styles.legendCircle
  return styles.legendSquare
}
