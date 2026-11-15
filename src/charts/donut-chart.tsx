import { arc, pie, type PieArcDatum } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { cx } from '../lib/cx.ts'
import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { chartColor, compactNumber, labelOf, numeric } from './chart-utils.ts'
import type { ChartDatum, ChartSeries, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'

export type DonutChartProps = {
  data: ChartDatum[]
  nameKey?: string
  valueKey?: string
  height?: number
  title?: unknown
  description?: unknown
  className?: string
  innerRadius?: number
  padAngle?: number
  showLabels?: boolean
  centerLabel?: unknown
  animate?: boolean
  valueFormat?: (value: number) => string
  ariaLabel?: string
}

function DonutCanvas({
  data,
  nameKey,
  valueKey,
  size,
  innerRadius,
  padAngle,
  showLabels,
  centerLabel,
  animate,
  valueFormat,
}: {
  data: ChartDatum[]
  nameKey: string
  valueKey: string
  size: ChartSize
  innerRadius: number
  padAngle: number
  showLabels: boolean
  centerLabel?: unknown
  animate: boolean
  valueFormat: (value: number) => string
}) {
  const [active, setActive] = signal<number | null>(null)
  const resetKey = `${data.length}:${data.map((item) => item[valueKey]).join(',')}`
  const progress = useAnimatedProgress({ enabled: animate, resetKey })

  const width = size.width
  const height = size.height
  const radius = Math.max(1, Math.min(width, height) / 2 - 16)
  const inner = radius * Math.max(0, Math.min(0.9, innerRadius))

  const layout = pie<ChartDatum>()
    .value((datum) => numeric(datum[valueKey]) ?? 0)
    .sort(null)
    .padAngle(padAngle)
  const arcs = () => layout.endAngle(2 * Math.PI * progress())(data)
  const arcGen = arc<PieArcDatum<ChartDatum>>()
    .innerRadius(inner)
    .outerRadius(radius)
    .cornerRadius(3)

  const total = data.reduce((sum, datum) => sum + (numeric(datum[valueKey]) ?? 0), 0)
  const sliceNodes: SVGElement[] = []

  data.forEach((_datum, index) => {
    const mid = () => {
      const slice = arcs()[index]
      return slice ? (slice.startAngle + slice.endAngle) / 2 : 0
    }
    const labelRadius = (inner + radius) / 2
    const color = chartColor(index)

    const path = svgElement('path', {
      d: () => {
        const slice = arcs()[index]
        return slice ? (arcGen(slice) ?? '') : ''
      },
      fill: color,
      opacity: () => {
        const current = active()
        return current != null && current !== index ? 0.5 : 1
      },
      class: cx(styles.hit, styles.fade),
    })
    onChartEvent(path, 'pointerenter', () => setActive(index))
    onChartEvent(path, 'pointerleave', () => setActive(null))

    const label = showLabels
      ? svgElement(
          'text',
          {
            x: () => Math.cos(mid() - Math.PI / 2) * labelRadius,
            y: () => Math.sin(mid() - Math.PI / 2) * labelRadius,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            opacity: () => {
              const slice = arcs()[index]
              return slice && slice.endAngle - slice.startAngle > 0.35 ? 1 : 0
            },
            class: styles.labelOnMark,
          },
          [
            () => {
              const slice = arcs()[index]
              if (!slice) return ''
              return `${Math.round(((slice.endAngle - slice.startAngle) / (2 * Math.PI)) * 100)}%`
            },
          ],
        )
      : null

    sliceNodes.push(
      svgElement(
        'g',
        {},
        [
          path,
          label,
        ],
      ),
    )
  })

  const group = svgElement(
    'g',
    { transform: `translate(${width / 2},${height / 2})` },
    [
      ...sliceNodes,
      svgElement(
        'text',
        {
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          class: styles.centerValue,
        },
        [
          () => {
            const resolved = centerLabel
            return typeof resolved === 'string' || typeof resolved === 'number'
              ? resolved
              : resolved == null
                ? valueFormat(total)
                : ''
          },
        ],
      ),
      svgElement(
        'text',
        {
          y: 18,
          'text-anchor': 'middle',
          class: styles.centerCaption,
        },
        ['Total'],
      ),
    ],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Donut chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [`Donut chart with ${data.length} segments`]),
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
          const slice = arcs()[index]
          if (!datum || !slice) return null
          const angle = (slice.startAngle + slice.endAngle) / 2 - Math.PI / 2
          const value = numeric(datum[valueKey]) ?? 0
          return (
            <ChartTooltip
              x={width / 2 + Math.cos(angle) * radius}
              y={height / 2 + Math.sin(angle) * radius}
              width={width}
            >
              <p className={styles.tooltipTitle}>{String(datum[nameKey] ?? '')}</p>
              <p className={styles.tooltipRow}>
                {valueFormat(value)}
                <span className={styles.tooltipPercent}>
                  ({total ? Math.round((value / total) * 100) : 0}%)
                </span>
              </p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function DonutChart({
  data,
  nameKey = 'name',
  valueKey = 'value',
  height = 240,
  title,
  description,
  className,
  innerRadius = 0.62,
  padAngle = 0.02,
  showLabels = false,
  centerLabel,
  animate = true,
  valueFormat = compactNumber,
  ariaLabel,
}: DonutChartProps) {
  const series: ChartSeries[] = data.map((datum, index) => ({
    key: String(datum[nameKey] ?? index),
    label: String(datum[nameKey] ?? `Segment ${index + 1}`),
    color: chartColor(index),
  }))

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      className={className}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      empty={data.length === 0}
      legend={series.map((item, index) => ({
        label: labelOf(series, index),
        color: item.color ?? chartColor(index),
        shape: 'circle',
      }))}
      table={{
        caption: typeof title === 'string' ? title : 'Chart data',
        columns: [
          { key: nameKey, label: 'Segment' },
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
        <DonutCanvas
          data={data}
          nameKey={nameKey}
          valueKey={valueKey}
          size={size}
          innerRadius={innerRadius}
          padAngle={padAngle}
          showLabels={showLabels}
          centerLabel={centerLabel}
          animate={animate}
          valueFormat={valueFormat}
        />
      )}
    </ChartFrame>
  )
}
