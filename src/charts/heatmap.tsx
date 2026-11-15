import { interpolateBlues, scaleBand, scaleSequential } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { compactNumber, extentOf, numeric } from './chart-utils.ts'
import type { ChartDatum, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export type HeatmapProps = {
  data: ChartDatum[]
  xKey?: string
  yKey?: string
  valueKey?: string
  height?: number
  title?: unknown
  description?: unknown
  className?: string
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}

function HeatmapCanvas({
  data,
  xKey,
  yKey,
  valueKey,
  size,
  animate,
  valueFormat,
}: {
  data: ChartDatum[]
  xKey: string
  yKey: string
  valueKey: string
  size: ChartSize
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const progress = useAnimatedProgress({
    enabled: animate,
    resetKey: `${data.length}:${data[0]?.[valueKey]}:${data[data.length - 1]?.[valueKey]}`,
  })

  const width = size.width
  const height = size.height
  const margin = { top: 8, right: 8, bottom: 28, left: 72 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const xValues = Array.from(new Set(data.map((datum) => String(datum[xKey] ?? ''))))
  const yValues = Array.from(new Set(data.map((datum) => String(datum[yKey] ?? ''))))
  const x = scaleBand<string>().domain(xValues).range([0, innerW]).padding(0.04)
  const y = scaleBand<string>().domain(yValues).range([0, innerH]).padding(0.04)
  const values = data.map((datum) => numeric(datum[valueKey]) ?? 0)
  const domain = extentOf(values)
  const color = scaleSequential(interpolateBlues).domain(domain)

  const cells = data.map((datum, index) => {
    const rect = svgElement('rect', {
      x: x(String(datum[xKey] ?? '')) ?? 0,
      y: y(String(datum[yKey] ?? '')) ?? 0,
      width: x.bandwidth(),
      height: y.bandwidth(),
      rx: 2,
      fill: color(numeric(datum[valueKey]) ?? 0),
      'fill-opacity': () => 0.15 + 0.85 * progress(),
      stroke: 'hsl(var(--card))',
      'stroke-width': 1,
      class: styles.hit,
    })
    onChartEvent(rect, 'pointerenter', () => setActive(index))
    onChartEvent(rect, 'pointerleave', () => setActive(null))
    return rect
  })

  const yLabels = yValues.map((label) =>
    svgElement(
      'text',
      {
        x: -8,
        y: (y(label) ?? 0) + y.bandwidth() / 2,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
        class: styles.tick,
      },
      [label.length > 10 ? `${label.slice(0, 10)}…` : label],
    ),
  )

  const xLabels = xValues.map((label) =>
    svgElement(
      'text',
      {
        x: (x(label) ?? 0) + x.bandwidth() / 2,
        y: innerH + 16,
        'text-anchor': 'middle',
        class: styles.tick,
      },
      [label.length > 8 ? `${label.slice(0, 8)}…` : label],
    ),
  )

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...yLabels, ...xLabels, ...cells],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Heatmap. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [
        `Heatmap with ${xValues.length} columns and ${yValues.length} rows`,
      ]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )

  const scaleLegend = (
    <div className={styles.scaleLegend}>
      <span className={styles.scaleLabel}>{valueFormat(domain[0])}</span>
      <span
        aria-hidden
        className={styles.scaleBar}
        style={{
          background: `linear-gradient(to right, ${interpolateBlues(0)}, ${interpolateBlues(1)})`,
        }}
      />
      <span className={styles.scaleLabel}>{valueFormat(domain[1])}</span>
    </div>
  )

  return (
    <>
      {svg}
      {scaleLegend}
      <Show when={() => (active() == null ? null : String(active()))}>
        {() => {
          const index = active()
          if (index == null) return null
          const datum = data[index]
          if (!datum) return null
          return (
            <ChartTooltip
              x={
                margin.left +
                (x(String(datum[xKey] ?? '')) ?? 0) +
                x.bandwidth() / 2
              }
              y={margin.top + (y(String(datum[yKey] ?? '')) ?? 0)}
              width={width}
            >
              <p className={styles.tooltipTitle}>
                {String(datum[xKey] ?? '')} · {String(datum[yKey] ?? '')}
              </p>
              <p className={styles.tooltipRow}>
                {valueFormat(numeric(datum[valueKey]) ?? 0)}
              </p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function Heatmap({
  data,
  xKey = 'x',
  yKey = 'y',
  valueKey = 'value',
  height = 260,
  title,
  description,
  className,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: HeatmapProps) {
  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      table={{
        caption: typeof title === 'string' ? title : 'Heatmap data',
        columns: [
          { key: xKey, label: 'Column' },
          { key: yKey, label: 'Row' },
          {
            key: valueKey,
            label: 'Value',
            format: (value: unknown) =>
              typeof value === 'number' ? valueFormat(value) : '',
          },
        ],
        rows: data,
      }}
    >
      {(size) => (
        <HeatmapCanvas
          data={data}
          xKey={xKey}
          yKey={yKey}
          valueKey={valueKey}
          size={size}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
