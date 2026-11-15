/**
 * WEB ONLY — browser Image / picture / HEAD fetch.
 *
 * OptimizedImage with a muted skeleton/fallback. LRU caches are module-scoped
 * and size-capped; clearOptimizedImageCache() for logout / tenant switch.
 */
import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { isSafeSrcset } from '@vorzelajs/dom/url'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { safeHref } from '../../lib/security.ts'
import type { CSSProperties, ImgHTMLAttributes, ReactNode } from '../../types.ts'
import { ImageOff } from './icons.tsx'
import styles from './optimized-image.module.scss'

// ── Caches ────────────────────────────────────────────────────────────────────

export interface OptimizedImageSource {
  srcSet: string
  type?: string
  media?: string
  sizes?: string
}

export type AutoDetectFormat = 'avif' | 'webp'
export type CacheVersion = number | string

const CACHE_LIMITS = {
  loadedImages: 400,
  pendingRequests: 150,
  assetExistenceChecks: 800,
  discoveredSources: 300,
} as const

const loadedImageCache = new Set<string>()
const pendingImageCache = new Map<string, Promise<void>>()
const assetExistenceCache = new Map<string, Promise<boolean>>()
const discoveredSourceCache = new Map<string, Promise<OptimizedImageSource[]>>()
const RASTER_EXTENSIONS = new Set(['avif', 'jpeg', 'jpg', 'png', 'webp'])
export const AUTO_DETECT_FORMATS: AutoDetectFormat[] = ['avif', 'webp']

function trimSetCache(cache: Set<string>, max: number): void {
  while (cache.size > max) {
    const key = cache.values().next().value as string | undefined
    if (key === undefined) return
    cache.delete(key)
  }
}

function trimMapCache<K, V>(cache: Map<K, V>, max: number): void {
  while (cache.size > max) {
    const key = cache.keys().next().value as K | undefined
    if (key === undefined) return
    cache.delete(key)
  }
}

function lruGet<K, V>(cache: Map<K, V>, key: K): V | undefined {
  const value = cache.get(key)
  if (value === undefined) return undefined
  cache.delete(key)
  cache.set(key, value)
  return value
}

function lruSet<K, V>(cache: Map<K, V>, key: K, value: V, max: number): void {
  cache.delete(key)
  cache.set(key, value)
  trimMapCache(cache, max)
}

export function hasLoadedImage(key: string): boolean {
  if (!loadedImageCache.has(key)) return false
  loadedImageCache.delete(key)
  loadedImageCache.add(key)
  return true
}

export function rememberLoadedImage(key: string): void {
  loadedImageCache.delete(key)
  loadedImageCache.add(key)
  trimSetCache(loadedImageCache, CACHE_LIMITS.loadedImages)
}

export function withCacheVersion(url: string, version?: CacheVersion): string {
  if (version === undefined || version === null || version === '') return url
  const [noHash, hash = ''] = url.split('#', 2)
  const [path, query = ''] = noHash.split('?', 2)
  const params = new URLSearchParams(query)
  params.set('__imgv', String(version))
  return `${path}?${params}${hash ? `#${hash}` : ''}`
}

export function withCacheVersionInSrcSet(
  srcSet: string,
  version?: CacheVersion,
): string {
  if (!srcSet || version === undefined || version === null || version === '') {
    return srcSet
  }
  return srcSet
    .split(',')
    .map((candidate) => {
      const trimmed = candidate.trim()
      if (!trimmed) return ''
      const [url, ...descriptor] = trimmed.split(/\s+/)
      return [withCacheVersion(url ?? '', version), ...descriptor].join(' ')
    })
    .filter(Boolean)
    .join(', ')
}

function normalizeDetectionUrl(src: string): URL | undefined {
  if (typeof window === 'undefined' || !src) return undefined
  if (src.startsWith('data:') || src.startsWith('blob:')) return undefined
  try {
    const url = new URL(src, window.location.origin)
    if (url.origin !== window.location.origin) return undefined
    return url
  } catch {
    return undefined
  }
}

function getBaseImageParts(src: string): {
  basePath: string
  search: string
  hash: string
} | undefined {
  const url = normalizeDetectionUrl(src)
  if (!url) return undefined
  const lastDot = url.pathname.lastIndexOf('.')
  const lastSlash = url.pathname.lastIndexOf('/')
  if (lastDot <= lastSlash) return undefined
  const extension = url.pathname.slice(lastDot + 1).toLowerCase()
  if (!RASTER_EXTENSIONS.has(extension)) return undefined
  return {
    basePath: url.pathname.slice(0, lastDot),
    search: url.search,
    hash: url.hash,
  }
}

function buildVariantUrl(
  src: string,
  format: string,
  width?: number,
  version?: CacheVersion,
): string | undefined {
  const parts = getBaseImageParts(src)
  if (!parts) return undefined
  const widthSuffix = width ? `-${width}` : ''
  return withCacheVersion(
    `${parts.basePath}${widthSuffix}.${format}${parts.search}${parts.hash}`,
    version,
  )
}

export function getDetectedSourceCacheKey(
  src: string,
  formats: AutoDetectFormat[],
  responsiveWidths: number[],
  sizes?: string,
  version?: CacheVersion,
): string {
  return JSON.stringify({
    src,
    formats,
    responsiveWidths,
    sizes: sizes ?? '',
    cacheVersion: version ?? '',
  })
}

function checkAssetExists(url: string): Promise<boolean> {
  const cached = lruGet(assetExistenceCache, url)
  if (cached) return cached
  const promise = fetch(url, { method: 'HEAD', credentials: 'omit' })
    .then((response) => response.ok)
    .catch(() => false)
  lruSet(assetExistenceCache, url, promise, CACHE_LIMITS.assetExistenceChecks)
  return promise
}

export async function detectAutoSources(
  src: string,
  formats: AutoDetectFormat[],
  responsiveWidths: number[],
  sizes?: string,
  version?: CacheVersion,
): Promise<OptimizedImageSource[]> {
  if (typeof window === 'undefined') return []
  if (!getBaseImageParts(src)) return []
  const key = getDetectedSourceCacheKey(src, formats, responsiveWidths, sizes, version)
  const cached = lruGet(discoveredSourceCache, key)
  if (cached) return cached

  const detection = (async () => {
    const sources: OptimizedImageSource[] = []
    for (const format of formats) {
      if (responsiveWidths.length > 0) {
        const candidates = await Promise.all(
          responsiveWidths.map(async (width) => {
            const url = buildVariantUrl(src, format, width, version)
            if (!url) return undefined
            return (await checkAssetExists(url)) ? `${url} ${width}w` : undefined
          }),
        )
        const srcSet = candidates.filter(Boolean).join(', ')
        if (srcSet) {
          sources.push({ srcSet, type: `image/${format}`, sizes })
          continue
        }
      }
      const url = buildVariantUrl(src, format, undefined, version)
      if (url && (await checkAssetExists(url))) {
        sources.push({ srcSet: url, type: `image/${format}`, sizes })
      }
    }
    return sources
  })().catch((error) => {
    discoveredSourceCache.delete(key)
    throw error
  })

  lruSet(discoveredSourceCache, key, detection, CACHE_LIMITS.discoveredSources)
  return detection
}

export function clearOptimizedImageCache(
  match?: string | RegExp | ((key: string) => boolean),
): void {
  const test =
    typeof match === 'function'
      ? match
      : match instanceof RegExp
        ? (key: string) => match.test(key)
        : typeof match === 'string'
          ? (key: string) => key.includes(match)
          : () => true

  for (const key of Array.from(loadedImageCache)) if (test(key)) loadedImageCache.delete(key)
  for (const key of Array.from(pendingImageCache.keys())) if (test(key)) pendingImageCache.delete(key)
  for (const key of Array.from(assetExistenceCache.keys())) if (test(key)) assetExistenceCache.delete(key)
  for (const key of Array.from(discoveredSourceCache.keys())) if (test(key)) discoveredSourceCache.delete(key)
}

export function getImageCacheKey(
  src: string,
  srcSet?: string,
  sizes?: string,
): string {
  return `${src}::${srcSet ?? ''}::${sizes ?? ''}`
}

export function preloadImage(
  src: string,
  srcSet?: string,
  sizes?: string,
): Promise<void> {
  if (typeof window === 'undefined' || !src) return Promise.resolve()
  const key = getImageCacheKey(src, srcSet, sizes)
  if (hasLoadedImage(key)) return Promise.resolve()
  const pending = lruGet(pendingImageCache, key)
  if (pending) return pending

  const promise = new Promise<void>((resolve, reject) => {
    let done = false
    const safeSource = safeHref(src, {
      allowBlob: true,
      allowDataImage: true,
    })
    if (!safeSource) {
      resolve()
      return
    }
    const image = new window.Image()
    const success = (): void => {
      if (done) return
      done = true
      rememberLoadedImage(key)
      pendingImageCache.delete(key)
      resolve()
    }
    const failure = (): void => {
      if (done) return
      done = true
      pendingImageCache.delete(key)
      reject(new Error(`Failed to preload: ${src}`))
    }
    image.addEventListener('load', success)
    image.addEventListener('error', failure)
    if (srcSet) {
      if (isSafeSrcset(srcSet)) image.srcset = srcSet
    }
    if (sizes) image.sizes = sizes
    image.decoding = 'async'
    image.src = safeSource
    if (image.complete && image.naturalWidth > 0) success()
  })
  lruSet(pendingImageCache, key, promise, CACHE_LIMITS.pendingRequests)
  return promise
}

// ── Presentation ─────────────────────────────────────────────────────────────

type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'

const FIT_CLASS: Record<ImageFit, string> = {
  contain: styles.fitContain,
  cover: styles.fitCover,
  fill: styles.fitFill,
  none: styles.fitNone,
  'scale-down': styles.fitScaleDown,
}

export interface OptimizedImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'alt' | 'className' | 'decoding' | 'height' | 'onError' | 'onLoad' | 'src' | 'style' | 'width'
  > {
  src: string | (() => string)
  alt: string
  width?: number
  height?: number
  aspectRatio?: string
  srcSet?: string
  sizes?: string
  sources?: OptimizedImageSource[] | (() => OptimizedImageSource[])
  priority?: boolean
  autoDetectSources?: boolean
  autoDetectFormats?: AutoDetectFormat[]
  responsiveWidths?: number[]
  cacheVersion?: CacheVersion
  loadingStrategy?: 'eager' | 'lazy'
  decodingStrategy?: 'async' | 'auto' | 'sync'
  fetchPriority?: 'auto' | 'high' | 'low'
  fallbackSrc?: string
  fallback?: ReactNode
  showSkeleton?: boolean
  fit?: ImageFit
  className?: string
  style?: CSSProperties
  imageClassName?: string
  imageStyle?: CSSProperties
  skeletonClassName?: string
  fallbackClassName?: string
  onLoad?: (image: HTMLImageElement) => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  srcSet: srcSetProp,
  sizes,
  sources: sourcesProp,
  priority,
  autoDetectSources,
  autoDetectFormats,
  responsiveWidths,
  cacheVersion,
  loadingStrategy,
  decodingStrategy,
  fetchPriority,
  fallbackSrc,
  fallback,
  showSkeleton = true,
  fit = 'cover',
  className,
  style,
  imageClassName,
  imageStyle,
  skeletonClassName,
  fallbackClassName,
  onLoad: onLoadProp,
  onError: onErrorProp,
  ...imgAttrs
}: OptimizedImageProps) {
  const srcValue = accessorOf(src)
  const resolvedSrc = (): string => withCacheVersion(srcValue(), cacheVersion)
  const resolvedFallbackSrc = (): string | undefined =>
    fallbackSrc ? withCacheVersion(fallbackSrc, cacheVersion) : undefined
  const resolvedSrcSet = srcSetProp
    ? withCacheVersionInSrcSet(srcSetProp, cacheVersion)
    : undefined
  const sourcesValue = accessorOf(sourcesProp ?? [])
  const resolvedSources = (): OptimizedImageSource[] =>
    sourcesValue().map((source) => ({
      ...source,
      srcSet: withCacheVersionInSrcSet(source.srcSet, cacheVersion),
    }))

  const [detectedSources, setDetectedSources] = signal<OptimizedImageSource[]>([])
  const [activeSrc, setActiveSrc] = signal(resolvedSrc())
  const [loaded, setLoaded] = signal(
    hasLoadedImage(getImageCacheKey(resolvedSrc(), resolvedSrcSet, sizes)),
  )
  const [failed, setFailed] = signal(false)
  const [usingFallbackSrc, setUsingFallbackSrc] = signal(false)

  let previousSignature: string | undefined
  let cancelledReset = false

  effect(() => {
    cancelledReset = false
    const currentSrc = srcValue()
    const signature = `${currentSrc}::${cacheVersion ?? ''}`
    if (previousSignature && previousSignature !== signature) {
      clearOptimizedImageCache(currentSrc)
    }
    previousSignature = signature

    const key = getImageCacheKey(resolvedSrc(), resolvedSrcSet, sizes)
    const alreadyLoaded = hasLoadedImage(key)
    setActiveSrc(resolvedSrc())
    setLoaded(alreadyLoaded)
    setFailed(false)
    setUsingFallbackSrc(false)

    if (!alreadyLoaded && priority) {
      preloadImage(resolvedSrc(), resolvedSrcSet, sizes)
        .then(() => {
          if (cancelledReset) return
          setLoaded(true)
          setFailed(false)
        })
        .catch(() => undefined)
    }
    onCleanup(() => {
      cancelledReset = true
    })
  })

  effect(() => {
    const configuredSources = resolvedSources()
    if (configuredSources.length || !autoDetectSources) {
      setDetectedSources([])
      return
    }
    let cancelled = false
    const formats = (
      autoDetectFormats?.length
        ? [...new Set(autoDetectFormats)]
        : AUTO_DETECT_FORMATS
    ) as AutoDetectFormat[]
    const widths = [...(responsiveWidths ?? [])].sort((a, b) => a - b)
    const currentSrc = srcValue()
    const key = getDetectedSourceCacheKey(
      currentSrc,
      formats,
      widths,
      sizes,
      cacheVersion,
    )

    detectAutoSources(currentSrc, formats, widths, sizes, cacheVersion)
      .then((detected) => {
        if (cancelled) return
        if (
          key ===
          getDetectedSourceCacheKey(
            currentSrc,
            formats,
            widths,
            sizes,
            cacheVersion,
          )
        ) {
          setDetectedSources(detected)
        }
      })
      .catch(() => {
        if (cancelled) return
        setDetectedSources([])
      })
    onCleanup(() => {
      cancelled = true
    })
  })

  const discoveredSources = (): OptimizedImageSource[] => {
    const configured = resolvedSources()
    return configured.length ? configured : detectedSources()
  }
  const ratio = aspectRatio ?? (width && height ? `${width} / ${height}` : undefined)

  const mediaStyle = (): CSSProperties => ({
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...style,
    ...imageStyle,
  })

  const fitClass = FIT_CLASS[fit]
  const shouldShowSkeleton = (): boolean =>
    showSkeleton && !loaded() && !failed()
  const shouldUsePicture = (): boolean =>
    !usingFallbackSrc() && Boolean(discoveredSources().length)

  const activeCacheKey = (): string =>
    getImageCacheKey(
      activeSrc(),
      usingFallbackSrc() ? undefined : resolvedSrcSet,
      usingFallbackSrc() ? undefined : sizes,
    )

  function syncLoaded(image?: HTMLImageElement | null): void {
    if (!image || failed()) return
    if (image.complete && image.naturalWidth > 0) {
      rememberLoadedImage(activeCacheKey())
      setLoaded(true)
      setFailed(false)
    }
  }

  function handleLoad(event: Event): void {
    const image = event.currentTarget as HTMLImageElement
    const finalize = (): void => {
      rememberLoadedImage(activeCacheKey())
      setLoaded(true)
      setFailed(false)
      onLoadProp?.(image)
    }
    const decode = image.decode?.()
    if (decode) {
      decode.catch(() => undefined).finally(finalize)
    } else {
      finalize()
    }
  }

  function handleError(): void {
    onErrorProp?.()
    if (
      !usingFallbackSrc() &&
      resolvedFallbackSrc() &&
      resolvedFallbackSrc() !== activeSrc()
    ) {
      setUsingFallbackSrc(true)
      setActiveSrc(resolvedFallbackSrc() as string)
      setLoaded(hasLoadedImage(getImageCacheKey(resolvedFallbackSrc() as string)))
      setFailed(false)
      return
    }
    setFailed(true)
  }

  const imgNode = (
    <img
      {...imgAttrs}
      ref={(element) => syncLoaded(element as HTMLImageElement)}
      src={() => activeSrc()}
      alt={alt}
      width={width}
      height={height}
      srcSet={() => (usingFallbackSrc() ? undefined : resolvedSrcSet)}
      sizes={() => (usingFallbackSrc() ? undefined : sizes)}
      loading={priority ? 'eager' : (loadingStrategy ?? 'lazy')}
      decoding={priority ? 'sync' : (decodingStrategy ?? 'async')}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
      onLoad={handleLoad}
      onError={handleError}
      className={() =>
        cx(
          styles.image,
          fitClass,
          shouldShowSkeleton() && styles.skeleton,
          shouldShowSkeleton() && skeletonClassName,
          className,
          imageClassName,
        )
      }
      style={mediaStyle}
    />
  )

  return (
    <Show
      when={() => !failed()}
      fallback={() => {
        if (fallback) {
          return (
            <span
              className={cx(styles.fallback, className, fallbackClassName)}
              style={mediaStyle()}
            >
              {fallback}
            </span>
          )
        }
        if (alt === '') return null
        return (
          <span
            role="img"
            aria-label={alt}
            className={cx(
              styles.fallback,
              styles.fallbackPlaceholder,
              className,
              fallbackClassName,
            )}
            style={mediaStyle()}
          >
            <ImageOff aria-hidden size={20} />
          </span>
        )
      }}
    >
      {() => (
        <Show when={shouldUsePicture} fallback={imgNode}>
          {() => (
            <picture>
              <For each={discoveredSources} key={(source) => source.srcSet}>
                {(source) => (
                  <source
                    srcSet={source.srcSet}
                    type={source.type}
                    media={source.media}
                    sizes={source.sizes}
                  />
                )}
              </For>
              {imgNode}
            </picture>
          )}
        </Show>
      )}
    </Show>
  )
}
