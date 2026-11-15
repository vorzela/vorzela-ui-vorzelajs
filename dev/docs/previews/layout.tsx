import { signal } from '@vorzelajs/core'
import { AppShell } from '~/components/ui/app-shell.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { Button } from '~/components/ui/button.tsx'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible.tsx'
import {
  Container,
  Flex,
  Grid,
  Inline,
  PageSection,
  Split,
  Stack,
} from '~/components/ui/layout.tsx'
import { SizeProvider } from '~/components/ui/size-context.tsx'
import {
  BarChart3,
  Bell,
  Home,
  Settings,
  Users,
} from '~/components/ui/icons.tsx'
import styles from '../docs.module.scss'

function Box({ label }: { label: string }) {
  return <div class={styles.swatch} style={{ 'min-height': '4rem' }}><div class={styles.swatchLabel}>{label}</div></div>
}

function LayoutPreview() {
  return (
    <Stack gap={5}>
      <div>
        <p class={styles.cardTitle}>Stack</p>
        <Stack gap={2}>
          <Box label="One" />
          <Box label="Two" />
        </Stack>
      </div>
      <div>
        <p class={styles.cardTitle}>Inline</p>
        <Inline gap={2} wrap>
          <Box label="A" />
          <Box label="B" />
          <Box label="C" />
        </Inline>
      </div>
      <div>
        <p class={styles.cardTitle}>Grid</p>
        <Grid min="8rem" gap={2}>
          <Box label="1" />
          <Box label="2" />
          <Box label="3" />
        </Grid>
      </div>
      <div>
        <p class={styles.cardTitle}>Split</p>
        <Split side={<Box label="Side" />} sideWidth="8rem">
          <Box label="Main" />
        </Split>
      </div>
      <Container size="sm">
        <Box label="Container · sm" />
      </Container>
      <PageSection title="Page section" description="A titled region with optional actions." actions={<Button size="sm" variant="outline">Action</Button>}>
        <p class={styles.cardText}>Section content sits below the heading row.</p>
      </PageSection>
      <div>
        <p class={styles.cardTitle}>Flex</p>
        <Flex gap={2} justify="between" align="center">
          <Box label="Start" />
          <Box label="End" />
        </Flex>
      </div>
    </Stack>
  )
}

function CollapsiblePreview() {
  const [open, setOpen] = signal(false)
  return (
    <Collapsible defaultOpen={false} onOpenChange={setOpen}>
      {() => (
        <>
          <CollapsibleTrigger>
            <span>Advanced settings</span>
            <Badge variant="soft">{() => (open() ? 'Open' : 'Closed')}</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p class={styles.cardText}>
              Height animates from zero to auto. Content is unmounted when the
              disclosure closes, so its effects are disposed.
            </p>
          </CollapsibleContent>
        </>
      )}
    </Collapsible>
  )
}

function SizeContextPreview() {
  const [size, setSize] = signal<'sm' | 'md' | 'lg'>('md')
  return (
    <div class={styles.demoStack}>
      <div class={styles.demoRow}>
        <Button size="sm" variant={size() === 'sm' ? 'primary' : 'outline'} onClick={() => setSize('sm')}>sm</Button>
        <Button size="sm" variant={size() === 'md' ? 'primary' : 'outline'} onClick={() => setSize('md')}>md</Button>
        <Button size="sm" variant={size() === 'lg' ? 'primary' : 'outline'} onClick={() => setSize('lg')}>lg</Button>
      </div>
      <SizeProvider size={size()}>
        <div class={styles.demoRow}>
          <Button>Continue</Button>
          <Button variant="outline">Cancel</Button>
          <Button size="icon" aria-label="Settings">
            <Settings aria-hidden />
          </Button>
        </div>
      </SizeProvider>
      <p class={styles.cardText}>Buttons inherit size from the nearest provider. Current: {() => size()}</p>
    </div>
  )
}

function AppShellPreview() {
  return (
    <div
      style={{ height: '30rem', overflow: 'hidden', border: '1px solid var(--border)', 'border-radius': 'var(--radius-lg)' }}
      onClick={(event) => {
        if ((event.target as Element).closest('a')) event.preventDefault()
      }}
    >
      <div style={{ transform: 'scale(0.62)', 'transform-origin': 'top left', width: '161%', height: '161%' }}>
        <AppShell
          title="Overview"
          brand="Vorzela"
          subtitle="Workspace"
          version="0.2.0"
          currentPath="/overview"
          actions={<Badge variant="soft">Live</Badge>}
          groups={[
            {
              group: 'Workspace',
              items: [
                { label: 'Overview', href: '/overview', icon: <Home aria-hidden /> },
                { label: 'Members', href: '/members', icon: <Users aria-hidden /> },
                { label: 'Insights', href: '/insights', icon: <BarChart3 aria-hidden /> },
              ],
            },
            {
              group: 'Account',
              items: [
                { label: 'Settings', href: '/settings', icon: <Settings aria-hidden /> },
                { label: 'Alerts', href: '/alerts', icon: <Bell aria-hidden /> },
              ],
            },
          ]}
          footer={<p class={styles.cardText}>Signed in as Ada</p>}
        >
          <Stack gap={3}>
            <p class={styles.cardTitle}>AppShell</p>
            <p class={styles.cardText}>
              A responsive frame: collapsible sidebar, mobile drawer, skip link
              and sticky topbar. Everything inside is your page.
            </p>
            <Grid min="9rem" gap={2}>
              <Box label="Card" />
              <Box label="Card" />
              <Box label="Card" />
            </Grid>
          </Stack>
        </AppShell>
      </div>
    </div>
  )
}

export const layoutPreviews = {
  'app-shell': AppShellPreview,
  layout: LayoutPreview,
  collapsible: CollapsiblePreview,
  'size-context': SizeContextPreview,
} satisfies Record<string, () => unknown>
