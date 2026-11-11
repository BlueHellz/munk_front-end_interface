# Current Exchange update

The default is now the House mosaic; this document below describes the retained secondary comparison mode and historical capture setup. Current commands/output and limitations are in [discovery-pass.md](discovery-pass.md). All old browser-script entry points now delegate to the unified `npm run capture` batch at `review/discovery-pass/`. No reference fingerprint baseline comparison is claimed.

# Exchange comparison correction

Scope: only the Home Exchange tab and its House-market preview. Stories and the existing House/video/article/Board layouts are retained. Backend work and real financial functionality remain paused.

## Open

```sh
cd /Users/azayel/monk
npm run dev -- --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/#/home?tab=exchange** directly. Stories is not the Exchange review target.

## Implemented frontend

- Four compact House cards, each with a 52px cover (66px in comfortable density), icon, House name, matching creator, content category and fictional coin symbol.
- Sample USD coin price, change from the last two fictional daily history records, seven-day SVG sparkline, sample 24h volume and sample market capitalization.
- Separate 0–100 House valuation score, explicitly a fixed illustrative score rather than money, an appraisal, investment return or implemented valuation algorithm.
- Blue Enter House and green View market actions. House destinations use actual House IDs. Market previews use `#/home?tab=exchange&market=<house-id>` and name the matching House/creator.
- Market preview shows the same fictional records, full sample values and history table. There are no buy, sell, swap, transfer, wallet approval or transaction controls.
- Search by House, creator or sample symbol. All/Video/Writing filters include both-category Houses in the relevant content filter. Watchlist-only filter and ascending/descending sort by displayed change, volume or valuation score.
- Independent density and 2/3/4-column desktop preferences. At 761–1279px the grid uses two columns; at 760px and below it uses one column. The UI explains these responsive overrides. Default desktop is four columns.
- Accessible star watchlist toggles use the existing explicit local wallet-account preview gate. No real account or authentication is introduced.
- Settings/watchlist persist separately under `munk-exchange-preview-v1`, with validation, safe defaults and visible storage-failure warnings. They do not change Home design or content bookmarks.

All financial figures/charts/symbols are fictional fixtures and are labeled as sample data. No actual coin is issued and no live market is connected. Market price and House valuation score remain distinct. The original reference photo crops remain, but only as small banners/icons in Exchange.

## Files

- `src/Exchange.tsx`: comparison UI and House-specific preview dialog.
- `src/exchange-model.ts`: fictional metrics, filters/sorts and separate local preferences.
- `src/exchange.css`: Exchange-scoped styles only.
- `src/Home.tsx`: replaces only the former Exchange directory branch with the new component.
- `scripts/exchange-check.mjs`: fixture/model/render checks, including pre-edit render fingerprints of Stories and five other pages.
- `scripts/exchange-browser-check.mjs`: Exchange-specific captures and browser journey tests.

## Verification commands

```sh
node scripts/exchange-check.mjs
npm test
npm run build
```

In a second Terminal, with Vite already running:

```sh
cd /Users/azayel/monk
MUNK_URL=http://127.0.0.1:5173 node scripts/exchange-browser-check.mjs
```

With no server running, `node scripts/exchange-browser-check.mjs` starts its own Vite process. Node 22 and installed Chrome are required; `CHROME_PATH` can select a different Chrome binary. The browser uses an isolated temporary profile and does not clear your normal browser's local data.

Capture destination: **`/Users/azayel/monk/review/exchange/screenshots/`**.

The script selects Exchange explicitly, captures desktop 1440px, tablet 768px and mobile 390px, then checks column controls, search, filters, current fixture sorting, watchlist persistence, matching House/market destinations, keyboard focus and overflow. It also captures market previews and desktop column variants. The result JSON lists only screenshots actually produced.

Current agent execution is blocked at Vite listener startup; no Exchange screenshots or browser assertions passed. See `review/exchange/browser-check.json`. Pure/model/server-render checks are not evidence of visual approval.
