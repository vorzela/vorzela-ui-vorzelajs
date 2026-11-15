import { Show } from '@vorzelajs/dom'
import { accessorOf, useOnlineStatus } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import { WifiOff } from './icons.tsx'
import styles from './offline-banner.module.scss'

export function OfflineBanner({
  message = 'You are offline. Changes will sync when the connection returns.',
  className,
  /** Show the banner even when the browser reports a connection (demos). */
  force = false,
  onRetry,
}: {
  message?: string
  className?: string
  force?: boolean | (() => boolean)
  onRetry?: () => void
}) {
  const online = useOnlineStatus()
  const forced = accessorOf(force ?? false)

  return (
    <Show when={() => !online() || forced()}>
      {() => (
        <div
          role="status"
          aria-live="polite"
          className={cx(styles.root, className)}
        >
          <WifiOff className={styles.icon} aria-hidden />
          <span className={styles.message}>{message}</span>
          {onRetry ? (
            <button type="button" className={styles.retry} onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      )}
    </Show>
  )
}
