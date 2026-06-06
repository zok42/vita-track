# VitaTrack — Agent Guide

## Commands
| Command | What it does |
|---|---|
| `npm run electron:dev` | Start Vite dev server + Electron concurrently |
| `npm run dev` | Vite dev server only (browser testing; DB API calls will fail) |
| `npm run electron:build` | `vite build` then `electron-builder`, output in `release/` |
| `npm run postinstall` | `electron-rebuild` for `better-sqlite3` native module (required after `npm install`) |

No tests, no linter, no typechecker configured.

## Architecture
- **Main process** (`electron/main.js`): ESM — creates BrowserWindow, registers `ipcMain.handle()` handlers, inits SQLite
- **Preload** (`electron/preload.cjs`): CommonJS (`.cjs`), exposes `window.api` via `contextBridge.exposeInMainWorld`
- **Renderer** (`src/`): React 18 + JSX, bundled by Vite, talks to main process exclusively through `window.api.*` (no `nodeIntegration`)
- **DB** (`electron/database.js`): `better-sqlite3` with WAL mode, stored at `app.getPath('userData')/vitatrack.db`

## Module system
`"type": "module"` in package.json. All `.js` files are ESM. Preload and PDF must be `.cjs` (CommonJS) because Electron requires CJS for preload, and PDFKit uses `require`.

## Database quirks
- `upsertMeal(date, mealType, ...)` inserts or updates based on `(date, meal_type)` uniqueness (no standalone `addMeal`)
- Schema CHECK constraint on `workouts.type` allows: `'walking'`, `'cycling'`, `'swimming'`, `'workout'`, `'tai chi'`, `'paddling'`, `'other'` (widen via migration)
- Legacy migration: `meal_number` column → `meal_type` (runs silently at startup)

## Style
- German-localized UI (labels, date formats `de-DE`)
- Emoji prefixes on all meal types, workout types, and intensity labels
- Alternating row colors (`even`/`odd`) on tables
- No CSS framework — plain `App.css` with custom properties
- Logo at `src/assets/logo.svg` used as favicon and window icon

## Pervasive naming
- camelCase in JS/React, snake_case in DB columns
- IPC channel names: kebab-case (e.g., `'get-meals'`, `'upsert-meal'`)
