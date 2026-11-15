import { area, curveMonotoneX, line, scaleLinear, scalePoint } from 'd3'
import { effect, onCleanup, signal } from '@vorzelajs/core'

import { useContainerSize, useId } from '../hooks/index.ts'
import { cx } from '../lib/cx.ts'
import { mountChart, svgElement } from './chart-dom.ts'
import { useAnimatedProgress } from './use-animated-progress.ts'
import { chartColor, numeric } from './chart-utils.ts'
import type { ChartDatum } from './chart-types.ts'
import styles from './charts.module.scss'

export function Sparkline({
  data,
  valueKey,
  height = 36,
  color = chartColor(0),
  filled = true,
  animate = true,
  label,
  className,
}: {
  data: ChartDatum[]
  valueKey: string
  height?: number
  color?: string
  filled?: boolean
  animate?: boolean
  label?: string
  className?: string
}) {
  const { ref: measureRef, width } = useContainerSize<HTMLDivElement>()
  const [host, setHost] = signal<HTMLDivElement | null>(null)
  const gradientId = useId('spark').replace(/:/g, '')
  const progress = useAnimatedProgress({
    enabled: animate,
    duration: 500,
    resetKey: `${data.length}:${data[0]?.[valueKey]}:${data[data.length - 1]?.[valueKey]}`,
  })

  const values = data.map((datum) => numeric(datum[valueKey]) ?? 0)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const baseline = height

  effect(() => {
    const node = host()
    if (!node) return
    const measured = width()
    if (measured <= 0 || values.length <= 1) return

    onCleanup(
      mountChart(node, () => {
        const x = scalePoint<number>()
          .domain(values.map((_, index) => index))
          .range([0, Math.max(1, measured)])
        const y = scaleLinear().domain([min, max]).range([height - 2, 2])
        const lineGen = line<number>()
          .x((_, index) => x(index) ?? 0)
          .y((value) => y(min + (value - min) * progress()))
          .curve(curveMonotoneX)
        const areaGen = area<number>()
          .x((_, index) => x(index) ?? 0)
          .y0(baseline)
          .y1((value) => y(min + (value - min) * progress()))
          .curve(curveMonotoneX)

        const children: Array<Node | null> = []

        if (filled) {
          children.push(
            svgElement('path', {
              d: () => areaGen(values) ?? '',
              fill: `url(#${gradientId})`,
            }),
          )
        }

        children.push(
          svgElement('path', {
            d: () => lineGen(values) ?? '',
            fill: 'none',
            stroke: color,
            'stroke-width': 1.5,
            'stroke-linecap': 'round',
          }),
        )

        return svgElement(
          'svg',
          {
            width: measured,
            height,
            viewBox: `0 0 ${measured} ${height}`,
            'aria-hidden': 'true',
          },
          [
            svgElement('defs', {}, [
              svgElement(
                'linearGradient',
                { id: gradientId, x1: 0, y1: 0, x2: 0, y2: 1 },
                [
                  svgElement('stop', {
                    offset: '0%',
                    'stop-color': color,
                    'stop-opacity': 0.3,
                  }),
                  svgElement('stop', {
                    offset: '100%',
                    'stop-color': color,
                    'stop-opacity': 0.02,
                  }),
                ],
              ),
            ]),
            ...children,
          ],
        )
      }),
    )
  })

  return (
    <div
      ref={(node) => {
        const element = node as HTMLDivElement | null
        measureRef(element)
        setHost(element)
      }}
      className={cx(styles.fluid, className)}
      style={{ height }}
      role="img"
      aria-label={label ?? `Sparkline with ${values.length} points`}
    />
  )
}
