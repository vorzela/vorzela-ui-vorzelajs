import { scaleBand, scaleLinear } from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import {
  buildTableRows,
  compactNumber,
  extentOf,
  labelOf,
  seriesColor,
  seriesValues,
  stackedExtent,
  valueAt,
} from './chart-utils.ts'
import type { ChartDatum, ChartSeries, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'
import type { ReactNode } from '../types.ts'

export type BarChartProps = {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  height?: number
  title?: ReactNode
  description?: ReactNode
  className?: string
  layout?: 'vertical' | 'horizontal'
  stacked?: boolean
  showGrid?: boolean
  animate?: boolean
  yFormat?: (value: number) => string
  xFormat?: (value: string) => string
  ariaLabel?: string
}

type ActiveBar = {
  datumIndex: number
  seriesIndex: number
  x: number
  y: number
}

function BarCanvas({
  data,
  xKey,
  series,
  size,
  layout,
  stacked,
  showGrid,
  animate,
  yFormat,
  xFormat,
}: {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  size: ChartSize
  layout: 'vertical' | 'horizontal'
  stacked: boolean
  showGrid: boolean
  animate: boolean
  yFormat: (value: number) => string
  xFormat: (value: string) => string
}) {
  const [active, setActive] = signal<ActiveBar | null>(null)
  const resetKey = `${data.length}:${series.map((item) => item.key).join(',')}:${layout}:${stacked}`
  const progress = useAnimatedProgress({ enabled: animate, resetKey })

  const width = size.width
  const height = size.height
  const compact = width < 420
  const margin =
    layout === 'vertical'
      ? { top: 12, right: 12, bottom: compact ? 28 : 34, left: compact ? 34 : 44 }
      : { top: 12, right: 16, bottom: compact ? 24 : 30, left: compact ? 74 : 96 }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const xValues = data.map((datum) => String(datum[xKey] ?? ''))
  const domain = stacked
    ? stackedExtent(data, series)
    : extentOf(seriesValues(data, series))
  const min = Math.min(0, domain[0])
  const max = Math.max(0, domain[1] === 0 ? 1 : domain[1])
  const valueScale = scaleLinear().domain([min, max]).nice()
  const range: [number, number] = layout === 'vertical' ? [innerH, 0] : [0, innerW]
  valueScale.range(range)

  const band =
    layout === 'vertical'
      ? scaleBand<string>().domain(xValues).range([0, innerW]).padding(0.24)
      : scaleBand<string>().domain(xValues).range([0, innerH]).padding(0.24)
  const seriesBand = scaleBand<string>()
    .domain(series.map((item) => item.key))
    .range([0, band.bandwidth()])
    .padding(0.08)

  const tickCount = compact ? 3 : 4
  const ticks = valueScale.ticks(tickCount)

  const barGeometry = (datumIndex: number, seriesIndex: number) => {
    const datum = data[datumIndex]
    const raw = datum ? (valueAt(datum, series[seriesIndex]?.key ?? '') ?? 0) : 0
    const current = progress()
    const value = raw * current
    const label = xValues[datumIndex] ?? ''
    let barX = 0
    let barY = 0
    let barW = 0
    let barH = 0

    if (layout === 'vertical') {
      const groupX = band(label) ?? 0
      if (stacked) {
        let positive = 0
        let negative = 0
        for (let index = 0; index <= seriesIndex; index += 1) {
          const stackedValue = valueAt(datum ?? {}, series[index]?.key ?? '') ?? 0
          const scaled = stackedValue * current
          if (stackedValue >= 0) positive += scaled
          else negative += scaled
        }
        const start = raw >= 0 ? positive - value : negative - value
        const end = start + value
        const yStart = valueScale(start)
        const yEnd = valueScale(end)
        barX = groupX
        barW = band.bandwidth()
        barY = Math.min(yStart, yEnd)
        barH = Math.abs(yStart - yEnd)
      } else {
        barX = groupX + (seriesBand(series[seriesIndex]?.key ?? '') ?? 0)
        barW = seriesBand.bandwidth()
        const zero = valueScale(0)
        const y = valueScale(value)
        barY = Math.min(zero, y)
        barH = Math.abs(zero - y)
      }
    } else {
      const groupY = band(label) ?? 0
      const zero = valueScale(0)
      if (stacked) {
        let positive = 0
        let negative = 0
        for (let index = 0; index <= seriesIndex; index += 1) {
          const stackedValue = valueAt(datum ?? {}, series[index]?.key ?? '') ?? 0
          const scaled = stackedValue * current
          if (stackedValue >= 0) positive += scaled
          else negative += scaled
        }
        const start = raw >= 0 ? positive - value : negative - value
        const end = start + value
        const xStart = valueScale(start)
        const xEnd = valueScale(end)
        barX = Math.min(xStart, xEnd)
        barW = Math.abs(xStart - xEnd)
        barY = groupY
        barH = band.bandwidth()
      } else {
        const x = valueScale(value)
        barX = Math.min(zero, x)
        barW = Math.abs(zero - x)
        barY = groupY + (seriesBand(series[seriesIndex]?.key ?? '') ?? 0)
        barH = seriesBand.bandwidth()
      }
    }

    return { x: barX, y: barY, width: barW, height: barH }
  }

  const bars: SVGElement[] = []
  const labelStep = Math.max(1, Math.ceil(xValues.length / (compact ? 4 : 7)))

  data.forEach((_datum, datumIndex) => {
    const label = xValues[datumIndex] ?? ''

    series.forEach((_item, seriesIndex) => {
      const rect = svgElement('rect', {
        x: () => barGeometry(datumIndex, seriesIndex).x,
        y: () => barGeometry(datumIndex, seriesIndex).y,
        width: () => Math.max(0, barGeometry(datumIndex, seriesIndex).width),
        height: () => Math.max(0, barGeometry(datumIndex, seriesIndex).height),
        rx: () => {
          const shape = barGeometry(datumIndex, seriesIndex)
          return Math.min(4, shape.width / 3, shape.height / 3)
        },
        fill: seriesColor(series, seriesIndex),
        opacity: () => {
          const current = active()
          return current &&
            (current.datumIndex !== datumIndex || current.seriesIndex !== seriesIndex)
            ? 0.55
            : 1
        },
        class: styles.fade,
      })

      onChartEvent(rect, 'pointerenter', () => {
        const shape = barGeometry(datumIndex, seriesIndex)
        setActive({
          datumIndex,
          seriesIndex,
          x: margin.left + shape.x + shape.width / 2,
          y: margin.top + shape.y,
        })
      })
      onChartEvent(rect, 'pointerleave', () => setActive(null))

      bars.push(rect)
    })

    if (datumIndex % labelStep === 0) {
      if (layout === 'vertical') {
        bars.push(
          svgElement(
            'text',
            {
              x: (band(label) ?? 0) + band.bandwidth() / 2,
              y: innerH + 16,
              'text-anchor': 'middle',
              class: styles.tick,
            },
            [xFormat(label)],
          ),
        )
      } else {
        bars.push(
          svgElement(
            'text',
            {
              x: -8,
              y: (band(label) ?? 0) + band.bandwidth() / 2,
              'text-anchor': 'end',
              'dominant-baseline': 'middle',
              class: styles.tick,
            },
            [xFormat(label)],
          ),
        )
      }
    }
  })

  const grid = showGrid
    ? ticks.map((tick) => {
        const position = valueScale(tick)
        return layout === 'vertical'
          ? svgElement('line', {
              x1: 0,
              x2: innerW,
              y1: position,
              y2: position,
              'stroke-dasharray': '3 3',
              class: styles.gridLine,
            })
          : svgElement('line', {
              x1: position,
              x2: position,
              y1: 0,
              y2: innerH,
              'stroke-dasharray': '3 3',
              class: styles.gridLine,
            })
      })
    : []

  const tickNodes = ticks.map((tick) =>
    layout === 'vertical'
      ? svgElement(
          'text',
          {
            x: -8,
            y: valueScale(tick),
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            class: styles.tickNumeric,
          },
          [yFormat(tick)],
        )
      : svgElement(
          'text',
          {
            x: valueScale(tick),
            y: innerH + 16,
            'text-anchor': 'middle',
            class: styles.tickNumeric,
          },
          [yFormat(tick)],
        ),
  )

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...grid, ...tickNodes, ...bars],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Bar chart. Use the data table below for exact values.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [
        `Bar chart with ${series.length} series and ${data.length} categories`,
      ]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      group,
    ],
  )

  onChartEvent(svg, 'pointerleave', () => setActive(null))

  return (
    <>
      {svg}
      <Show when={() => (active() == null ? null : `${active()?.datumIndex}:${active()?.seriesIndex}`)}>
        {() => {
          const current = active()
          if (!current) return null
          const datum = data[current.datumIndex]
          const item = series[current.seriesIndex]
          if (!datum || !item) return null
          return (
            <ChartTooltip x={current.x} y={current.y} width={width}>
              <p className={styles.tooltipTitle}>{xFormat(String(datum[xKey] ?? ''))}</p>
              <p className={styles.tooltipRow}>
                <span
                  className={styles.tooltipDot}
                  style={{ background: seriesColor(series, current.seriesIndex) }}
                  aria-hidden
                />
                {labelOf(series, current.seriesIndex)}:{' '}
                <span className={styles.tooltipValue}>
                  {yFormat(valueAt(datum, item.key) ?? 0)}
                </span>
              </p>
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function BarChart({
  data,
  xKey,
  series,
  height = 240,
  title,
  description,
  className,
  layout = 'vertical',
  stacked = false,
  showGrid = true,
  animate = true,
  yFormat = compactNumber,
  xFormat = (value) => value,
  ariaLabel,
}: BarChartProps) {
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
        color: item.color ?? seriesColor(series, index),
        shape: 'square',
      }))}
      table={{
        caption: typeof title === 'string' ? title : 'Chart data',
        columns: [
          { key: xKey, label: 'Category' },
          ...series.map((item, index) => ({
            key: item.key,
            label: labelOf(series, index),
            format: (value: unknown) => (typeof value === 'number' ? yFormat(value) : ''),
          })),
        ],
        rows: buildTableRows(data, series),
      }}
    >
      {(size) => (
        <BarCanvas
          data={data}
          xKey={xKey}
          series={series}
          size={size}
          layout={layout}
          stacked={stacked}
          showGrid={showGrid}
          animate={animate}
          yFormat={yFormat}
          xFormat={xFormat}
        />
      )}
    </ChartFrame>
  )
}
