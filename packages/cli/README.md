# VorzelaJS UI CLI

Copy VorzelaJS UI components into an app, shadcn-style.

```bash
node packages/cli/bin/vorzelajs-ui.mjs init
node packages/cli/bin/vorzelajs-ui.mjs add button card table data-table
```

Reads `vorzelajs.ui.json`, resolves registry dependencies, rewrites `~/...`
imports to the configured aliases and recomputes the SCSS `@use 'styles'` path.
`DataTable` and `SimpleDataTable` install `@vorzelajs/table` and the shared
`lib/table.ts` feature set.

Commands: `init`, `add`, `list`, `update`, `status`, `diff`, `doctor`.

Flags: `--registry <url|path>`, `--cwd <dir>`, `--dry-run`, `--overwrite`,
`--no-install`, `--yes`, `--force`.

The registry is generated from the component source with
`npm run registry:build`. Never edit `registry/` by hand.
