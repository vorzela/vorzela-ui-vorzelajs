import { computed, signal } from '@vorzelajs/core'
import { For, Show } from '@vorzelajs/dom'
import { Badge } from '~/components/ui/badge.tsx'
import { Button } from '~/components/ui/button.tsx'
import { CopyButton } from '~/components/ui/copy-button.tsx'
import { Kbd } from '~/components/ui/kbd.tsx'
import { Sidebar } from '~/components/ui/sidebar.tsx'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  ChevronLeft,
  Home,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
} from '~/components/ui/icons.tsx'
import { componentGroups, components, componentBySlug, componentsInGroup, type ComponentDoc, type ComponentGroup } from './docs/registry.ts'
import type { ReactNode } from '../src/types.ts'
import { previewBySlug } from './docs/previews/index.ts'
import { CodeBlock, Demo, PropsTable, Section } from './docs/showcase.tsx'
import { navigate, useRoute, useTheme } from './docs/hooks.ts'
import styles from './docs/docs.module.scss'

const version = '0.1.3'

const quickStart = `import { signal } from '@vorzelajs/core'
import { render } from '@vorzelajs/dom'
import { Button } from '~/components/ui/button'

const [count, setCount] = signal(0)

render(
  <Button onClick={() => setCount((n) => n + 1)}>
    Clicked {count()} times
  </Button>,
  document.getElementById('root')!,
)`

const navGroups = [
  {
    group: 'Start',
    items: [
      { label: 'Overview', href: '#/', icon: <Home aria-hidden /> },
      { label: 'Components', href: '#/components', icon: <Boxes aria-hidden /> },
      { label: 'Gallery', href: '#/gallery', icon: <Boxes aria-hidden /> },
    ],
  },
  ...componentGroups.map((group) => ({
    group,
    collapsible: true,
    defaultOpen: false,
    items: componentsInGroup(group).map((component) => ({
      label: component.name,
      href: `#/components/${component.slug}`,
      icon: group === 'Charts' ? <BarChart3 aria-hidden /> : undefined,
    })),
  })),
]

function routeTitle(segments: string[]): string {
  if (segments[0] === 'components' && segments[1]) {
    return componentBySlug.get(segments[1])?.name ?? 'Not found'
  }
  if (segments[0] === 'components') return 'Components'
  if (segments[0] === 'gallery') return 'Gallery'
  return 'Overview'
}

function NewBadge() {
  return <span class={styles.newBadge}>New</span>
}

function Footer() {
  return (
    <footer class={styles.footer}>
      <span>VorzelaJS UI · source-owned components · {version}</span>
      <span>
        Previewed live in the real DOM. <Kbd size="sm">⌘</Kbd> <Kbd size="sm">K</Kbd> is reserved for the app.
      </span>
    </footer>
  )
}

function Overview() {
  const groupCounts = componentGroups.map((group) => ({
    group,
    count: componentsInGroup(group).length,
  }))

  return (
    <>
      <section class={styles.hero}>
        <p class={styles.eyebrow}>VorzelaJS UI · component preview</p>
        <h1 class={styles.heroTitle}>Every component, running in the real DOM.</h1>
        <p class={styles.heroLead}>
          {components.length} source-owned primitives and charts, previewed with the
          same signals runtime your app uses. No virtual DOM, no dependency arrays,
          no second state system.
        </p>
        <div class={styles.chipRow}>
          <span class={styles.chip}><span class={styles.chipDot} /> Live previews</span>
          <span class={styles.chip}>Signals-first</span>
          <span class={styles.chip}>Escaped by default</span>
          <span class={styles.chip}>SSR islands</span>
          <span class={styles.chip}>Source-owned</span>
        </div>
        <div class={styles.demoRow}>
          <Button onClick={() => navigate('components')}>Browse components</Button>
          <Button variant="outline" onClick={() => navigate('gallery')}>
            Open the gallery
          </Button>
          <CopyButton value="npm run dev" label="Copy dev command" variant="ghost" />
        </div>
      </section>

      <Section title="At a glance" lead="The preview app imports components through the same ~ alias a consumer gets from vorzelajs-ui init.">
        <div class={styles.statGrid}>
          <div class={styles.componentCard}>
            <p class={styles.statValue}>{components.length}</p>
            <p class={styles.componentDesc}>Components with source modules</p>
          </div>
          <div class={styles.componentCard}>
            <p class={styles.statValue}>{groupCounts.length}</p>
            <p class={styles.componentDesc}>Groups, from actions to charts</p>
          </div>
          <div class={styles.componentCard}>
            <p class={styles.statValue}>{componentsInGroup('Charts').length}</p>
            <p class={styles.componentDesc}>D3 charts with data tables</p>
          </div>
          <div class={styles.componentCard}>
            <p class={styles.statValue}>{componentsInGroup('Forms').length}</p>
            <p class={styles.componentDesc}>Form controls with a11y wiring</p>
          </div>
        </div>
      </Section>

      <Section title="Start in one file" lead="Vorzela components are plain functions. Bind an accessor where the DOM should update; the function body never re-runs.">
        <CodeBlock code={quickStart} />
      </Section>

      <Section title="Browse by group" lead="Every group is listed in the searchable index and mounted in the live gallery. Detail pages show the preview, the import path and the copyable source.">
        <div class={styles.componentGrid}>
          <For each={() => groupCounts} key={(item) => item.group}>
            {(item) => (
              <a class={styles.componentCard} href="#/components">
                <span class={styles.componentTop}>
                  <span class={styles.componentName}>{item.group}</span>
                  <span class={styles.componentCount}>{item.count}</span>
                </span>
                <span class={styles.componentDesc}>
                  {item.group === 'Charts'
                    ? 'Bar, line, donut, heatmap, sankey and more.'
                    : item.group === 'Forms'
                      ? 'Inputs, selects, pickers and validation states.'
                      : item.group === 'Feedback'
                        ? 'Alerts, progress, empty states and toasts.'
                        : item.group === 'Data display'
                          ? 'Tables, badges, timelines and invoices.'
                          : item.group === 'Surfaces'
                            ? 'Cards, grids, panels and scroll areas.'
                            : item.group === 'Layout'
                              ? 'App shell, stack, grid and split.'
                              : item.group === 'Navigation'
                                ? 'Sidebars, tabs, menus and breadcrumbs.'
                                : item.group === 'Overlays'
                                  ? 'Dialogs, drawers, popovers and tooltips.'
                                  : item.group === 'Media'
                                    ? 'Images, carousels and croppers.'
                                    : 'Buttons, menus and command palettes.'}
                </span>
              </a>
            )}
          </For>
        </div>
      </Section>

      <Footer />
    </>
  )
}

function ComponentsIndex() {
  const [query, setQuery] = signal('')
  const [group, setGroup] = signal<ComponentGroup | 'All'>('All')

  const filtered = computed(() => {
    const needle = query().trim().toLowerCase()
    return components.filter((component) => {
      if (group() !== 'All' && component.group !== group()) return false
      if (!needle) return true
      return (
        component.name.toLowerCase().includes(needle) ||
        component.slug.includes(needle) ||
        component.description.toLowerCase().includes(needle)
      )
    })
  })

  return (
    <>
      <section class={styles.detailHeader}>
        <p class={styles.eyebrow}>Index</p>
        <h1 class={styles.detailTitle}>All components</h1>
        <p class={styles.detailLead}>
          {components.length} primitives, grouped the same way as the source tree.
          Search by name, slug or description.
        </p>
        <div class={styles.demoRow}>
          <label class={styles.search}>
            <span class={styles.searchIcon}><Search aria-hidden /></span>
            <input
              type="search"
              placeholder="Search components…"
              aria-label="Search components"
              value={query()}
              onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <span class={styles.componentCount}>{() => `${filtered().length} shown`}</span>
        </div>
        <div class={styles.chipRow}>
          <button
            type="button"
            class={styles.chip}
            aria-pressed={group() === 'All'}
            onClick={() => setGroup('All')}
          >
            All
          </button>
          <For each={() => componentGroups} key={(item) => item}>
            {(item) => (
              <button
                type="button"
                class={styles.chip}
                aria-pressed={group() === item}
                onClick={() => setGroup(item)}
              >
                {item}
                <span class={styles.componentCount}>{componentsInGroup(item).length}</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <div class={styles.componentGrid}>
        <For each={filtered} key={(component) => component.slug}>
          {(component) => (
            <a class={styles.componentCard} href={`#/components/${component.slug}`}>
              <span class={styles.componentTop}>
                <span class={styles.componentName}>
                  {component.name}
                  {component.isNew ? <NewBadge /> : null}
                </span>
                <span class={styles.componentCount}>{component.group}</span>
              </span>
              <span class={styles.componentDesc}>{component.description}</span>
            </a>
          )}
        </For>
      </div>

      <Show when={() => filtered().length === 0}>
        {() => (
          <p class={styles.notice}>
            No component matches “{() => query()}”. Try a broader term.
          </p>
        )}
      </Show>

      <Footer />
    </>
  )
}

function Gallery() {
  const [group, setGroup] = signal<ComponentGroup | 'All'>('All')

  const visibleGroups = computed(() =>
    group() === 'All'
      ? componentGroups
      : componentGroups.filter((item) => item === group()),
  )

  return (
    <>
      <section class={styles.detailHeader}>
        <p class={styles.eyebrow}>Gallery</p>
        <h1 class={styles.detailTitle}>Every preview at once</h1>
        <p class={styles.detailLead}>
          Live mounts of every preview in the kit. Charts, tables and overlays run
          against the same runtime as the detail pages.
        </p>
        <div class={styles.chipRow}>
          <button type="button" class={styles.chip} aria-pressed={group() === 'All'} onClick={() => setGroup('All')}>
            All
          </button>
          <For each={() => componentGroups} key={(item) => item}>
            {(item) => (
              <button type="button" class={styles.chip} aria-pressed={group() === item} onClick={() => setGroup(item)}>
                {item}
              </button>
            )}
          </For>
        </div>
      </section>

      <div class={styles.gallery}>
        <For each={visibleGroups} key={(item) => item}>
          {(groupName) => (
            <div class={styles.galleryGroup}>
              <div class={styles.galleryLabel}>
                <h2 class={styles.sectionTitle}>{groupName}</h2>
                <span class={styles.componentCount}>{componentsInGroup(groupName).length} components</span>
              </div>
              <div class={styles.galleryGrid}>
                <For each={() => componentsInGroup(groupName)} key={(component) => component.slug}>
                  {(component) => {
                    const preview = previewBySlug[component.slug]
                    return (
                      <div class={styles.galleryItem}>
                        <div class={styles.galleryLabel}>
                          <span class={styles.galleryName}>
                            {component.name}
                            {component.isNew ? <NewBadge /> : null}
                          </span>
                          <a class={styles.galleryLink} href={`#/components/${component.slug}`}>
                            Open
                          </a>
                        </div>
                        {preview ? (
                          <Demo title={component.name} note={component.slug}>
                            {preview() as ReactNode}
                          </Demo>
                        ) : (
                          <p class={styles.notice}>No preview yet.</p>
                        )}
                      </div>
                    )
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      <Footer />
    </>
  )
}

function ComponentDetail({ component }: { component: ComponentDoc }) {
  const groupItems = componentsInGroup(component.group)
  const index = groupItems.findIndex((item) => item.slug === component.slug)
  const previous = index > 0 ? groupItems[index - 1] : undefined
  const next = index >= 0 && index < groupItems.length - 1 ? groupItems[index + 1] : undefined
  const preview = previewBySlug[component.slug]

  return (
    <>
      <section class={styles.detailHeader}>
        <a class={styles.backLink} href="#/components">
          <ChevronLeft aria-hidden /> All components
        </a>
        <div class={styles.demoRow}>
          {component.isNew ? <NewBadge /> : null}
          <Badge variant="soft">{component.group}</Badge>
          <Badge variant="outline">{component.slug}</Badge>
        </div>
        <h1 class={styles.detailTitle}>{component.name}</h1>
        <p class={styles.detailLead}>{component.description}</p>
        <div class={styles.detailMeta}>
          <span class={styles.chip}>{component.module}</span>
          <CopyButton value={`import { ${component.imports} } from '${component.module}'`} label="Copy import" variant="ghost" size="sm" />
        </div>
      </section>

      <Section title="Preview" lead="Mounted with the real component. Interactions are live.">
        {preview ? (
          <Demo title={component.name} note={component.slug}>
            {preview() as ReactNode}
          </Demo>
        ) : (
          <p class={styles.notice}>This component has no live preview yet.</p>
        )}
      </Section>

      <Section title="Source" lead="Copy the module next to the component you own. Imports use the ~ alias.">
        <CodeBlock code={component.code} />
      </Section>

      {component.props.length > 0 ? (
        <Section title="API reference" lead="The public props most consumers touch first.">
          <PropsTable rows={component.props} />
        </Section>
      ) : null}

      <nav class={styles.footer} aria-label="Previous and next component">
        {previous ? (
          <a class={styles.backLink} href={`#/components/${previous.slug}`}>
            <ArrowLeft aria-hidden /> {previous.name}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a class={styles.backLink} href={`#/components/${next.slug}`}>
            {next.name} <ArrowRight aria-hidden />
          </a>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}

function NotFound({ path }: { path: string }) {
  return (
    <>
      <section class={styles.detailHeader}>
        <p class={styles.eyebrow}>404</p>
        <h1 class={styles.detailTitle}>No page at “{path}”</h1>
        <p class={styles.detailLead}>
          The preview app uses hash routes. Pick a component from the sidebar or
          start from the index.
        </p>
        <div class={styles.demoRow}>
          <Button onClick={() => navigate('components')}>Components</Button>
          <Button variant="outline" onClick={() => navigate('gallery')}>Gallery</Button>
        </div>
      </section>
      <Footer />
    </>
  )
}

function RoutePage({ path }: { path: string }) {
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0 || segments[0] === 'overview') return <Overview />
  if (segments[0] === 'components' && segments[1]) {
    const component = componentBySlug.get(segments[1])
    return component ? <ComponentDetail component={component} /> : <NotFound path={path} />
  }
  if (segments[0] === 'components') return <ComponentsIndex />
  if (segments[0] === 'gallery') return <Gallery />
  return <NotFound path={path} />
}

export function App() {
  const route = useRoute()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = signal(false)

  return (
    <div class={styles.shell}>
      <a
        class={styles.skipLink}
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main')
          main?.focus()
          main?.scrollIntoView({ block: 'start' })
        }}
      >
        Skip to content
      </a>
      <Sidebar
        groups={navGroups}
        brand="Vorzela UI"
        brandMark="V"
        subtitle="Component preview"
        version={version}
        currentPath={() => `#/${route().path}`}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        footer={
          <div class={styles.demoStack}>
            <p class={styles.componentDesc}>
              {components.length} components · real DOM · no vDOM
            </p>
            <CopyButton value="npm run dev" label="Copy command" variant="ghost" size="sm" />
          </div>
        }
      />
      <div class={styles.main}>
        <header class={styles.topbar}>
          <button
            type="button"
            class={styles.menuButton}
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} aria-hidden />
          </button>
          <div class={styles.topbarTitle}>
            <strong>{() => routeTitle(route().segments)}</strong>
            <span class={styles.topbarDivider}>/</span>
            <span>preview</span>
          </div>
          <div class={styles.topbarActions}>
            <Kbd size="sm">v{version}</Kbd>
            <a class={styles.chip} href="#/gallery">
              <Sparkles aria-hidden /> Gallery
            </a>
            <button
              type="button"
              class={styles.themeToggle}
              aria-label={() => (theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
              onClick={toggle}
            >
              <Show when={() => theme() === 'dark'} fallback={<Sun size={18} aria-hidden />}>
                {() => <Moon size={18} aria-hidden />}
              </Show>
            </button>
          </div>
        </header>
        <main id="main" class={styles.content} tabIndex={-1}>
          <For each={() => [route().path]} key={(path) => path}>
            {(path) => <RoutePage path={path} />}
          </For>
        </main>
      </div>
    </div>
  )
}
