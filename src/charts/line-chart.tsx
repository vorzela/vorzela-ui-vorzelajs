import {
  area as d3Area,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveStep,
  line as d3Line,
  scaleLinear,
  scalePoint,
} from 'd3'
import { signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'

import { useId } from '../hooks/index.ts'
import { onChartEvent, svgElement } from './chart-dom.ts'
import { ChartFrame } from './chart-frame.tsx'
import { ChartTooltip } from './chart-tooltip.tsx'
import { useAnimatedProgress } from './use-animated-progress.ts'
import {
  buildTableRows,
  clamp,
  compactNumber,
  extentOf,
  labelOf,
  seriesColor,
  seriesValues,
  valueAt,
} from './chart-utils.ts'
import type { ChartDatum, ChartSeries, ChartSize } from './chart-types.ts'
import styles from './charts.module.scss'
import type { ReactNode } from '../types.ts'

const CURVES = {
  linear: curveLinear,
  monotone: curveMonotoneX,
  step: curveStep,
  smooth: curveCatmullRom.alpha(0.5),
} as const

export type LineChartProps = {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  height?: number
  title?: ReactNode
  description?: ReactNode
  className?: string
  curve?: keyof typeof CURVES
  showDots?: boolean
  showGrid?: boolean
  showArea?: boolean
  animate?: boolean
  yFormat?: (value: number) => string
  xFormat?: (value: string) => string
  yDomain?: [number, number]
  ariaLabel?: string
}

function LineCanvas({
  data,
  xKey,
  series,
  size,
  curve,
  showDots,
  showGrid,
  showArea,
  animate,
  yFormat,
  xFormat,
  yDomain,
}: {
  data: ChartDatum[]
  xKey: string
  series: ChartSeries[]
  size: ChartSize
  curve: keyof typeof CURVES
  showDots: boolean
  showGrid: boolean
  showArea: boolean
  animate: boolean
  yFormat: (value: number) => string
  xFormat: (value: string) => string
  yDomain?: [number, number]
}) {
  const [active, setActive] = signal<number | null>(null)
  const gradientId = useId('line').replace(/:/g, '')
  const resetKey = `${data.length}:${series.map((item) => item.key).join(',')}`
  const progress = useAnimatedProgress({ enabled: animate, resetKey })

  const width = size.width
  const height = size.height
  const compact = width < 420
  const margin = {
    top: 12,
    right: 12,
    bottom: compact ? 24 : 30,
    left: compact ? 34 : 44,
  }
  const innerW = Math.max(1, width - margin.left - margin.right)
  const innerH = Math.max(1, height - margin.top - margin.bottom)

  const xValues = data.map((datum) => String(datum[xKey] ?? ''))
  const x = scalePoint<string>()
    .domain(xValues)
    .range([0, innerW])
    .padding(0.5)

  const domain = yDomain ?? extentOf(seriesValues(data, series))
  const y = scaleLinear().domain(domain).nice().range([innerH, 0])
  const baseline = y.domain()[0]
  const yTicks = y.ticks(compact ? 3 : 4)
  const step = Math.max(1, Math.ceil(xValues.length / (compact ? 4 : 7)))
  const xTicks = xValues.filter((_, index) => index % step === 0)

  const curveFactory = CURVES[curve]
  const xAccessor = (datum: ChartDatum) => x(String(datum[xKey] ?? '')) ?? 0
  const yAccessor = (datum: ChartDatum, key: string) => {
    const value = valueAt(datum, key)
    const start = baseline
    return y(start + ((value ?? start) - start) * progress())
  }

  const activeX = () => {
    const index = active()
    return index == null ? 0 : (x(xValues[index]) ?? 0)
  }

  const grid = showGrid
    ? yTicks.map((tick) =>
        svgElement('line', {
          x1: 0,
          x2: innerW,
          y1: y(tick),
          y2: y(tick),
          'stroke-dasharray': '3 3',
          'vector-effect': 'non-scaling-stroke',
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
        class: styles.tick,
      },
      [xFormat(tick)],
    ),
  )

  const seriesNodes = series.map((item, index) => {
    const color = seriesColor(series, index)
    const generator = d3Line<ChartDatum>()
      .x(xAccessor)
      .y((datum) => yAccessor(datum, item.key))
      .curve(curveFactory)
    const areaGen = d3Area<ChartDatum>()
      .x(xAccessor)
      .y0(innerH)
      .y1((datum) => yAccessor(datum, item.key))
      .curve(curveFactory)

    const dots = showDots
      ? data.map((datum, datumIndex) =>
          svgElement('circle', {
            cx: xAccessor(datum),
            cy: () => yAccessor(datum, item.key),
            r: () => (active() === datumIndex ? 3.5 : 2),
            fill: 'hsl(var(--card))',
            stroke: color,
            'stroke-width': 1.5,
          }),
        )
      : []

    return svgElement(
      'g',
      {},
      [
        showArea
          ? svgElement('path', {
              d: () => areaGen(data) ?? '',
              fill: `url(#${gradientId}-${index})`,
              stroke: 'none',
            })
          : null,
        svgElement('path', {
          d: () => generator(data) ?? '',
          fill: 'none',
          stroke: color,
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
        ...dots,
      ],
    )
  })

  const cursor = svgElement('line', {
    x1: () => activeX(),
    x2: () => activeX(),
    y1: 0,
    y2: innerH,
    'stroke-dasharray': '2 2',
    class: styles.cursorLine,
    opacity: () => (active() == null ? 0 : 1),
  })

  const defs = svgElement(
    'defs',
    {},
    series.map((_item, index) =>
      svgElement(
        'linearGradient',
        {
          id: `${gradientId}-${index}`,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        [
          svgElement('stop', {
            offset: '0%',
            'stop-color': seriesColor(series, index),
            'stop-opacity': 0.28,
          }),
          svgElement('stop', {
            offset: '100%',
            'stop-color': seriesColor(series, index),
            'stop-opacity': 0.02,
          }),
        ],
      ),
    ),
  )

  const group = svgElement(
    'g',
    { transform: `translate(${margin.left},${margin.top})` },
    [...grid, ...yTickNodes, ...xTickNodes, ...seriesNodes, cursor],
  )

  const svg = svgElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Line chart. Use arrow keys to inspect data points.',
      tabindex: 0,
      class: styles.canvas,
    },
    [
      svgElement('title', {}, [
        `Line chart with ${series.length} series and ${data.length} points`,
      ]),
      svgElement('desc', {}, [
        'Equivalent data is available in the data table below the chart.',
      ]),
      defs,
      group,
    ],
  )

  onChartEvent(svg, 'pointermove', (event) => {
    const pointer = event as PointerEvent
    const rect = svg.getBoundingClientRect()
    const px = clamp(pointer.clientX - rect.left - margin.left, 0, innerW)
    let nearest = 0
    let distance = Number.POSITIVE_INFINITY
    for (let index = 0; index < xValues.length; index += 1) {
      const next = Math.abs((x(xValues[index]) ?? 0) - px)
      if (next < distance) {
        distance = next
        nearest = index
      }
    }
    setActive(nearest)
  })

  onChartEvent(svg, 'pointerleave', () => setActive(null))

  onChartEvent(svg, 'keydown', (event) => {
    const keyboard = event as KeyboardEvent
    if (keyboard.key === 'ArrowRight') {
      keyboard.preventDefault()
      setActive(Math.min(data.length - 1, (active() ?? -1) + 1))
    } else if (keyboard.key === 'ArrowLeft') {
      keyboard.preventDefault()
      setActive(Math.max(0, (active() ?? data.length) - 1))
    } else if (keyboard.key === 'Home') {
      keyboard.preventDefault()
      setActive(0)
    } else if (keyboard.key === 'End') {
      keyboard.preventDefault()
      setActive(data.length - 1)
    }
  })

  return (
    <>
      {svg}
      <Show when={() => (active() == null ? null : String(active()))}>
        {() => {
          const index = active()
          if (index == null) return null
          const datum = data[index]
          if (!datum) return null
          const pointX = x(xValues[index]) ?? 0
          return (
            <ChartTooltip
              x={margin.left + pointX}
              y={margin.top + 4}
              width={width}
            >
              <p className={styles.tooltipTitle}>{xFormat(xValues[index] ?? '')}</p>
              {series.map((item, seriesIndex) => (
                <p key={item.key} className={styles.tooltipRow}>
                  <span
                    className={styles.tooltipDot}
                    style={{ background: seriesColor(series, seriesIndex) }}
                    aria-hidden
                  />
                  {labelOf(series, seriesIndex)}:{' '}
                  <span className={styles.tooltipValue}>
                    {yFormat(valueAt(datum, item.key) ?? 0)}
                  </span>
                </p>
              ))}
            </ChartTooltip>
          )
        }}
      </Show>
    </>
  )
}

export function LineChart({
  data,
  xKey,
  series,
  height = 240,
  title,
  description,
  className,
  curve = 'monotone',
  showDots = false,
  showGrid = true,
  showArea = false,
  animate = true,
  yFormat = compactNumber,
  xFormat = (value) => value,
  yDomain,
  ariaLabel,
}: LineChartProps) {
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
        shape: 'line',
      }))}
      table={{
        caption: typeof title === 'string' ? title : 'Chart data',
        columns: [
          { key: xKey, label: 'Label' },
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
        <LineCanvas
          data={data}
          xKey={xKey}
          series={series}
          size={size}
          curve={curve}
          showDots={showDots}
          showGrid={showGrid}
          showArea={showArea}
          animate={animate}
          yFormat={yFormat}
          xFormat={xFormat}
          yDomain={yDomain}
        />
      )}
    </ChartFrame>
  )
}

export function AreaChart(props: LineChartProps) {
  return <LineChart {...props} showArea />
}
