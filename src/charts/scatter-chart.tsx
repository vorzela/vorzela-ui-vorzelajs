import { scaleLinear } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { cx } from '../lib/cx.ts'
import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import {
  buildTableRows,
  compactNumber,
  extentOf,
  labelOf,
  numeric,
  seriesColor,
} from './chart-utils.ts'
import type { ChartDatum, ChartSeries, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export type ScatterChartProps = {
  data: ChartDatum[]
  xKey: string
  yKey: string
  sizeKey?: string
  series?: ChartSeries[]
  height?: number
  title?: unknown
  description?: unknown
  className?: string
  showGrid?: boolean
  animate?: boolean
  xFormat?: (value: number) => string
  yFormat?: (value: number) => string
  ariaLabel?: string
}

function ScatterCanvas({
  data,
  xKey,
  yKey,
  sizeKey,
  series,
  size,
  showGrid,
  animate,
  xFormat,
  yFormat,
}: {
  data: ChartDatum[]
  xKey: string
  yKey: string
  sizeKey?: string
  series: ChartSeries[]
  size: ChartSize
  showGrid: boolean
  animate: boolean
  xFormat: (value: number) => string
  yFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const resetKey = `${data.length}:${data[0]?.[xKey]}:${data[data.length - 1]?.[xKey]}`
  const progress = useAnimatedProgress({ enabled: animate, resetKey })

  const width = size.width
  const height = size.height
  const compact = width < 420
  const margin = { top: 12, right: 12, bottom: compact ? 26 : 32, left: compact ? 36 : 46 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const xValues = data.map((datum) => numeric(datum[xKey]) ?? 0)
  const yValues = data.map((datum) => numeric(datum[yKey]) ?? 0)
  const xDomain = extentOf(xValues)
  const yDomain = extentOf(yValues)
  const x = scaleLinear().domain(xDomain).nice().range([0, innerW])
  const y = scaleLinear().domain(yDomain).nice().range([innerH, 0])
  const xTicks = x.ticks(compact ? 3 : 4)
  const yTicks = y.ticks(compact ? 3 : 4)
  const maxSize = sizeKey
    ? Math.max(...data.map((datum) => numeric(datum[sizeKey]) ?? 1), 1)
    : 1
  const radius = (datum: ChartDatum) => {
    if (!sizeKey) return 4
    const value = numeric(datum[sizeKey]) ?? 1
    return 3 + Math.sqrt(value / maxSize) * 10
  }

  const grid = showGrid
    ? yTicks.map((tick) =>
        svgElement('line', {
          x1: 0,
          x2: innerW,
          y1: y(tick),
          y2: y(tick),
          'stroke-dasharray': '3 3',
          class: styles.gridLine,
        }),
      )
    : []

  const yTickNodes = yTicks.map((tick) =>
    svgElement(
      'text',
      {
        x: -8,
        y: y(tick),
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        class: styles.tickNumeric,
      },
      [yFormat(tick)],
    ),
  )

  const xTickNodes = xTicks.map((tick) =>
    svgElement(
      'text',
      {
        x: x(tick),
        y: innerH + 16,
        'text-anchor': 'middle',
        class: styles.tickNumeric,
      },
      [xFormat(tick)],
    ),
  )

  const points = data.map((datum, index) => {
    const color = seriesColor(series, index % Math.max(1, series.length))
    const circle = svgElement('circle', {
      cx: x(numeric(datum[xKey]) ?? 0),
      cy: y(numeric(datum[yKey]) ?? 0),
      r: () => Math.max(0.5, radius(datum) * progress()),
      fill: color,
      'fill-opacity': () => {
        const current = active()
        return current != null && current !== index ? 0.45 : 0.8
      },
      stroke: color,
      'stroke-width': 1,
      class: cx(styles.hit, styles.fadeFill),
    })
    onChartEvent(circle, 'pointerenter', () => setActive(index))
    onChartEvent(circle, 'pointerleave', () => setActive(null))
    return circle
  })

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...grid, ...yTickNodes, ...xTickNodes, ...points],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Scatter chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Scatter chart with ${data.length} points`]),
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
          const datum = data[index]
          if (!datum) return null
          return (
            <ChartTooltip
              x={margin.left + x(numeric(datum[xKey]) ?? 0)}
              y={margin.top + y(numeric(datum[yKey]) ?? 0)}
              width={width}
            >
              <p className={styles.tooltipTitle}>
                {xFormat(numeric(datum[xKey]) ?? 0)} ·{' '}
                {yFormat(numeric(datum[yKey]) ?? 0)}
              </p>
              {sizeKey ? (
                <p className={styles.tooltipRow}>
                  Size: {compactNumber(numeric(datum[sizeKey]) ?? 0)}
                </p>
              ) : null}
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function ScatterChart({
  data,
  xKey,
  yKey,
  sizeKey,
  series = [{ key: yKey, label: yKey }],
  height = 240,
  title,
  description,
  className,
  showGrid = true,
  animate = true,
  xFormat = compactNumber,
  yFormat = compactNumber,
  ariaLabel,
}: ScatterChartProps) {
  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      legend={
        series.length > 1
          ? series.map((item, index) => ({
              label: labelOf(series, index),
              color: item.color ?? seriesColor(series, index),
              shape: 'circle' as const,
            }))
          : undefined
      }
      table={{
        caption: typeof title === 'string' ? title : 'Chart data',
        columns: [
          { key: xKey, label: xKey },
          { key: yKey, label: yKey },
          ...(sizeKey ? [{ key: sizeKey, label: sizeKey }] : []),
        ],
        rows: buildTableRows(data, [
          { key: xKey },
          { key: yKey },
          ...(sizeKey ? [{ key: sizeKey }] : []),
        ]),
      }}
    >
      {(size) => (
        <ScatterCanvas
          data={data}
          xKey={xKey}
          yKey={yKey}
          sizeKey={sizeKey}
          series={series}
          size={size}
          showGrid={showGrid}
          animate={animate}
          xFormat={xFormat}
          yFormat={yFormat}
        />
      )}
    </ChartFrame>
  )
}
