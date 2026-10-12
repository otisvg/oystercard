# Margin

Offline-first Markdown writing PWA: Vite + TypeScript + React + CodeMirror 6, with IndexedDB storage. See README.md for the feature list and the source layout.

## Commands

- `npm run typecheck`, `npm test` (Vitest, unit), `npm run build`
- `npm run test:e2e` (Playwright, builds and serves on :4173). In the Claude Code cloud container, set `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` and don't run `playwright install`; Playwright is pinned to 1.56.1 to match that Chromium. Playwright reuses a server already on :4173 locally, so stop any stale `vite preview` first (or set `CI=1`).

## Conventions

- Pure logic lives in `src/text/` and `src/history/` and is unit-tested. Keep editor extensions thin on top of it.
- The editor lives outside React (`src/editor/bridge.ts`); app behaviour lives in `src/actions.ts`; components stay mostly presentational.
- Keep optional features lazily loaded (preview, export, history, tagger) so the main chunk stays React + CodeMirror.
- Never reload or overwrite the user's text without saving first; restoring a version snapshots the current text before replacing it.
