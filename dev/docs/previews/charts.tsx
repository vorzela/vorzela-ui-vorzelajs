import { BarChart } from '~/charts/bar-chart.tsx'
import { BulletChart } from '~/charts/bullet-chart.tsx'
import { CandlestickChart } from '~/charts/candlestick-chart.tsx'
import { DonutChart } from '~/charts/donut-chart.tsx'
import { FunnelChart } from '~/charts/funnel-chart.tsx'
import { Gauge } from '~/charts/gauge.tsx'
import { Heatmap } from '~/charts/heatmap.tsx'
import { HistogramChart } from '~/charts/histogram-chart.tsx'
import { LineChart } from '~/charts/line-chart.tsx'
import { RadarChart } from '~/charts/radar-chart.tsx'
import { RadialBarChart } from '~/charts/radial-bar-chart.tsx'
import { SankeyChart } from '~/charts/sankey-chart.tsx'
import { ScatterChart } from '~/charts/scatter-chart.tsx'
import { Sparkline } from '~/charts/sparkline.tsx'
import { TreemapChart } from '~/charts/treemap-chart.tsx'
import { WaterfallChart } from '~/charts/waterfall-chart.tsx'
import styles from '../docs.module.scss'

const traffic = [
  { month: 'Jan', builds: 320, previews: 180 },
  { month: 'Feb', builds: 410, previews: 220 },
  { month: 'Mar', builds: 380, previews: 260 },
  { month: 'Apr', builds: 520, previews: 310 },
  { month: 'May', builds: 610, previews: 340 },
  { month: 'Jun', builds: 720, previews: 410 },
  { month: 'Jul', builds: 680, previews: 460 },
  { month: 'Aug', builds: 810, previews: 520 },
]

const series = [
  { key: 'builds', label: 'Builds' },
  { key: 'previews', label: 'Previews' },
]

const channels = [
  { channel: 'Direct', visits: 4200 },
  { channel: 'Search', visits: 3100 },
  { channel: 'Social', visits: 1800 },
  { channel: 'Email', visits: 900 },
]

const skills = [
  { axis: 'Runtime', now: 82, target: 95 },
  { axis: 'Docs', now: 74, target: 90 },
  { axis: 'A11y', now: 88, target: 95 },
  { axis: 'Charts', now: 66, target: 85 },
  { axis: 'SSR', now: 78, target: 90 },
]

function BarChartPreview() {
  return (
    <BarChart
      data={traffic}
      xKey="month"
      series={series}
      title="Monthly builds"
      description="Grouped bars, one colour per series."
      height={280}
    />
  )
}

function LineChartPreview() {
  return (
    <LineChart
      data={traffic}
      xKey="month"
      series={series}
      title="Growth"
      description="Smooth curves with dots and an area fill."
      curve="monotone"
      showArea
      showDots
      height={280}
    />
  )
}

function DonutChartPreview() {
  return (
    <DonutChart
      data={channels}
      nameKey="channel"
      valueKey="visits"
      title="Traffic by channel"
      centerLabel="10k visits"
      showLabels
      height={280}
    />
  )
}

function ScatterChartPreview() {
  return (
    <ScatterChart
      data={traffic.map((row, index) => ({
        builds: row.builds,
        previews: row.previews,
        size: 20 + index * 6,
      }))}
      xKey="builds"
      yKey="previews"
      sizeKey="size"
      title="Builds vs. previews"
      height={280}
    />
  )
}

function HeatmapPreview() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeks = ['W1', 'W2', 'W3', 'W4']
  return (
    <Heatmap
      data={weeks.flatMap((week, wi) =>
        days.map((day, di) => ({
          week,
          day,
          value: (wi * 7 + di * 3) % 11,
        })),
      )}
      xKey="day"
      yKey="week"
      valueKey="value"
      title="Deploys by day"
      height={260}
    />
  )
}

function SparklinePreview() {
  return (
    <div class={styles.demoStack}>
      <Sparkline data={traffic} valueKey="builds" height={48} label="Builds trend" />
      <Sparkline data={traffic} valueKey="previews" height={48} filled={false} color="hsl(var(--chart-2))" label="Previews trend" />
    </div>
  )
}

function GaugePreview() {
  return (
    <div class={styles.demoRow}>
      <Gauge value={72} label="Coverage" />
      <Gauge value={38} max={50} label="Open PRs" color="hsl(var(--chart-3))" />
    </div>
  )
}

function RadarChartPreview() {
  return (
    <RadarChart
      data={skills}
      axisKey="axis"
      series={[
        { key: 'now', label: 'Now' },
        { key: 'target', label: 'Target' },
      ]}
      title="Readiness"
      maxValue={100}
      height={300}
    />
  )
}

function TreemapPreview() {
  return (
    <TreemapChart
      title="Bundle composition"
      data={{
        name: 'runtime',
        children: [
          { name: 'dom', value: 12 },
          { name: 'core', value: 8 },
          { name: 'router', value: 6 },
          { name: 'server', value: 4 },
          { name: 'charts', value: 18 },
          { name: 'styles', value: 9 },
        ],
      }}
      height={280}
    />
  )
}

function SankeyPreview() {
  return (
    <SankeyChart
      title="Build pipeline"
      nodes={[
        { id: 'src', name: 'Source' },
        { id: 'ssr', name: 'SSR' },
        { id: 'client', name: 'Client' },
        { id: 'islands', name: 'Islands' },
        { id: 'cache', name: 'Cache' },
      ]}
      links={[
        { source: 'src', target: 'ssr', value: 40 },
        { source: 'src', target: 'client', value: 60 },
        { source: 'client', target: 'islands', value: 35 },
        { source: 'client', target: 'cache', value: 25 },
        { source: 'ssr', target: 'cache', value: 30 },
      ]}
      height={300}
    />
  )
}

function FunnelPreview() {
  return (
    <FunnelChart
      title="Signup funnel"
      data={[
        { label: 'Visited', value: 12000 },
        { label: 'Signed up', value: 5400 },
        { label: 'Activated', value: 2600 },
        { label: 'Subscribed', value: 980 },
        { label: 'Retained', value: 640 },
      ]}
      height={280}
    />
  )
}

function CandlestickPreview() {
  return (
    <CandlestickChart
      title="Weekly close"
      data={[
        { date: 'W1', open: 120, high: 148, low: 112, close: 140 },
        { date: 'W2', open: 140, high: 152, low: 128, close: 132 },
        { date: 'W3', open: 132, high: 168, low: 130, close: 162 },
        { date: 'W4', open: 162, high: 174, low: 150, close: 156 },
        { date: 'W5', open: 156, high: 182, low: 152, close: 178 },
      ]}
      height={280}
    />
  )
}

function WaterfallPreview() {
  return (
    <WaterfallChart
      title="Revenue bridge"
      data={[
        { label: 'Start', value: 2400, total: true },
        { label: 'New', value: 820 },
        { label: 'Expansion', value: 460 },
        { label: 'Churn', value: -380 },
        { label: 'Downgrade', value: -140 },
        { label: 'End', value: 3160, total: true },
      ]}
      height={280}
    />
  )
}

function HistogramPreview() {
  return (
    <HistogramChart
      title="Build duration"
      values={Array.from({ length: 240 }, (_, index) => 20 + ((index * 37) % 90))}
      bins={14}
      height={280}
      valueFormat={(value) => `${Math.round(value)}s`}
    />
  )
}

function RadialBarPreview() {
  return (
    <RadialBarChart
      title="Quota use"
      data={[
        { label: 'Builds', value: 82 },
        { label: 'Storage', value: 64 },
        { label: 'Bandwidth', value: 48 },
        { label: 'Seats', value: 91 },
      ]}
      max={100}
      height={300}
    />
  )
}

function BulletPreview() {
  return (
    <BulletChart
      title="Service levels"
      data={[
        { label: 'Availability', value: 99.96, target: 99.9, max: 100, ranges: [99, 99.9, 100] },
        { label: 'p95 latency', value: 184, target: 200, max: 400, ranges: [150, 250, 400] },
        { label: 'Error rate', value: 0.4, target: 0.5, max: 2, ranges: [0.5, 1, 2] },
      ]}
      height={240}
    />
  )
}

export const chartPreviews = {
  'bar-chart': BarChartPreview,
  'line-chart': LineChartPreview,
  'donut-chart': DonutChartPreview,
  'scatter-chart': ScatterChartPreview,
  heatmap: HeatmapPreview,
  sparkline: SparklinePreview,
  gauge: GaugePreview,
  'radar-chart': RadarChartPreview,
  'treemap-chart': TreemapPreview,
  'sankey-chart': SankeyPreview,
  'funnel-chart': FunnelPreview,
  'candlestick-chart': CandlestickPreview,
  'waterfall-chart': WaterfallPreview,
  'histogram-chart': HistogramPreview,
  'radial-bar-chart': RadialBarPreview,
  'bullet-chart': BulletPreview,
} satisfies Record<string, () => unknown>
