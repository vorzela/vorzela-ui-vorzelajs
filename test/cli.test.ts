// @vitest-environment node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = path.join(root, 'packages/cli/bin/vorzelajs-ui.mjs')
const registry = path.join(root, 'registry')

function project(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vorzelajs-ui-'))
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture', private: true, type: 'module' }),
  )
  return dir
}

function run(cwd: string, ...args: string[]): string {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, '--cwd', cwd, '--registry', registry, '--no-install'],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout)
  }
  return result.stdout
}

describe('vorzelajs-ui CLI', () => {
  it('initializes the expected folders and config', () => {
    const cwd = project()
    run(cwd, 'init')

    const config = JSON.parse(
      fs.readFileSync(path.join(cwd, 'vorzelajs.ui.json'), 'utf8'),
    )
    expect(config.paths.components).toBe('src/components/ui')
    expect(config.paths.styles).toBe('src/styles')
    expect(fs.existsSync(path.join(cwd, 'src/components/ui'))).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'src/styles'))).toBe(true)
  })

  it('adds components, rewrites aliases and installs table dependencies', () => {
    const cwd = project()
    run(cwd, 'init')
    run(cwd, 'add', 'Button', 'DataTable')

    const button = fs.readFileSync(
      path.join(cwd, 'src/components/ui/button.tsx'),
      'utf8',
    )
    expect(button).toContain("from '~/lib/cx.ts'")
    expect(button).not.toContain('../../lib/cx.ts')

    const table = fs.readFileSync(
      path.join(cwd, 'src/components/ui/data-table.tsx'),
      'utf8',
    )
    expect(table).toContain("from '@vorzelajs/table'")
    expect(table).toContain("from '~/lib/table.ts'")
    expect(
      fs.existsSync(path.join(cwd, 'src/components/ui/simple-data-table.tsx')),
    ).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'src/lib/table.ts'))).toBe(true)

    const scss = fs.readFileSync(
      path.join(cwd, 'src/components/ui/data-table.module.scss'),
      'utf8',
    )
    expect(scss).toContain("@use '../../styles' as vz;")
  })

  it('normalizes PascalCase names and lists the registry', () => {
    const cwd = project()
    run(cwd, 'init')
    run(cwd, 'add', 'SimpleDataTable')

    expect(
      fs.existsSync(path.join(cwd, 'src/components/ui/simple-data-table.tsx')),
    ).toBe(true)

    const list = run(cwd, 'list')
    expect(list).toContain('data-table')
    expect(list).toContain('simple-data-table')
  })
})

interface RegistryItem {
  name: string
  dependencies: string[]
  registryDependencies: string[]
  files: string[]
}

interface RegistryIndex {
  items: RegistryItem[]
}

describe('registry table contract', () => {
  it('keeps both data tables on @vorzelajs/table', () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(registry, 'index.json'), 'utf8'),
    ) as RegistryIndex
    const byName = new Map(
      index.items.map((item: RegistryItem) => [item.name, item]),
    )

    for (const name of ['data-table', 'simple-data-table']) {
      const item = byName.get(name)
      if (!item) throw new Error(`Missing registry item: ${name}`)
      expect(
        item.dependencies.some((dep) => dep.startsWith('@vorzelajs/table@')),
      ).toBe(true)
      expect(item.registryDependencies).toContain('lib-table')
    }

    const libTable = byName.get('lib-table')
    if (!libTable) throw new Error('Missing registry item: lib-table')
    expect(
      libTable.dependencies.some((dep) => dep.startsWith('@vorzelajs/table@')),
    ).toBe(true)
  })

  it('has no missing registry dependencies or duplicate output paths', () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(registry, 'index.json'), 'utf8'),
    ) as RegistryIndex
    const names = new Set(index.items.map((item: RegistryItem) => item.name))
    const paths = new Map<string, string>()

    for (const item of index.items) {
      for (const dependency of item.registryDependencies ?? []) {
        expect(names.has(dependency)).toBe(true)
      }
      for (const file of item.files ?? []) {
        expect(paths.has(file)).toBe(false)
        paths.set(file, item.name)
      }
    }
  })
})
