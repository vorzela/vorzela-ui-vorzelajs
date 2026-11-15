import { effect, onCleanup, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { Alert } from '~/components/ui/alert.tsx'
import { Banner } from '~/components/ui/banner.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Callout } from '~/components/ui/callout.tsx'
import { CookieConsent } from '~/components/ui/cookie-consent.tsx'
import { Empty } from '~/components/ui/empty.tsx'
import { ErrorState } from '~/components/ui/error-state.tsx'
import {
  Bell,
  CircleCheck,
  CircleX,
  FolderOpen,
  Info,
  Sparkles,
} from '~/components/ui/icons.tsx'
import { NetworkLoader, startNetworkLoader, finishNetworkLoader } from '~/components/ui/network-loader.tsx'
import { NotificationCenter } from '~/components/ui/notification-center.tsx'
import { OfflineBanner } from '~/components/ui/offline-banner.tsx'
import { Popconfirm } from '~/components/ui/popconfirm.tsx'
import { Progress } from '~/components/ui/progress.tsx'
import { Result } from '~/components/ui/result.tsx'
import { Skeleton } from '~/components/ui/skeleton.tsx'
import { Toaster, toast } from '~/components/ui/sonner.tsx'
import { Spinner } from '~/components/ui/spinner.tsx'
import { StatusDot } from '~/components/ui/status-dot.tsx'
import { Tour } from '~/components/ui/tour.tsx'
import styles from '../docs.module.scss'

function AlertPreview() {
  const [visible, setVisible] = signal(true)
  return (
    <div class={styles.demoStack}>
      <Alert variant="info" title="Heads up">
        The API will be read-only on Saturday from 02:00–03:00 UTC.
      </Alert>
      <Alert variant="success" title="Deployed">
        v0.2.0 is live in production.
      </Alert>
      <Alert variant="warning" title="Usage at 82%">
        You have used 82% of this month's build minutes.
      </Alert>
      <Show when={visible}>
        {() => (
          <Alert variant="error" title="Payment failed" onDismiss={() => setVisible(false)}>
            Update the card on file to keep builds running.
          </Alert>
        )}
      </Show>
    </div>
  )
}

function BannerPreview() {
  return (
    <div class={styles.demoStack}>
      <Banner tone="info" title="Scheduled maintenance">
        The API will be read-only on Saturday from 02:00–03:00 UTC.
      </Banner>
      <Banner tone="warning" title="Usage at 82%" dismissible>
        You have used 82% of this month's build minutes.
      </Banner>
      <Banner
        tone="success"
        title="Backup complete"
        action={<Button size="sm" variant="outline">View</Button>}
      >
        128 GB archived to cold storage.
      </Banner>
    </div>
  )
}

function CalloutPreview() {
  return (
    <div class={styles.demoStack}>
      <Callout tone="tip" title="Copy, don't depend">
        Components are source-owned. Keep the module next to the component when
        you copy it into your app.
      </Callout>
      <Callout tone="info" title="Signals, not hooks">
        State changes never re-run a component. Bind an accessor where the DOM
        should update.
      </Callout>
    </div>
  )
}

function ProgressPreview() {
  const [value, setValue] = signal(48)
  return (
    <div class={styles.demoStack}>
      <For each={() => [value()]} key={(current) => current}>
        {(current) => (
          <>
            <Progress label="Upload" value={current} showValue />
            <Progress label="Storage" value={current} tone="success" size="sm" />
          </>
        )}
      </For>
      <Progress label="Indeterminate" />
      <div class={styles.demoRow}>
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.max(0, current - 10))}>
          −10
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.min(100, current + 10))}>
          +10
        </Button>
      </div>
    </div>
  )
}

function SpinnerPreview() {
  return (
    <div class={styles.demoRow}>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
      <Spinner size="xl" />
      <Button disabled>
        <Spinner size="sm" label={null} onPrimary />
        Saving…
      </Button>
    </div>
  )
}

function SkeletonPreview() {
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Skeleton variant="circle" width={44} height={44} />
        <div style={{ display: 'grid', gap: '0.5rem', flex: 1 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rect" height={120} />
    </div>
  )
}

function StatusDotPreview() {
  return (
    <div class={styles.demoRow}>
      <StatusDot tone="neutral" label="Idle" />
      <StatusDot tone="info" label="Queued" />
      <StatusDot tone="success" label="Live" pulse />
      <StatusDot tone="warning" label="Degraded" />
      <StatusDot tone="danger" label="Down" />
    </div>
  )
}

function EmptyPreview() {
  return (
    <Empty
      icon={<FolderOpen aria-hidden />}
      title="No projects yet"
      description="Create a project to start collecting builds and deployments."
      action={{ label: 'New project', onClick: () => {} }}
    />
  )
}

function ErrorStatePreview() {
  return (
    <ErrorState
      title="Could not load usage"
      description="The billing service is taking too long to respond."
      onRetry={() => {}}
    />
  )
}

function ResultPreview() {
  return (
    <Result
      tone="success"
      title="Deployment complete"
      description="v0.2.0 is live in production. All health checks passed."
      actions={
        <>
          <Button size="sm">View deployment</Button>
          <Button size="sm" variant="outline">Open logs</Button>
        </>
      }
    />
  )
}

function ToastButtons() {
  return (
    <div class={styles.demoRow}>
      <Button
        size="sm"
        onClick={() =>
          toast({ type: 'success', title: 'Saved', description: 'Your changes are live.' })
        }
      >
        Success toast
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          toast({ type: 'error', title: 'Upload failed', description: 'Check the file and try again.' })
        }
      >
        Error toast
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          toast({
            type: 'info',
            title: 'New comment',
            description: 'Ada mentioned you in the design review.',
            action: { label: 'Open', onClick: () => {} },
          })
        }
      >
        Action toast
      </Button>
    </div>
  )
}

function SonnerPreview() {
  return (
    <div class={styles.demoStack}>
      <ToastButtons />
      <Toaster position="bottom-right" />
    </div>
  )
}

function NetworkLoaderPreview() {
  const [runs, setRuns] = signal(0)
  effect(() => {
    if (runs() === 0) return
    startNetworkLoader()
    const timer = setTimeout(() => finishNetworkLoader(), 1600)
    onCleanup(() => clearTimeout(timer))
  })
  return (
    <div class={styles.demoStack}>
      <NetworkLoader showSpinner glow />
      <div class={styles.demoRow}>
        <Button size="sm" variant="outline" onClick={() => setRuns((current) => current + 1)}>
          Simulate request
        </Button>
        <span class={styles.cardText}>A three-pixel bar appears at the top edge.</span>
      </div>
    </div>
  )
}

function OfflineBannerPreview() {
  return (
    <div class={styles.demoStack}>
      <OfflineBanner force onRetry={() => {}} />
    </div>
  )
}

function CookieConsentPreview() {
  const [show, setShow] = signal(false)
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            try {
              window.localStorage.removeItem('vz.preview.consent')
            } catch {
              /* storage blocked */
            }
            setShow(true)
          }}
        >
          Show consent banner
        </Button>
      </div>
      <Show when={show}>
        {() => (
          <CookieConsent
            storageKey="vz.preview.consent"
            policyHref="#/components/cookie-consent"
            onAccept={() => setShow(false)}
            onReject={() => setShow(false)}
          />
        )}
      </Show>
    </div>
  )
}

function NotificationCenterPreview() {
  const [read, setRead] = signal(false)
  return (
    <NotificationCenter
      notifications={() => [
        {
          id: '1',
          title: 'Deployment finished',
          description: 'v0.2.0 is live.',
          time: '2m',
          read: read(),
          icon: <CircleCheck aria-hidden />,
        },
        {
          id: '2',
          title: 'New member',
          description: 'Grace joined Northwind.',
          time: '1h',
          read: read(),
          icon: <Bell aria-hidden />,
        },
        {
          id: '3',
          title: 'Build failed',
          description: 'Typecheck failed on main.',
          time: '3h',
          read: read(),
          icon: <CircleX aria-hidden />,
        },
      ]}
      onMarkAllRead={() => setRead(true)}
    />
  )
}

function TourPreview() {
  const [open, setOpen] = signal(false)
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Button id="tour-target" size="sm" onClick={() => setOpen(true)}>
          Start tour
        </Button>
        <span class={styles.cardText}>Three steps point at this button.</span>
      </div>
      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          { id: 'one', target: '#tour-target', title: 'Start here', description: 'The first step highlights the trigger.' },
          { id: 'two', target: '#tour-target', title: 'Signals', description: 'State is a signal; the DOM updates in place.' },
          { id: 'three', target: '#tour-target', title: 'Done', description: 'Finish closes the tour and restores focus.' },
        ]}
        showSkip
      />
    </div>
  )
}

function PopconfirmPreview() {
  return (
    <div class={styles.demoRow}>
      <Popconfirm
        title="Delete project?"
        description="This removes every build and deployment."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {}}
      >
        <Button variant="destructive" size="sm">Delete project</Button>
      </Popconfirm>
      <Popconfirm title="Archive project?" onConfirm={() => {}}>
        <Button variant="outline" size="sm">Archive</Button>
      </Popconfirm>
    </div>
  )
}

function NotificationIconPreview() {
  return (
    <div class={styles.demoRow}>
      <Info size={24} aria-hidden />
      <Sparkles size={24} aria-hidden />
      <CircleCheck size={24} aria-hidden />
    </div>
  )
}

export const feedbackPreviews = {
  alert: AlertPreview,
  banner: BannerPreview,
  callout: CalloutPreview,
  progress: ProgressPreview,
  spinner: SpinnerPreview,
  skeleton: SkeletonPreview,
  'status-dot': StatusDotPreview,
  empty: EmptyPreview,
  'error-state': ErrorStatePreview,
  result: ResultPreview,
  sonner: SonnerPreview,
  'network-loader': NetworkLoaderPreview,
  'offline-banner': OfflineBannerPreview,
  'cookie-consent': CookieConsentPreview,
  'notification-center': NotificationCenterPreview,
  tour: TourPreview,
  popconfirm: PopconfirmPreview,
  icons: NotificationIconPreview,
} satisfies Record<string, () => unknown>
