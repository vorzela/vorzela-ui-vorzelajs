import { computed } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import type { ReactNode } from '../../types.ts'
import { Button } from './button.tsx'
import { Empty } from './empty.tsx'
import { Bell, CheckCheck } from './icons.tsx'
import styles from './notification-center.module.scss'

export type Notification = {
  id: string
  title: ReactNode
  description?: ReactNode
  time?: string
  read?: boolean
  icon?: ReactNode
  onSelect?: () => void
}

export function NotificationCenter({
  notifications,
  onMarkAllRead,
  label = 'Notifications',
  className,
}: {
  notifications: Notification[] | (() => Notification[])
  onMarkAllRead?: () => void
  label?: string
  className?: string
}) {
  const notificationsValue = accessorOf(notifications)
  const unread = computed(
    () => notificationsValue().filter((item) => !item.read).length,
  )
  const hasUnread = computed(() => unread() > 0)
  const isEmpty = computed(() => notificationsValue().length === 0)

  return (
    <section aria-label={label} className={cx(styles.root, className)}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <Bell className={styles.bell} aria-hidden />
          <h2 className={styles.title}>{label}</h2>
          <Show when={hasUnread}>
            <span className={styles.count}>{unread}</span>
          </Show>
        </div>
        <Show when={() => hasUnread() && Boolean(onMarkAllRead)}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAllRead?.()}
            className={styles.markAll}
          >
            <CheckCheck aria-hidden />
            Mark all read
          </Button>
        </Show>
      </header>

      <Show
        when={isEmpty}
        fallback={
          <ul className={styles.list} aria-live="polite">
            <For each={notificationsValue} key={(item) => item.id}>
              {(item) => (
                <li className={styles.listItem}>
                  <button
                    type="button"
                    onClick={() => item.onSelect?.()}
                    className={() =>
                      cx(styles.item, !item.read && styles.itemUnread)
                    }
                  >
                    <span className={styles.avatar}>
                      {item.icon ?? <Bell aria-hidden />}
                    </span>
                    <span className={styles.body}>
                      <span className={styles.titleRow}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        {!item.read ? (
                          <>
                            <span aria-hidden className={styles.dot} />
                            <span className={styles.srOnly}>Unread</span>
                          </>
                        ) : null}
                      </span>
                      {item.description ? (
                        <span className={styles.description}>{item.description}</span>
                      ) : null}
                      {item.time ? (
                        <span className={styles.time}>{item.time}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        }
      >
        <Empty
          title="All caught up"
          description="New notifications will appear here."
          className={styles.empty}
        />
      </Show>
    </section>
  )
}
