import { computed, effect, onCleanup, signal } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { safeHref } from '../../lib/security.ts'
import type { CSSProperties } from '../../types.ts'
import { Button } from './button.tsx'
import { Crop, RotateCcw } from './icons.tsx'
import styles from './image-cropper.module.scss'

export type CropShape = 'rect' | 'round'
export type CropOutputFormat = 'original' | 'image/png' | 'image/jpeg' | 'image/webp'

export type CropResult = {
  blob: Blob
  dataUrl: string
  file: File
  width: number
  height: number
}

export interface ImageCropperProps {
  /** Image URL, data URL or blob URL. Accepts a signal accessor. */
  src: string | (() => string)
  /** Used to preserve the image type for `outputFormat="original"`. */
  fileName?: string
  /** Width / height. Defaults to 1 (square). */
  aspectRatio?: number
  cropShape?: CropShape
  outputFormat?: CropOutputFormat
  /** 0–1. PNG ignores it; lossy formats default to 1 (maximum quality). */
  quality?: number
  maxWidth?: number
  maxHeight?: number
  /** Compress only when the encoded blob exceeds this size. */
  targetSizeBytes?: number
  minZoom?: number
  maxZoom?: number
  title?: string
  description?: string
  applyLabel?: string
  cancelLabel?: string
  disabled?: boolean | (() => boolean)
  className?: string
  onCrop?: (result: CropResult) => void
  onCancel?: () => void
  onError?: (message: string) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function reactive<T>(value: () => T): T {
  return value as unknown as T
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'image'
}

function formatFor(
  src: string,
  fileName: string | undefined,
  format: CropOutputFormat,
): string {
  if (format !== 'original') return format
  const name = (fileName ?? src).toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.avif')) return 'image/avif'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/webp'
}

export function ImageCropper({
  src,
  fileName,
  aspectRatio = 1,
  cropShape = 'rect',
  outputFormat = 'original',
  quality = 1,
  maxWidth,
  maxHeight,
  targetSizeBytes,
  minZoom = 1,
  maxZoom = 4,
  title = 'Crop image',
  description = 'Drag to reposition, then zoom to frame the crop.',
  applyLabel = 'Apply crop',
  cancelLabel = 'Cancel',
  disabled = false,
  className,
  onCrop,
  onCancel,
  onError,
}: ImageCropperProps) {
  const isDisabled = accessorOf(disabled)
  const srcValue = accessorOf(src)
  const [stage, setStage] = signal<HTMLDivElement | null>(null)
  const [image, setImage] = signal<HTMLImageElement | null>(null)
  const [natural, setNatural] = signal({ width: 0, height: 0 })
  const [frame, setFrame] = signal({ width: 0, height: 0 })
  const [zoom, setZoom] = signal(1)
  const [offset, setOffset] = signal({ x: 0, y: 0 })
  const [busy, setBusy] = signal(false)
  const [status, setStatus] = signal('')

  type DragState = {
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null
  let dragging: DragState = null

  effect(() => {
    const source = srcValue()
    setStatus('')
    setImage(null)
    setNatural({ width: 0, height: 0 })
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    if (!source || typeof Image === 'undefined') return

    let cancelled = false
    const safeSource = safeHref(source, {
      allowBlob: true,
      allowDataImage: true,
    })
    if (!safeSource) {
      const message = 'Could not load this image.'
      setStatus(message)
      onError?.(message)
      return
    }
    const element = new Image()
    if (!source.startsWith('data:') && !source.startsWith('blob:')) {
      element.crossOrigin = 'anonymous'
    }
    const handleLoad = (): void => {
      if (cancelled) return
      setImage(element)
      setNatural({ width: element.naturalWidth, height: element.naturalHeight })
    }
    const handleError = (): void => {
      if (cancelled) return
      const message = 'Could not load this image.'
      setStatus(message)
      onError?.(message)
    }
    element.addEventListener('load', handleLoad)
    element.addEventListener('error', handleError)
    element.src = safeSource
    onCleanup(() => {
      cancelled = true
      element.removeEventListener('load', handleLoad)
      element.removeEventListener('error', handleError)
    })
  })

  effect(() => {
    const element = stage()
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setFrame({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(element)
    onCleanup(() => observer.disconnect())
  })

  effect(() => {
    const element = stage()
    if (!element) return
    const handleWheel = (event: WheelEvent): void => {
      if (isDisabled()) return
      event.preventDefault()
      setZoom((current) =>
        clamp(current * (event.deltaY < 0 ? 1.08 : 0.92), minZoom, maxZoom),
      )
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    onCleanup(() => element.removeEventListener('wheel', handleWheel))
  })

  const ratio = Math.max(0.1, aspectRatio)
  const padding = 20

  const layout = computed(() => {
    const sizes = frame()
    const naturalSize = natural()
    const currentZoom = zoom()
    const currentOffset = offset()
    const availableWidth = Math.max(1, sizes.width - padding * 2)
    const availableHeight = Math.max(1, sizes.height - padding * 2)
    const cropWidth = Math.min(availableWidth, availableHeight * ratio)
    const cropHeight = cropWidth / ratio
    const baseScale =
      naturalSize.width > 0 && cropWidth > 0
        ? Math.max(cropWidth / naturalSize.width, cropHeight / naturalSize.height)
        : 1
    const scale = baseScale * currentZoom
    const imageWidth = naturalSize.width * scale
    const imageHeight = naturalSize.height * scale
    const maxX = Math.max(0, (imageWidth - cropWidth) / 2)
    const maxY = Math.max(0, (imageHeight - cropHeight) / 2)
    const safeOffset = {
      x: clamp(currentOffset.x, -maxX, maxX),
      y: clamp(currentOffset.y, -maxY, maxY),
    }
    return {
      cropWidth,
      cropHeight,
      scale,
      imageWidth,
      imageHeight,
      maxX,
      maxY,
      safeOffset,
      imageLeft: (sizes.width - imageWidth) / 2 + safeOffset.x,
      imageTop: (sizes.height - imageHeight) / 2 + safeOffset.y,
      cropLeft: (sizes.width - cropWidth) / 2,
      cropTop: (sizes.height - cropHeight) / 2,
    }
  })

  const canCrop = (): boolean =>
    Boolean(image() && natural().width && frame().width && !isDisabled() && !busy())

  const hint = (): string =>
    [
      `${Math.round(natural().width)} × ${Math.round(natural().height)} source`,
      targetSizeBytes ? `target ${formatBytes(targetSizeBytes)}` : null,
      outputFormat === 'image/png'
        ? 'lossless PNG'
        : `${Math.round(quality * 100)}% quality`,
    ]
      .filter(Boolean)
      .join(' · ')

  const onPointerDown = (event: PointerEvent): void => {
    if (!canCrop()) return
    const target = event.currentTarget as HTMLDivElement
    target.setPointerCapture(event.pointerId)
    dragging = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: layout().safeOffset.x,
      originY: layout().safeOffset.y,
    }
  }

  const onPointerMove = (event: PointerEvent): void => {
    const current = dragging
    if (!current || current.pointerId !== event.pointerId) return
    const currentLayout = layout()
    setOffset({
      x: clamp(
        current.originX + event.clientX - current.startX,
        -currentLayout.maxX,
        currentLayout.maxX,
      ),
      y: clamp(
        current.originY + event.clientY - current.startY,
        -currentLayout.maxY,
        currentLayout.maxY,
      ),
    })
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (dragging?.pointerId === event.pointerId) dragging = null
  }

  const apply = async (): Promise<void> => {
    const sourceImage = image()
    if (!canCrop() || !sourceImage || typeof document === 'undefined') return
    setBusy(true)
    setStatus('')

    try {
      const current = layout()
      const sourceX = clamp(
        (current.cropLeft - current.imageLeft) / current.scale,
        0,
        natural().width,
      )
      const sourceY = clamp(
        (current.cropTop - current.imageTop) / current.scale,
        0,
        natural().height,
      )
      const sourceWidth = clamp(
        current.cropWidth / current.scale,
        1,
        natural().width - sourceX,
      )
      const sourceHeight = clamp(
        current.cropHeight / current.scale,
        1,
        natural().height - sourceY,
      )

      let width = sourceWidth
      let height = sourceHeight
      if (maxWidth != null && width > maxWidth) {
        width = maxWidth
        height = width / ratio
      }
      if (maxHeight != null && height > maxHeight) {
        height = maxHeight
        width = height * ratio
      }
      width = Math.max(1, Math.round(width))
      height = Math.max(1, Math.round(height))

      const mime = formatFor(srcValue(), fileName, outputFormat)
      const initialQuality = mime === 'image/png' ? undefined : clamp(quality, 0.1, 1)
      const canvas = document.createElement('canvas')

      const render = (w: number, h: number, q: number | undefined): Promise<Blob> =>
        new Promise<Blob>((resolve, reject) => {
          canvas.width = w
          canvas.height = h
          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Canvas is not available.'))
            return
          }
          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = 'high'
          context.drawImage(
            sourceImage,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            w,
            h,
          )
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Could not encode the cropped image.'))
            },
            mime,
            q,
          )
        })

      let blob = await render(width, height, initialQuality)

      if (targetSizeBytes != null && blob.size > targetSizeBytes) {
        if (mime !== 'image/png') {
          let nextQuality = initialQuality ?? 0.92
          while (blob.size > targetSizeBytes && nextQuality > 0.35) {
            nextQuality = Math.max(0.35, nextQuality - 0.12)
            blob = await render(width, height, nextQuality)
          }
        }
        let scaleFactor = 0.9
        while (blob.size > targetSizeBytes && scaleFactor >= 0.3) {
          width = Math.max(1, Math.round(width * scaleFactor))
          height = Math.max(1, Math.round(height * scaleFactor))
          blob = await render(
            width,
            height,
            mime === 'image/png' ? undefined : (initialQuality ?? 0.92),
          )
          scaleFactor *= 0.9
        }
      }

      const dataUrl = canvas.toDataURL(
        mime,
        mime === 'image/png' ? undefined : (initialQuality ?? 0.92),
      )
      const extension = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] ?? 'webp')
      const file = new File(
        [blob],
        `cropped-${baseName(fileName ?? 'image')}.${extension}`,
        { type: mime, lastModified: Date.now() },
      )

      onCrop?.({ blob, dataUrl, file, width, height })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not crop this image.'
      setStatus(message)
      onError?.(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={cx(styles.root, className)} aria-label={title}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        <Crop aria-hidden size={18} />
      </header>

      <div className={styles.stageWrap}>
        <div
          ref={(element) => setStage(element as HTMLDivElement)}
          className={() =>
            cx(
              styles.stage,
              (isDisabled() || !image()) && styles.stageDisabled,
            )
          }
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Show
            when={() => Boolean(image()) && natural().width > 0}
            fallback={() => (
              <div className={styles.empty}>
                <Crop aria-hidden size={26} />
                <span>{status() || 'Choose an image to crop.'}</span>
              </div>
            )}
          >
            {() => (
              <>
                <img
                  src={() =>
                    safeHref(srcValue(), {
                      allowBlob: true,
                      allowDataImage: true,
                    }) ?? ''
                  }
                  alt=""
                  className={styles.image}
                  draggable="false"
                  style={(): CSSProperties => {
                    const current = layout()
                    return {
                      width: `${current.imageWidth}px`,
                      height: `${current.imageHeight}px`,
                      left: `${current.imageLeft}px`,
                      top: `${current.imageTop}px`,
                    }
                  }}
                />
                <div
                  className={() =>
                    cx(
                      styles.crop,
                      cropShape === 'round' && styles.cropRound,
                    )
                  }
                  style={(): CSSProperties => {
                    const current = layout()
                    return {
                      left: `${current.cropLeft}px`,
                      top: `${current.cropTop}px`,
                      width: `${current.cropWidth}px`,
                      height: `${current.cropHeight}px`,
                    }
                  }}
                >
                  <div className={styles.grid} />
                </div>
              </>
            )}
          </Show>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.zoom}>
          <span className={styles.zoomLabel}>Zoom</span>
          <input
            className={styles.range}
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={zoom}
            disabled={reactive(() => isDisabled() || !image())}
            aria-label="Zoom"
            onInput={(event) => {
              const target = event.currentTarget as HTMLInputElement
              setZoom(Number(target.value))
            }}
          />
          <span className={styles.zoomLabel}>{() => `${zoom().toFixed(2)}×`}</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={reactive(() => isDisabled() || !image())}
          onClick={() => {
            setZoom(1)
            setOffset({ x: 0, y: 0 })
          }}
        >
          <RotateCcw aria-hidden size={14} />
          Reset
        </Button>
      </div>

      <p className={styles.hint}>{hint}</p>

      <Show when={() => Boolean(status()) && Boolean(image())}>
        <p className={styles.status}>{status}</p>
      </Show>

      <div className={styles.actions}>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={reactive(() => busy())}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => void apply()}
          disabled={reactive(() => !canCrop())}
        >
          {() => (busy() ? 'Cropping…' : applyLabel)}
        </Button>
      </div>
    </section>
  )
}
