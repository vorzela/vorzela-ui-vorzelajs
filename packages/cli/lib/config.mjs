import fs from 'node:fs'
import path from 'node:path'

export const CONFIG_FILE = 'vorzelajs.ui.json'
export const MANIFEST_DIR = '.vorzelajs-ui'

export const DEFAULT_CONFIG = {
  registry:
    'https://raw.githubusercontent.com/vorzela/vorzela-ui-vorzelajs/main/registry',
  version: '0.1.3',
  aliases: {
    base: '~',
    components: '~/components/ui',
    primitives: '~/components/primitives',
    lib: '~/lib',
    hooks: '~/hooks',
    styles: '~/styles',
    charts: '~/charts',
  },
  paths: {
    base: 'src',
    components: 'src/components/ui',
    primitives: 'src/components/primitives',
    lib: 'src/lib',
    hooks: 'src/hooks',
    styles: 'src/styles',
    charts: 'src/charts',
  },
  css: 'src/styles/global.scss',
}

export function configPath(cwd) {
  return path.join(cwd, CONFIG_FILE)
}

export function readConfig(cwd) {
  const file = configPath(cwd)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function writeConfig(cwd, config = DEFAULT_CONFIG) {
  fs.writeFileSync(configPath(cwd), JSON.stringify(config, null, 2) + '\n')
  return config
}

export function targetFor(config, registryPath) {
  const normalized = registryPath.replaceAll('\\', '/')

  const mappings = [
    ['components/ui/', config.paths.components],
    ['components/primitives/', config.paths.primitives],
    ['lib/', config.paths.lib],
    ['hooks/', config.paths.hooks],
    ['styles/', config.paths.styles],
    ['charts/', config.paths.charts],
  ]

  for (const [prefix, target] of mappings) {
    if (normalized.startsWith(prefix)) {
      return path.join(target, normalized.slice(prefix.length))
    }
  }

  return path.join(config.paths.base, normalized)
}

export function rewriteImports(content, config) {
  let next = content
  const replacements = [
    ['~/components/ui/', `${config.aliases.components}/`],
    ['~/components/primitives/', `${config.aliases.primitives}/`],
    ['~/lib/', `${config.aliases.lib}/`],
    ['~/hooks/', `${config.aliases.hooks}/`],
    ['~/styles', config.aliases.styles],
    ['~/charts/', `${config.aliases.charts}/`],
  ]

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to)
  }

  return next
}

export function rewriteScss(content, target, config, cwd) {
  const stylesDir = path.resolve(cwd, config.paths.styles)
  const targetDir = path.dirname(path.resolve(cwd, target))
  let relative = path.relative(targetDir, stylesDir).replaceAll('\\', '/')
  if (!relative.startsWith('.')) relative = `./${relative}`
  return content.replaceAll("@use 'styles' as vz;", `@use '${relative}' as vz;`)
}
