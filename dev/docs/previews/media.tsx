import { signal } from '@vorzelajs/core'
import { Carousel } from '~/components/ui/carousel.tsx'
import { ImageCropper } from '~/components/ui/image-cropper.tsx'
import { Marquee } from '~/components/ui/marquee.tsx'
import { OptimizedImage } from '~/components/ui/optimized-image.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Sparkles } from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

const svg = (from: string, to: string, label: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><text x="480" y="285" font-family="system-ui, sans-serif" font-size="42" fill="white" text-anchor="middle">${label}</text></svg>`,
  )}`

function CarouselPreview() {
  return (
    <Carousel
      label="Component screenshots"
      loop
      slides={[
        { id: 'one', alt: 'Blue gradient', content: <img src={svg('#1d4ed8', '#0ea5e9', 'Signals')} alt="Signals" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
        { id: 'two', alt: 'Green gradient', content: <img src={svg('#047857', '#84cc16', 'Bindings')} alt="Bindings" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
        { id: 'three', alt: 'Violet gradient', content: <img src={svg('#6d28d9', '#ec4899', 'Ownership')} alt="Ownership" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
      ]}
    />
  )
}

function MarqueePreview() {
  return (
    <div class={styles.demoStack}>
      <Marquee speed={22}>
        <div class={styles.marqueeRow}>
          {['Signals', 'No virtual DOM', 'Owned effects', 'Source-owned', 'SSR islands', 'Escaped by default'].map((item) => (
            <Badge key={item} variant="soft">
              {item}
            </Badge>
          ))}
        </div>
      </Marquee>
      <Marquee speed={28} reverse pauseOnHover>
        <div class={styles.marqueeRow}>
          {['button', 'card', 'table', 'chart', 'dialog', 'sidebar'].map((item) => (
            <span key={item} class={styles.marqueeItem}>
              <Sparkles aria-hidden /> {item}
            </span>
          ))}
        </div>
      </Marquee>
    </div>
  )
}

function OptimizedImagePreview() {
  return (
    <div style={{ display: 'grid', gap: '1rem', 'grid-template-columns': 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
      <OptimizedImage
        src={svg('#0f172a', '#334155', '16 : 9')}
        alt="A dark gradient placeholder"
        width={960}
        height={540}
        aspectRatio="16 / 9"
        autoDetectSources={false}
        priority
      />
      <OptimizedImage
        src={svg('#7c3aed', '#f59e0b', '4 : 3')}
        alt="A violet and amber gradient"
        width={800}
        height={600}
        aspectRatio="4 / 3"
        autoDetectSources={false}
        showSkeleton
        fit="cover"
      />
    </div>
  )
}

function ImageCropperPreview() {
  const [last, setLast] = signal('No crop yet')
  return (
    <div class={styles.demoStack}>
      <ImageCropper
        src={svg('#1d4ed8', '#0ea5e9', 'Crop me')}
        fileName="gradient.svg"
        aspectRatio={16 / 9}
        cropShape="rect"
        onCrop={(result) => setLast(`${result.width}×${result.height}`)}
        onCancel={() => setLast('Cancelled')}
      />
      <p class={styles.cardText}>Last crop: {() => last()}</p>
    </div>
  )
}

export const mediaPreviews = {
  carousel: CarouselPreview,
  marquee: MarqueePreview,
  'optimized-image': OptimizedImagePreview,
  'image-cropper': ImageCropperPreview,
} satisfies Record<string, () => unknown>
