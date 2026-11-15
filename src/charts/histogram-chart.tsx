import { bin, scaleLinear } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { cx } from '../lib/cx.ts'
import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { compactNumber } from './chart-utils.ts'
import type { ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

function HistogramCanvas({
  values,
  bins,
  size,
  animate,
  valueFormat,
}: {
  values: number[]
  bins: number
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${values.length}:${bins}:${values[0]}:${values[values.length - 1]}`,
  })

  const width = size.width
  const height = size.height
  const compact = width < 420
  const margin = { top: 12, right: 12, bottom: compact ? 28 : 34, left: compact ? 36 : 44 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const extent: [number, number] = values.length
    ? [Math.min(...values), Math.max(...values)]
    : [0, 1]
  const bucket = bin().domain(extent).thresholds(bins)
  const result = bucket(values)
  const x = scaleLinear()
    .domain([extent[0], extent[1] === extent[0] ? extent[0] + 1 : extent[1]])
    .range([0, innerW])
  const maxCount = Math.max(1, ...result.map((item) => item.length))
  const y = scaleLinear().domain([0, maxCount]).nice().range([innerH, 0])
  const ticks = y.ticks(compact ? 3 : 4)

  const tickNodes = ticks.map((tick) =>
    svgElement(
      'g',
      {},
      [
        svgElement('line', {
          x1: 0,
          x2: innerW,
          y1: y(tick),
          y2: y(tick),
          'stroke-dasharray': '3 3',
          class: styles.gridLine,
        }),
        svgElement(
          'text',
          {
            x: -8,
            y: y(tick),
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tickNumeric,
          },
          [valueFormat(tick)],
        ),
      ],
    ),
  )

  const barNodes = result.map((item, index) => {
    const x0 = x(item.x0 ?? extent[0])
    const x1 = x(item.x1 ?? extent[1])
    const rect = svgElement('rect', {
      x: x0 + 1,
      y: () => innerH - (innerH - y(item.length)) * progress(),
      width: Math.max(1, x1 - x0 - 2),
      height: () => Math.max(1, (innerH - y(item.length)) * progress()),
      rx: 2,
      fill: 'hsl(var(--chart-1))',
      opacity: () => {
        const current = active()
        return current != null && current !== index ? 0.5 : 0.9
      },
      class: cx(styles.hit, styles.fade),
    })
    onChartEvent(rect, 'pointerenter', () => setActive(index))
    onChartEvent(rect, 'pointerleave', () => setActive(null))
    return rect
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...tickNodes, ...barNodes],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Histogram. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Histogram with ${result.length} bins`]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )

  return (
    <>
      {svg}
      <Show when={() => (active() == null ? null : String(active()))}>
        {() => {
          const index = active()
          if (index == null) return null
          const item = result[index]
          if (!item) return null
          return (
            <ChartTooltip
              x={margin.left + x(item.x0 ?? extent[0])}
              y={margin.top + y(item.length)}
              width={width}
            >
              <p className={styles.tooltipTitle}>
                {compactNumber(item.x0 ?? 0)} – {compactNumber(item.x1 ?? 0)}
              </p>
              <p className={styles.tooltipRow}>{item.length} values</p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function HistogramChart({
  values,
  bins = 12,
  height = 240,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: {
  values: number[]
  bins?: number
  height?: number
  title?: unknown
  description?: unknown
  className?: string
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}) {
  const extent: [number, number] = values.length
    ? [Math.min(...values), Math.max(...values)]
    : [0, 1]
  const result = bin().domain(extent).thresholds(bins)(values)

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={values.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Histogram data',
        columns: [
          {
            key: 'range',
            label: 'Range',
          },
          { key: 'count', label: 'Count' },
        ],
        rows: result.map((item) => ({
          range: `${valueFormat(item.x0 ?? 0)} – ${valueFormat(item.x1 ?? 0)}`,
          count: item.length,
        })),
      }}
    >
      {(size) => (
        <HistogramCanvas
          values={values}
          bins={bins}
          size={size}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
