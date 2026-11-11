# Workspace structure and setup

Backend foundation update (2026-10-27): the single root Git repository is present. `backend/` now implements API/configuration/database foundation, SQL migrations and tests, with shared foundation contracts in `contracts/`. See [backend setup/status](../backend/README.md) and [embedded-wallet requirements](../backend/EMBEDDED-WALLET-SETUP.md). Root commands now include `dev:backend`, `db:migrate`, `test:backend` and `check:backend`; `check` includes backend checks. Default private media storage is `backend/.data/media/`. The reserved-backend and Git-initialization descriptions below are historical. Frontend source, designs, routes and local storage remain unchanged in this increment.

Reorganized 2026-10-27 within `/Users/azayel/monk`. This is a source/tooling move, not a backend milestone implementation or UI redesign.

## Ownership

- `frontend/src/`: existing React pages, routing, browser state, styles, reusable components, and frontend service adapters. `frontend/public/` retains bundled fixture images, SVG artwork, sample video and captions. These are source assets, not user uploads. Vite continues to serve them at `/art`, `/assets`, `/media` without changing routes or asset URLs.
- `frontend/scripts/`: existing model/render/browser checks, capture tooling and asset-generation utilities. Shared `paths.mjs` selects frontend working directory and root review/artifact outputs; it resolves Vite from installed dependencies rather than assuming a frontend-local node_modules. `frontend/tests/` is reserved for future frontend browser/unit test organization; current checks remain in scripts to minimize the move.
- `backend/src/api/`: future API route handlers, authentication/session and House/resource authorization. README placeholder only.
- `backend/src/config/`: future server-only environment parsing, service configuration and secret loading. README placeholder only.
- `backend/src/jobs/`: future media worker entry and job handlers. README placeholder only.
- `backend/src/media/`: future storage/FFmpeg adapters, not uploaded bytes. README placeholder only.
- `backend/migrations/`: future ordered SQL migrations. No database schema or service is implemented here.
- `backend/tests/`: future auth/permissions/API/database/worker integration tests. README placeholder only.
- `contracts/src/`: browser/server-neutral API types, JSON Schema objects and runtime guards. The existing ServiceResult/UploadReceipt contracts moved here; preview-specific HouseDraft/ContentDraft models remain in frontend. No contracts module imports frontend/backend code, Node builtins, credentials, database libraries or server frameworks. A separate ES-only TypeScript check enforces portability.
- `docs/`: project documentation. The proposed vertical slice still requires approval. Directory names in older historical reports represent the pre-move layout; current root README and this document are authoritative.
- Root `scripts/`: workspace import-boundary check and compatibility review entry point, not application implementation.

There is one root npm workspace manifest/lockfile with frontend/backend/contracts members. Backend has a private placeholder package with no run script or dependencies. Dependencies are installed at the root; the pre-existing node_modules directory was retained. The root lockfile was regenerated offline using the existing dependency resolutions, without adding a network dependency. Original manifest/lock/README/ignore copies remain in ignored `artifacts/restructure/` for preservation.

## Commands

Run `npm ci` at the root for a clean installation, not separate installs inside each directory. Node 22/npm 10 is the supported baseline. `npm run dev -- --port 5173 --strictPort` delegates to the frontend workspace. `npm run build` delegates to its TypeScript/Vite build. `npm test` runs all retained model/render checks plus the new transport/contract checks. `npm run check` also validates import boundaries and standalone contracts. Built output is `frontend/dist/` and temporary test bundles are `frontend/.qa/`, both ignored.

`npm run review` / `npm run capture` runs `frontend/scripts/review-package.mjs` and writes a fresh timestamped root `review/current-state-*/` with ZIP, manifest, current source/contract hashes, tests and honest browser results. `node scripts/review-package.mjs` is a compatibility wrapper. `npm run capture:routes` retains focused Discovery/Exchange captures at root `review/discovery-exchange/`; `npm run test:browser` retains the broader older capture suite. No historical screenshot is substituted when Chrome/localhost is blocked. Existing review packages were not moved or rewritten.

Root run commands and all moved standalone scripts normalize their working directory so `node frontend/scripts/render-check.mjs` also works from the root. Browser checks use `frontend/public` as their local media/file-selection source. Root docs are copied into review packages; root `review/` and `artifacts/` remain outside application source.

## API boundary

`frontend/src/api.ts` owns HTTP fetch and accepts a base URL plus injectable transport. `VITE_API_BASE_URL=/api` is the default; an absolute HTTP(S) URL is supported for later cross-origin deployments. Credentials are included for future session cookies; an eventual cross-origin API must explicitly permit the frontend origin/credentials and apply its own CSRF/session checks.

The client only accepts resource paths under its configured base, validates responses using shared guards, normalizes permission/network/cancellation/invalid-response failures, and rejects origin replacement/traversal. Constructing/exporting it does not make a request. `frontend/src/creator-services.ts` re-exports this boundary for future remote adapters and consumes/re-exports the shared contracts. **All current creator service methods still return unavailable.** No endpoints were invented or enabled during this restructuring.

`frontend/.env.example` contains only public/placeholder settings. Copy to ignored `frontend/.env.local`, then restart Vite after changing environment values:

```dotenv
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://127.0.0.1:3001
```

Vite proxies `/api` to the configurable target for local development; it does not implement an API or start a backend. Normal fixture browsing does not call the absent backend. Frontend must never import implementation from backend; contracts must never import either app or server-only libraries. Root `npm run check:boundaries` checks imports and direct fetch placement; contracts are separately typechecked with no DOM/Node type libraries.

Frontend-to-contract relative imports are deliberate TypeScript source references within this workspace; Vite allows only frontend, shared contracts and hoisted dependency paths, rather than serving the future backend directory. There is no backend implementation reference. Later backend adapters may consume the same contracts package without moving server code into it.

## Persistence, secrets and runtime data

UI source, styles, route paths, static assets and browser-storage keys remain unchanged except moving service wire types/configuration into the boundary. Existing localStorage remains at the same origin under `munk-frontend-v2`, `munk-creator-preview-v1`, `munk-exchange-preview-v1` and `munk-reading-watching-progress-v1`; no migrations, clearing or conversion to server persistence occurs. Use the same 127.0.0.1:5173 address as before. Reload still requires enabling the explicit preview account.

The future backend will store private originals/processed uploads in ignored root `.data/media/` (or configured external storage), never frontend/public, backend/src, contracts or Git. Keep environment secrets in ignored environment files or a future server secret manager, never `VITE_` variables or contracts. .gitignore excludes runtime/upload directories, local database files, credentials/key files, logs, dependencies, build/test output and all generated root review/artifact packages. Example env files may be committed only with placeholders. Public sample assets already in frontend/public/media are intentionally source-controlled fixtures.

## Git and preservation

Before editing: no root/parent Git repository and no nested repository markers were found. A source/assets/scripts/docs hash inventory was captured before moves. `git init -b main` failed because this session cannot create `.git` (`Operation not permitted`). No nested repositories or replacement histories were created. The code layout is ready for one root repository, but repository initialization itself remains a local-terminal step:

```sh
cd /Users/azayel/monk
git init -b main
git status --short
```

Only initialize at the root; inspect untracked files/ignores before staging. No commit was requested or made. Existing work was moved, not discarded. `artifacts/restructure/` contains the original metadata and a preservation inventory/result; immutable historical timestamped review folders remain in place. The old root README is also retained in frontend/README.md with an added pointer to current setup.

## Validation boundary

Required checks for the move: root `npm run check`; standalone script resolution; a new complete `npm run review` attempt; source/static-asset preservation hashes and absence of nested repositories. Browser bind may still be blocked by this environment; a blocked capture is not UI verification. See the generated root artifacts/review output and final current-state note for actual results. No backend feature, database, reviewer flow, wallet service or cross-user publication was implemented.

Validation result for the restructuring: root `npm run check` passed (boundaries, ES-only contracts, frontend TypeScript/Vite build, all retained suites and configurable API checks). A complete root `npm run review` reran build/tests successfully and generated `review/current-state-2026-10-27T23-37-23-744Z/MUNK-CURRENT-STATE-REVIEW.zip`; 0/72 fresh captures were possible because localhost bind returned `listen EPERM`. This confirms the moved script reached server startup and completed manifest/ZIP generation; browser UI/media behavior remains unverified here. Preservation results locate all 175 inventoried original files; all 116 bundled assets and all UI/style source files are byte-identical. Only the creator-service wire-type extraction, path tooling and documentation were changed among existing files. All 68 previously locked dependency versions were retained.
