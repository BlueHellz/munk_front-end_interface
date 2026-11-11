# Discovery frontend pass — pending visual approval

Home now uses `Discovery.tsx`, `discovery-model.ts` and `discovery.css`: full-width shell, collapsible navigation, search and categories, a large lead feature with supporting tiles, dense horizontal shelves and fixture series pages. Fixed editorial arrays specify ordering. Continue reading/watching uses actual native media time and article scroll position, stored separately in `munk-reading-watching-progress-v1`.

Exchange uses `HouseMosaic.tsx` by default. Four existing House records occupy mixed-size visual tiles; no invented duplicate Houses were added to inflate density. Identity, sample symbol/price/change, watchlist and blue/green actions are always visible. Comparison remains selectable. Market previews retain separate market prices and illustrative valuation scores, and add explicit ownership context. There is no coin issuance, transaction, live pricing or real ownership verification.

`fixtures.ts`, `model.ts`, `Designer.tsx` preserve legacy configurations with no layout field. New profiles use the named MUNK Discovery preset. Explicit layout switches snapshot the prior design. Existing local records are not migrated or erased. Discovery uses fixed editorial shelves; customizable section ordering remains available in Classic. Preview-only URL: `#/home?preset=discovery`.

`App.tsx` scopes the full-width shell to network Home/Exchange. House themes, mandatory reserved intro, identities and existing content routes remain separate. `Home.tsx` retains Classic. `Series.tsx` adds two fixture series with correctly owned episode destinations. `Video.tsx` and `Article.tsx` record real local progress; `visual-fixes.css` constrains player width independently of aspect ratio to address tablet clipping.

Original artwork: `scripts/create-house-art.mjs` creates licensed CC0 SVG illustrations in `public/art/`. No game assets or third-party branding are copied. Legacy screen photo/portrait substitutions remain unchanged.

Build and 58 model/server-render assertions pass. Browser behavior, fresh screenshots, playback progression and rendered reference matching are NOT verified for this pass: local listener creation is denied with EPERM. Chrome also aborted exit 134 in the visual reference inspection attempt. Reference-site text was readable, so implementation follows the established brief with unverified assumptions about exact visual rhythm and spacing.

Run `npm run capture` (Node 22, installed Chrome) in ordinary Mac Terminal, or `MUNK_URL=http://127.0.0.1:5173 npm run capture` against an already running server. Expected output: 36 PNGs in `/Users/azayel/monk/review/discovery-pass/screenshots/`, plus results and a file manifest in its parent. The script checks five widths and captures three. Its README/JSON state actual successes/failures; PNG presence alone is not visual approval.

No backend, blockchain, deployment or infrastructure changes. All account gates remain labeled local previews. Comments, messages and live interactions retain their previous local-only boundaries.
