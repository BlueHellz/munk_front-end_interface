> Retained frontend README from before the workspace move. For current root commands and directory ownership, use [../README.md](../README.md) and [../docs/PROJECT-STRUCTURE.md](../docs/PROJECT-STRUCTURE.md). Source paths below are relative to frontend/. Backend work remains pending approval.

# MUNK — frontend correction pass

This is the existing reference-led React frontend, corrected with entity routes, matching fixture identities, a personal Home designer, local threaded interactions, and a real bundled video sample. **Backend work remains paused. The frontend is not visually approved.**

## Open locally (ordinary Mac Terminal)

```sh
cd /Users/azayel/monk
# Dependencies are already present in this workspace. Use npm ci on a fresh checkout.
npm run dev -- --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/#/home**.

Examples:

- `/#/houses/off-grid`, `/#/houses/the-margin`, `/#/houses/field-notes`, `/#/houses/signal-hill`
- `/#/videos/the-long-way-home`, `/#/videos/tides-and-timing`, `/#/videos/city-to-forest`
- `/#/articles/a-quieter-notebook`, `/#/articles/on-tides-and-timing`
- `/#/board`, `/#/board/posts/morning-light`, `/#/board/posts/tides-and-letting-go`

Every work has its own route from `src/fixtures.ts`. Reload and hash history retain the entity ID. Unknown IDs show a not-found view rather than another work. Old generic `/#/house` and `/#/video` routes no longer identify an item; use the routes above.

## Verification and screenshots

```sh
npm run build
npm test
npm run capture
```

Node 22 and installed Google Chrome are required for capture. Set `CHROME_PATH` for a nonstandard installation. With Vite already running, use `MUNK_URL=http://127.0.0.1:5173 npm run capture`. The script uses an isolated browser profile and does not clear your normal browser data.

The batch captures Home Discovery, Exchange canvas, comparison, expanded Off Grid market, House, video, Board, article, thread, series, interface designer and Classic Home at 1440, 768 and 390px (36 PNGs). It additionally checks layouts at 1024 and 320px, actual media progression, filters, sorting, watchlist, identities, replies, preset restoration and reduced motion. Structural tests are not browser or visual verification.

Output: **`/Users/azayel/monk/review/discovery-pass/screenshots/`**. Read `../browser-check.json`, `../playback-progress.json`, `../screenshot-manifest.json` and the generated screenshots README for actual results. Latest attempt was blocked by `listen EPERM: operation not permitted 127.0.0.1:5173`; zero fresh PNGs and no fresh playback measurements were produced. Historical screenshots elsewhere are not verification of this pass.

## Preview boundaries

Guests may open House/content/thread pages, read fixture articles, search Houses and play the bundled sample. Account-requiring actions open a **frontend wallet-access preview**. Create/connect wallet buttons are explicitly unavailable. “Use local preview account” enables local actions for this tab only. There is no authentication, wallet connection, cryptography or security enforcement.

Film pages use `<video controls>` with an original 8-second, silent CC0 animation and a real VTT caption track. Native controls operate actual media. All works disclose that the sample is not creator footage. No full films, adaptive streaming or introduction videos are supplied. See `public/media/LICENSE.txt`. Modern Chrome supports the sample’s VP8/WebM format; unsupported playback displays an error instead of simulating success.

Messages are saved plaintext local drafts to the selected creator, never delivered. Live-room previews are explicitly local notebooks with zero connected audience; no broadcast or cross-user updates exist. Creator identity/admission remains unverified.

## Local data

Validated state is stored under `munk-frontend-v2`. It contains Home design, up to 30 saved versions/undo states, follows, bookmarks, repost IDs, like flags, comments/reply parents and House-addressed message drafts. Storage errors show a persistent in-memory-only warning. Same-browser reload/restart retains data when storage is available. Account-preview permission and local-room notes reset on reload.

Legacy `munk-*` keys from the old ambiguous-content preview are left untouched and are not imported into new item records. To reset only the new preview:

```js
localStorage.removeItem('munk-frontend-v2');
location.reload();
```

## Source

- `src/fixtures.ts`: typed entities, creator introductions, House themes and content references.
- `src/model.ts`: route resolution, validation, storage functions, thread/count/sort helpers.
- `src/state.tsx`: stable shared state and explicitly non-authenticating wallet gate.
- `src/App.tsx`: preserved shell and route composition.
- `src/Home.tsx`, `House.tsx`, `Video.tsx`, `Article.tsx`, `Board.tsx`: stable page components.
- `src/components.tsx`: cards, recursive thread renderer and keyboard-contained dialog.
- `src/Designer.tsx`: section/font/surface/spacing/density/grid editor and version restoration.
- `src/Dialogs.tsx`: matching introductions/recipients, local room and disclosures.
- `src/styles.css`: original reference styling plus scoped corrections and responsive rules.

No service, database, deployment, paid infrastructure or decentralized protocol was added. See `docs/frontend-status.md` and `docs/assets.md` for limits.

## Discovery and Exchange pass

Fresh profiles use **MUNK Discovery**. Existing saved layouts retain their previous appearance and data. Preview the new layout without saving at **http://127.0.0.1:5173/#/home?preset=discovery**. To select it permanently, open **Presets & design** (or **Edit Home / Choose a preset** in Classic), enter the explicitly local account preview, choose **MUNK Discovery**, then **Save Home**. Switching layouts saves the previous design in version history; undo and restoration remain available. Discovery has fixed editorial shelves; Classic retains custom section ordering.

Home has a collapsible rail, prominent search, category shortcuts, varied feature tiles and horizontal shelves for films, writing, series, followed Houses and all Houses. Ordering is explicitly editorial; unfinished reading/watching uses measured local progress, not a fabricated activity feed. Series use real fixture episode routes.

Exchange: **http://127.0.0.1:5173/#/home?tab=exchange&view=mosaic**. House canvas is the default; comparison is secondary. Search, categories, sorting, watchlist and density work on four House fixtures. Identity, sample price/change and actions remain visible without hover. Detailed chart/volume/capitalization/valuation/ownership context is in each matching market preview. All financial records are illustrative; there is no trading.

New Home/Exchange images are original CC0 scalable 1600×1000 SVG illustrations under `public/art/`, not enlarged screenshot crops or reference-site game assets. They are temporary artwork, not supplied creator photography. Existing legacy screens retain their previous temporary imagery. The MUNK wordmark is unchanged.

Reference pages were accessible as text, but sandboxed Chrome aborted with exit 134 during attempted visual inspection. Reference-exact visual matching and tablet clipping correction remain unverified in a browser. The player sizing fix removes aspect-ratio/min-height pressure; the capture suite measures actual player bounds when run outside this environment.

See `docs/discovery-pass.md` for files and implementation boundaries. Backend, blockchain, deployment and paid infrastructure remain paused.

## Catalog-density refinement

Exchange now has 20 distinct fictional Houses and 47 owned fixture works with original sharp House/work artwork. Canvas is compact with periodic size variations, no oversized lead. Search/modes stay visible; advanced controls use Filters & sort; comparison columns appear only in comparison. Discovery sections now support show/hide/reorder in Presets & design. A shared network rail wraps every page while House themes/introductions remain independent. Existing local designs and versions remain valid.

Rebuild the complete current review ZIP with one command: `node scripts/review-package.mjs`. It captures 30 fresh views in a new timestamped review folder, records blocked captures honestly, verifies ZIP contents and opens the folder. No backend/blockchain/deployment work was added.
