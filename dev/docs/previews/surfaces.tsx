import { AspectRatio } from '~/components/ui/aspect-ratio.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { BentoGrid, BentoItem } from '~/components/ui/bento-grid.tsx'
import { Button } from '~/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card.tsx'
import { GlassPanel } from '~/components/ui/glass-panel.tsx'
import { Layer } from '~/components/ui/layer.tsx'
import { MasonryGrid, MasonryTile } from '~/components/ui/masonry-grid.tsx'
import { NumberTicker } from '~/components/ui/number-ticker.tsx'
import { Overlay } from '~/components/ui/overlay.tsx'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { Separator } from '~/components/ui/separator.tsx'
import { Watermark } from '~/components/ui/watermark.tsx'
import styles from '../docs.module.scss'

function CardPreview() {
  return (
    <div class={styles.demoRow}>
      <Card padded style={{ 'max-width': '20rem' }}>
        <CardHeader>
          <CardTitle>Release notes</CardTitle>
          <CardDescription>v0.2.0 · 5 Nov 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <p class={styles.cardText}>
            Direct DOM bindings, source-owned components and a smaller runtime.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Read more</Button>
        </CardFooter>
      </Card>
      <Card flat padded interactive style={{ 'max-width': '16rem' }}>
        <CardTitle>Interactive</CardTitle>
        <p class={styles.cardText}>Hover to see the lift.</p>
      </Card>
    </div>
  )
}

function GlassPanelPreview() {
  return (
    <div
      style={{
        padding: '1.5rem',
        'border-radius': 'var(--radius-xl)',
        background:
          'linear-gradient(135deg, hsl(var(--primary) / 0.28), hsl(var(--success) / 0.16))',
      }}
    >
      <GlassPanel style={{ padding: '1.25rem' }}>
        <p class={styles.cardTitle}>Glass surface</p>
        <p class={styles.cardText}>
          Translucent card with a backdrop blur. Falls back to an opaque surface
          when the filter is unavailable.
        </p>
      </GlassPanel>
    </div>
  )
}

function AspectRatioPreview() {
  return (
    <AspectRatio ratio={16 / 9}>
      <div class={styles.swatch}>
        <div class={styles.swatchLabel}>16 : 9 media</div>
      </div>
    </AspectRatio>
  )
}

function BentoPreview() {
  return (
    <BentoGrid>
      <BentoItem colSpan={2} rowSpan={2}>
        <h3 class={styles.cardTitle}>Release velocity</h3>
        <p class={styles.statValue}>
          <NumberTicker value={128} suffix=" builds" />
        </p>
        <p class={styles.cardText}>Across 14 projects this month.</p>
      </BentoItem>
      <BentoItem>
        <h3 class={styles.cardTitle}>Uptime</h3>
        <p class={styles.statValue}>99.98%</p>
      </BentoItem>
      <BentoItem>
        <h3 class={styles.cardTitle}>Members</h3>
        <p class={styles.statValue}>
          <NumberTicker value={2481} />
        </p>
      </BentoItem>
    </BentoGrid>
  )
}

function MasonryPreview() {
  return (
    <MasonryGrid columns={3} gap={12} maxHeight={360} scrollable aria-label="Gallery">
      {[
        { title: 'Tokens', meta: 'Primitives', ratio: 4 / 3 },
        { title: 'Buttons', meta: 'Actions', ratio: 1 },
        { title: 'Charts', meta: 'D3', ratio: 16 / 9 },
        { title: 'Tables', meta: 'Data', ratio: 3 / 2 },
        { title: 'Forms', meta: 'Fields', ratio: 1 },
        { title: 'Overlays', meta: 'Layers', ratio: 4 / 5 },
      ].map((item) => (
        <MasonryTile
          title={item.title}
          meta={item.meta}
          imageAspectRatio={item.ratio}
        >
          <div class={styles.swatch} style={{ 'min-height': '4rem' }} />
        </MasonryTile>
      ))}
    </MasonryGrid>
  )
}

function SeparatorPreview() {
  return (
    <div class={styles.demoStack}>
      <p class={styles.cardText}>Above the rule</p>
      <Separator />
      <p class={styles.cardText}>Below the rule</p>
      <div class={styles.demoRow} style={{ height: '3rem' }}>
        <span class={styles.cardText}>Left</span>
        <Separator orientation="vertical" />
        <span class={styles.cardText}>Right</span>
      </div>
      <Separator label="or" />
    </div>
  )
}

function ScrollAreaPreview() {
  return (
    <ScrollArea height="12rem" aria-label="Scrollable list" fade>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {Array.from({ length: 24 }, (_, index) => (
          <div
            key={index}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              'border-radius': 'var(--radius-md)',
            }}
          >
            Row {index + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function ResizablePreview() {
  return (
    <ResizablePanelGroup direction="horizontal" style={{ height: '12rem' }}>
      {() => (
        <>
          <ResizablePanel defaultSize={2} minSize={20}>
            <div class={styles.swatch}>
              <div class={styles.swatchLabel}>Sidebar</div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={3}>
            <div class={styles.swatch} style={{ background: 'hsl(var(--muted))' }}>
              <div class={styles.swatchLabel}>Canvas</div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

function LayerPreview() {
  return (
    <div
      style={{
        position: 'relative',
        height: '10rem',
        overflow: 'hidden',
        border: '1px dashed var(--border)',
        'border-radius': 'var(--radius-lg)',
      }}
    >
      <Layer portal={false} className={styles.demoBody}>
        <Badge variant="soft">Layer</Badge>
        <p class={styles.cardText}>
          A positioning layer. With `portal` it mounts on `document.body`.
        </p>
      </Layer>
    </div>
  )
}

function OverlayPreview() {
  return (
    <div
      style={{
        position: 'relative',
        height: '9rem',
        overflow: 'hidden',
        'border-radius': 'var(--radius-lg)',
        background: 'hsl(var(--muted))',
      }}
    >
      <Overlay style={{ position: 'absolute' }} />
      <div style={{ position: 'relative', padding: '1rem' }}>
        <p class={styles.cardTitle}>Dialog backdrop</p>
        <p class={styles.cardText}>Dimmed surface behind dialogs and sheets.</p>
      </div>
    </div>
  )
}

function WatermarkPreview() {
  return (
    <div style={{ 'min-height': '10rem' }}>
      <Watermark content="VorzelaJS · Preview">
        <div class={styles.demoBody}>
          <p class={styles.cardTitle}>Watermarked surface</p>
          <p class={styles.cardText}>
            A repeated SVG watermark sits above arbitrary content.
          </p>
        </div>
      </Watermark>
    </div>
  )
}

export const surfacesPreviews = {
  card: CardPreview,
  'glass-panel': GlassPanelPreview,
  'aspect-ratio': AspectRatioPreview,
  'bento-grid': BentoPreview,
  'masonry-grid': MasonryPreview,
  separator: SeparatorPreview,
  'scroll-area': ScrollAreaPreview,
  resizable: ResizablePreview,
  layer: LayerPreview,
  overlay: OverlayPreview,
  watermark: WatermarkPreview,
} satisfies Record<string, () => unknown>
