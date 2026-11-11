# MUNK

Personal Home and actual public Houses now use a shared, server-persisted interface system with four viewer skins (MUNK Estuary is the new default), two House presentations, section editing and revision restoration. Discovery reads the real published catalog. See [interface customization and browser steps](backend/INTERFACE-CUSTOMIZATION.md).

**Current local MVP: Demo mode.** Blank House creation and preserved-draft continuation are available without admission/review. Authentication, ownership and upload security remain real. House readiness is separate from explicit video publication. See [local demo behavior and safeguards](backend/LOCAL-DEMO.md). Strict admission instructions below describe the separate strict mode.

One npm-workspace project for the existing React/Vite UI, shared contracts and backend. Privy signup/user-owned wallets and existing-wallet login now connect to verified persistent backend sessions, House drafts/permissions, private media uploads/processing and Manual creator review. See [startup and first-account walkthrough](backend/PRIVY-DEVELOPMENT.md). Enter the required read-only Privy secret only in ignored backend/.env. Real video publication, guest playback/seeking and actual House video listings are connected; see [local video publishing](backend/VIDEO-PUBLISHING.md). The separate fixture catalog is retained. No local preview account grants authentication. No paid services, deployment, trading or blockchain transactions.

```text
/Users/azayel/monk/
├── frontend/        Existing React/Vite app, bundled assets, checks and capture tools
├── backend/         API, database, permissions, uploads, media worker and review services
├── contracts/       Portable API types, JSON schemas and runtime guards
├── docs/            Current-state handoff, setup, architecture and proposed milestone
├── scripts/         Workspace boundary check and legacy review-command wrapper
├── package.json     Root run/build/check/review commands
├── package-lock.json
├── review/          Generated review packages; preserved locally, ignored by Git
└── artifacts/       Generated checks/preservation records; ignored by Git
```

Use Node 22/npm 10. Run from the root; install dependencies once at the root, using its single workspace lockfile:

```sh
cd /Users/azayel/monk
npm ci
npm run dev -- --port 5173 --strictPort
```

Open **http://localhost:5173/#/home**. This is the exact Privy development origin. Existing drafts/designs at 127.0.0.1:5173 are untouched but use separate browser storage; they are not automatically migrated. No existing localStorage was cleared.

```sh
npm run build              # frontend/dist
npm test                   # all existing frontend checks + API-boundary checks
npm run check              # boundaries, contracts, backend, build, frontend/backend tests
npm run test:native --workspace backend  # isolated native PostgreSQL + FFmpeg integration
npm run preview -- --port 4173
```

Generate a **new timestamped review package** with fresh desktop/tablet/mobile capture attempts, tests, report, inventories, manifest and ZIP:

```sh
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run review
```

Output remains `review/current-state-<timestamp>/MUNK-CURRENT-STATE-REVIEW.zip` at the root. Chrome is required; blocked browser startup is reported honestly. `npm run capture` is an alias for the complete package; `npm run capture:routes` runs the focused Discovery/Exchange capture; `npm run test:browser` retains the older interaction/capture suite. The compatibility command `node scripts/review-package.mjs` still works. Do not run copied scripts inside generated packages; use the source repository command.

For future API adapters, copy `frontend/.env.example` to the ignored `frontend/.env.local`. `VITE_API_BASE_URL` defaults to `/api`; `API_PROXY_TARGET` defaults to `http://127.0.0.1:3001` for Vite's local `/api` proxy. Authentication, Houses, uploads and video publication use the API; unfinished preview services still report unavailable. Never put secrets in `VITE_` values: they are public browser configuration. No backend is started by these commands.

See [workspace setup](docs/PROJECT-STRUCTURE.md), [frontend handoff](docs/MUNK-CURRENT-STATE.md), and the [vertical slice](docs/MUNK-VERTICAL-SLICE-PLAN.md). The plan is now approved with embedded wallet creation required; backend/README.md supersedes historical reserved-backend/existing-wallet-only planning text.

The single Git repository is present at the workspace root. Historical reports of blocked initialization predate this increment. Inspect with:

```sh
cd /Users/azayel/monk
git status --short
```

Do not initialize Git in frontend/, backend/ or contracts/. No existing repository was overwritten, no commits were discarded, and no commit or automatic bulk staging was performed.
