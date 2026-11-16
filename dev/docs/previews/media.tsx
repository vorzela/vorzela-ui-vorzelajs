import { signal } from '@vorzelajs/core'
import { Carousel } from '~/components/ui/carousel.tsx'
import { ImageCropper } from '~/components/ui/image-cropper.tsx'
import { Marquee } from '~/components/ui/marquee.tsx'
import { OptimizedImage } from '~/components/ui/optimized-image.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Sparkles } from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

function CarouselPreview() {
  return (
    <Carousel
      label="Component screenshots"
      loop
      slides={[
        { id: 'one', alt: 'Blue gradient', content: <img src="/preview/signals.svg" alt="Signals" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
        { id: 'two', alt: 'Green gradient', content: <img src="/preview/bindings.svg" alt="Bindings" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
        { id: 'three', alt: 'Violet gradient', content: <img src="/preview/ownership.svg" alt="Ownership" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} /> },
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
        src="/preview/wide.svg"
        alt="A dark gradient placeholder"
        width={960}
        height={540}
        aspectRatio="16 / 9"
        autoDetectSources={false}
        priority
      />
      <OptimizedImage
        src="/preview/portrait.svg"
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
        src="/preview/crop.svg"
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
