#!/usr/bin/env node
/**
 * Build the shadcn-style registry from the native VorzelaJS source tree.
 *
 * Run: node scripts/build-registry.mjs
 * Output: registry/index.json and registry/<name>.json
 *
 * Components are copied into the consumer's app, never imported from a
 * published UI package. Table and data-table keep `@vorzelajs/table` as a
 * runtime dependency.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registryDir = path.join(root, 'registry')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const version = pkg.version

function specFor(name) {
  const range = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
  return range ? `${name}@${range}` : name
}

fs.rmSync(registryDir, { recursive: true, force: true })
fs.mkdirSync(registryDir, { recursive: true })

const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))

function walk(relative) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) return []
  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.posix.join(relative, entry.name)
      return entry.isDirectory() ? walk(child) : [child]
    })
}

const definitions = []
const outputFor = new Map()
const itemForSource = new Map()

function defineItem(name, type, files, extra = {}) {
  const item = {
    name,
    type,
    files,
    dependencies: new Set(extra.dependencies ?? []),
    devDependencies: new Set(extra.devDependencies ?? []),
    registryDependencies: new Set(extra.registryDependencies ?? []),
    description: extra.description ?? `${name} component`,
    alias: false,
  }
  definitions.push(item)

  for (const file of files) {
    if (outputFor.has(file.source)) {
      throw new Error(
        `Duplicate source ${file.source} in ${name} and ${itemForSource.get(file.source)}`,
      )
    }
    outputFor.set(file.source, file.output)
    itemForSource.set(file.source, name)
  }
}

function collect(relative, outputPrefix, type, name, extension) {
  const files = walk(relative)
    .filter((file) => extension.some((suffix) => file.endsWith(suffix)))
    .map((source) => ({
      source,
      output: path.posix.join(
        outputPrefix,
        path.posix.relative(relative, source),
      ),
    }))

  if (files.length > 0) defineItem(name, type, files)
}

// ── Shared layers ─────────────────────────────────────────
defineItem(
  'styles',
  'style',
  walk('src/styles')
    .filter((file) => file.endsWith('.scss'))
    .map((source) => ({
      source,
      output: path.posix.join('styles', path.posix.relative('src/styles', source)),
    })),
  { devDependencies: [specFor('sass-embedded')] },
)

collect('src/hooks', 'hooks', 'hook', 'hooks', ['.ts'])
collect(
  'src/components/primitives',
  'components/primitives',
  'primitive',
  'primitives',
  ['.ts', '.tsx', '.scss'],
)

defineItem('lib-types', 'lib', [
  { source: 'src/types.ts', output: 'lib/types.ts' },
])
defineItem('lib-cx', 'lib', [{ source: 'src/lib/cx.ts', output: 'lib/cx.ts' }])
defineItem('lib-overlay', 'lib', [
  { source: 'src/lib/overlay.ts', output: 'lib/overlay.ts' },
])
defineItem('lib-security', 'lib', [
  { source: 'src/lib/security.ts', output: 'lib/security.ts' },
])
defineItem('lib-refs', 'lib', [{ source: 'src/lib/refs.ts', output: 'lib/refs.ts' }])
defineItem('lib-table', 'lib', [{ source: 'src/lib/table.ts', output: 'lib/table.ts' }])
defineItem('lib-phone-countries', 'lib', [
  { source: 'src/lib/phone-countries.ts', output: 'lib/phone-countries.ts' },
])

defineItem('icons', 'ui', [
  {
    source: 'src/components/ui/icons.tsx',
    output: 'components/ui/icons.tsx',
  },
], { description: 'Shared icon set' })
defineItem('calendar-utils', 'lib', [
  {
    source: 'src/components/ui/calendar-utils.ts',
    output: 'components/ui/calendar-utils.ts',
  },
], { description: 'Calendar date helpers' })

const CHART_SHARED = [
  'chart-colors.ts',
  'chart-dom.ts',
  'chart-frame.tsx',
  'chart-tooltip.tsx',
  'chart-types.ts',
  'chart-utils.ts',
  'charts.module.scss',
  'use-animated-progress.ts',
]
defineItem(
  'chart-shared',
  'chart',
  CHART_SHARED.filter((file) => exists(`src/charts/${file}`)).map((file) => ({
    source: `src/charts/${file}`,
    output: `charts/${file}`,
  })),
  { description: 'Shared chart frame, tooltip and helpers' },
)

// ── UI components ─────────────────────────────────────────
const UI_SKIP = new Set(['index.tsx', 'icons.tsx'])
const uiComponents = fs
  .readdirSync(path.join(root, 'src/components/ui'))
  .filter((file) => file.endsWith('.tsx') && !UI_SKIP.has(file))
  .map((file) => file.replace(/\.tsx$/, ''))
  .sort()

for (const name of uiComponents) {
  const files = [
    {
      source: `src/components/ui/${name}.tsx`,
      output: `components/ui/${name}.tsx`,
    },
  ]
  const modulePath = `src/components/ui/${name}.module.scss`
  if (exists(modulePath)) {
    files.push({
      source: modulePath,
      output: `components/ui/${name}.module.scss`,
    })
  }

  const descriptions = {
    table: 'Presentational table primitives.',
    'data-table':
      'Full data table powered by @vorzelajs/table: search, sorting, selection, column visibility and paging.',
    'simple-data-table':
      'Lightweight data table powered by @vorzelajs/table: search, sorting and pagination.',
  }

  defineItem(name, 'ui', files, {
    description: descriptions[name] ?? `${name} component`,
  })
}

// ── Charts ────────────────────────────────────────────────
const CHART_SKIP = new Set([
  'index.ts',
  'chart-frame.tsx',
  'chart-tooltip.tsx',
])
const charts = fs
  .readdirSync(path.join(root, 'src/charts'))
  .filter((file) => file.endsWith('.tsx') && !CHART_SKIP.has(file))
  .map((file) => file.replace(/\.tsx$/, ''))
  .sort()

for (const name of charts) {
  defineItem(
    name,
    'chart',
    [
      {
        source: `src/charts/${name}.tsx`,
        output: `charts/${name}.tsx`,
      },
    ],
    { description: `${name} chart` },
  )
}

// Optional aggregate: add every chart plus the chart index.
defineItem(
  'charts',
  'chart',
  [{ source: 'src/charts/index.ts', output: 'charts/index.ts' }],
  { description: 'All charts and the chart index' },
)

// ── Dependency graph ──────────────────────────────────────
function parseImports(source) {
  const found = new Set()
  const re = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g
  let match
  while ((match = re.exec(source)) !== null) found.add(match[1])
  return [...found]
}

function parseScssUses(source) {
  const found = new Set()
  const re = /@use\s+['"]([^'"]+)['"]/g
  let match
  while ((match = re.exec(source)) !== null) found.add(match[1])
  return [...found]
}

function packageName(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/')
  }
  return specifier.split('/')[0]
}

function resolveSource(fromSource, specifier) {
  if (!specifier.startsWith('.')) return null
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(fromSource), specifier),
  )
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.scss`,
    `${base}.module.scss`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/_index.scss`,
  ]
  return candidates.find((candidate) => exists(candidate)) ?? null
}

function aliasFor(output) {
  for (const prefix of [
    'components/ui/',
    'components/primitives/',
    'lib/',
    'hooks/',
    'styles/',
    'charts/',
  ]) {
    if (output.startsWith(prefix)) return `~/${output}`
  }
  return null
}

function rewriteSpecifier(fromSource, specifier) {
  const resolved = resolveSource(fromSource, specifier)
  if (!resolved) return specifier
  const target = outputFor.get(resolved)
  const own = outputFor.get(fromSource)
  if (!target || !own) return specifier

  if (path.posix.dirname(target) === path.posix.dirname(own)) {
    return `./${path.posix.basename(target)}`
  }
  return aliasFor(target) ?? specifier
}

function rewriteSource(sourceRel, content) {
  const rewritten = content.replace(
    /(from\s+|import\s*\()\s*(['"])([^'"]+)\2/g,
    (match, prefix, quote, specifier) =>
      `${prefix}${quote}${rewriteSpecifier(sourceRel, specifier)}${quote}`,
  )

  // Components use a relative Sass import. Normalize it so the CLI can
  // recompute the path after the user picks their own styles directory.
  return rewritten.replace(
    /@use\s+(['"])(?:\.\.\/)+styles\1\s+as\s+vz;/g,
    "@use 'styles' as vz;",
  )
}

for (const item of definitions) {
  for (const file of item.files) {
    const source = read(file.source)
    for (const specifier of parseImports(source)) {
      if (specifier.startsWith('.')) {
        const resolved = resolveSource(file.source, specifier)
        if (!resolved) continue
        if (resolved.startsWith('src/styles/')) {
          item.registryDependencies.add('styles')
          continue
        }
        const owner = itemForSource.get(resolved)
        if (owner && owner !== item.name) {
          item.registryDependencies.add(owner)
        }
        continue
      }

      const pkg = packageName(specifier)
      if (
        pkg.startsWith('@vorzelajs/') ||
        pkg === 'd3' ||
        pkg === 'd3-sankey' ||
        pkg === 'lucide' ||
        pkg === 'dompurify'
      ) {
        item.dependencies.add(specFor(pkg))
      }
    }

    for (const specifier of parseScssUses(source)) {
      if (specifier.includes('styles')) item.registryDependencies.add('styles')
    }
  }

  // Every component with a CSS module needs the shared Sass API.
  if (
    (item.type === 'ui' || item.type === 'chart' || item.type === 'primitive') &&
    item.files.some((file) => file.source.endsWith('.module.scss'))
  ) {
    item.registryDependencies.add('styles')
  }

  if (['ui', 'chart', 'primitive', 'hook'].includes(item.type)) {
    // The JSX transform imports @vorzelajs/dom/jsx-runtime even when the
    // component source has no explicit runtime import.
    item.dependencies.add(specFor('@vorzelajs/core'))
    item.dependencies.add(specFor('@vorzelajs/dom'))
  }
  if (item.name === 'data-table' || item.name === 'simple-data-table') {
    item.dependencies.add(specFor('@vorzelajs/table'))
  }
  if (item.name === 'chart-shared') {
    item.devDependencies.add(specFor('@types/d3'))
  }
  if (item.name === 'sankey-chart') {
    item.devDependencies.add(specFor('@types/d3-sankey'))
  }
  item.registryDependencies.delete(item.name)
}

// ── Emit ──────────────────────────────────────────────────
const indexItems = []
for (const item of definitions) {
  const files = item.files.map((file) => ({
    path: file.output,
    content: rewriteSource(file.source, read(file.source)),
  }))

  const payload = {
    name: item.name,
    type: item.type,
    version,
    dependencies: [...item.dependencies].sort(),
    devDependencies: [...item.devDependencies].sort(),
    registryDependencies: [...item.registryDependencies].sort(),
    files,
    description: item.description,
    alias: item.alias,
  }

  fs.writeFileSync(
    path.join(registryDir, `${item.name}.json`),
    JSON.stringify(payload, null, 2) + '\n',
  )

  indexItems.push({
    name: item.name,
    type: item.type,
    version,
    dependencies: payload.dependencies,
    devDependencies: payload.devDependencies,
    registryDependencies: payload.registryDependencies,
    description: payload.description,
    alias: payload.alias,
    files: payload.files.map((file) => file.path),
  })
}

fs.writeFileSync(
  path.join(registryDir, 'index.json'),
  JSON.stringify(
    {
      version,
      items: indexItems.sort((a, b) => a.name.localeCompare(b.name)),
    },
    null,
    2,
  ) + '\n',
)

console.log(
  `Built ${indexItems.length} registry items (${uiComponents.length} UI components, ${charts.length} charts).`,
)
