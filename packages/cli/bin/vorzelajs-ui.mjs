#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'

import {
  add,
  diff,
  doctor,
  init,
  list,
  status,
  update,
} from '../lib/commands.mjs'

function parseArgs(argv) {
  const positional = []
  const flags = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--yes' || arg === '-y') flags.yes = true
    else if (arg === '--force' || arg === '-f') flags.force = true
    else if (arg === '--dry-run' || arg === '-n') flags.dryRun = true
    else if (arg === '--overwrite') flags.overwrite = true
    else if (arg === '--no-install') flags.noInstall = true
    else if (arg === '--registry') {
      flags.registry = argv[index + 1]
      index += 1
    } else if (arg === '--cwd') {
      flags.cwd = argv[index + 1]
      index += 1
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}

const { positional, flags } = parseArgs(process.argv.slice(2))
const command = positional.shift()
const cwd = path.resolve(flags.cwd ?? process.cwd())

async function main() {
  switch (command) {
    case 'init':
      await init(cwd, flags)
      break
    case 'add':
      await add(cwd, positional, flags)
      break
    case 'update':
      await update(cwd, positional, flags)
      break
    case 'list':
      await list(cwd, flags)
      break
    case 'status':
      await status(cwd, flags)
      break
    case 'diff':
      if (!positional[0]) throw new Error('Usage: vorzelajs-ui diff <component>')
      await diff(cwd, positional[0], flags)
      break
    case 'doctor':
      await doctor(cwd, flags)
      break
    default:
      console.log(`
VorzelaJS UI CLI

  vorzelajs-ui init
  vorzelajs-ui add <component...>
  vorzelajs-ui update [component...]
  vorzelajs-ui list
  vorzelajs-ui status
  vorzelajs-ui diff <component>
  vorzelajs-ui doctor

Components are copied into your app, shadcn-style. Table and data-table
components keep @vorzelajs/table as a runtime dependency.

Flags:
  --registry <url|path>   Override registry
  --cwd <dir>             Run in another directory
  --dry-run               Show changes without writing
  --overwrite             Replace existing files on add
  --no-install            Do not run the package manager
  --yes                   Accept safe updates only
  --force                 Replace modified files without asking
`)
      process.exitCode = command ? 1 : 0
  }
}

main().catch((error) => {
  console.error(`\x1b[31m✖\x1b[0m ${error.message}`)
  process.exitCode = 1
})
