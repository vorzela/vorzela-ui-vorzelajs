import { signal } from '@vorzelajs/core'
import { cx } from '../../lib/cx.ts'
import { Sidebar, type SidebarNavGroup } from './sidebar.tsx'
import { Topbar } from './topbar.tsx'
import styles from './app-shell.module.scss'
import primitives from '../primitives/primitives.module.scss'
import type { ReactNode } from '../../types.ts'

export interface AppShellProps {
  children: ReactNode
  title?: string
  groups: SidebarNavGroup[]
  brand?: ReactNode
  brandMark?: ReactNode
  subtitle?: string
  footer?: ReactNode
  actions?: ReactNode
  version?: string
  hasPermission?: (permission: string) => boolean
  drawerSide?: 'left' | 'right'
  currentPath?: string
}

/** First focusable control on the page; jumps to main content. */
function SkipLink({ href = '#main' }: { href?: string }) {
  return (
    <a href={href} className={cx(primitives.skip)}>
      Skip to content
    </a>
  )
}

/** Responsive app frame: collapsible sidebar, mobile drawer and page header. */
export function AppShell({
  children,
  title,
  groups,
  brand,
  brandMark,
  subtitle,
  footer,
  actions,
  version,
  hasPermission,
  drawerSide = 'left',
  currentPath,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = signal(false)

  return (
    <div className={styles.root}>
      <SkipLink href="#main" />
      <Sidebar
        groups={groups}
        brand={brand}
        brandMark={brandMark}
        subtitle={subtitle}
        footer={footer}
        version={version}
        hasPermission={hasPermission}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        drawerSide={drawerSide}
        currentPath={currentPath}
      />
      <div className={styles.body}>
        <Topbar
          title={title}
          actions={actions}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main id="main" tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}
