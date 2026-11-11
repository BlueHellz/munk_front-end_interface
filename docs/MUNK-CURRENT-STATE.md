# MUNK current-state engineering handoff

Workspace update: the existing app now lives in `frontend/`, shared API result/upload contracts in `contracts/`, and the future server is reserved under `backend/`. See [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) for current commands and paths. No backend features were implemented. Source references in the earlier audit below such as `src/...`, `public/...` and application `scripts/...` now resolve under `frontend/`; root `docs/`, `review/` and `artifacts/` remain at the root. Use root `npm run dev`, `npm run check` and `npm run review`. The complete root check passed after the move, including existing design/route tests and new API-boundary checks. The fresh review package generated successfully, but browser captures remain blocked (0/72) by localhost `listen EPERM`; see root `review/current-state-2026-10-27T23-37-23-744Z/`. Root Git initialization was attempted and blocked by filesystem permissions; run `git init -b main` locally.

Planning update: the proposed next milestone is now the end-to-end **video** vertical slice in [MUNK-VERTICAL-SLICE-PLAN.md](MUNK-VERTICAL-SLICE-PLAN.md), pending approval. It supersedes the older article-first continuation recommendation below. No backend implementation has begun.

Updated 2026-10-27 after inspecting the source and completing the requested frontend pass. MUNK remains a **local frontend preview**, not a production-ready, authenticated or multi-user publishing service. No deployment, infrastructure purchase, trading, blockchain, identity verification or real media processing was performed. This report supersedes older frontend-status/README paragraphs where they conflict.

The workspace `/Users/azayel/monk` has no Git repository, so branch, commit, historical diff and clean-tree claims cannot be established. Review packages hash the actual `src/` and `public/` files before/after verification. This pass intentionally changes application source; the package's unchanged-hash result means unchanged **during the final capture/check run**, not unchanged since the previous handoff.

## 1. Stack, project and startup

`package.json`: React 18.3.1, React DOM 18.3.1, lucide-react 0.312.0; TypeScript 5.9.3, Vite 5.4.21, React Vite plugin 4.7.0, esbuild 0.21.5, React/DOM types 18.3.31/18.3.7. No runtime dependency was added. Installed/extraneous node_modules packages are not evidence of backend integration.

`index.html` → `src/main.tsx` → StrictMode/App → viewer Provider → CreatorProvider → Shell. Custom hash routing in `model.ts`, not React Router. Styles load `styles.css`, `visual-fixes.css`, `discovery.css`, then `creator.css`; Exchange imports `exchange.css`. Final scoped rules take precedence over legacy rules. Wordmark remains the original raster asset. Unified default styling uses Arial/Helvetica body, established serif/handwritten headings, cat-orange/peach/ivory surfaces, blue primary actions and green approval/monetary actions. Approved literary/modern variations are opt-in design settings.

```sh
cd /Users/azayel/monk
npm ci                                  # only if dependencies need installing
npm run dev -- --port 5173 --strictPort
# Open http://127.0.0.1:5173/#/home
npm run build                           # tsc -b && vite build; outputs dist/
npm run preview -- --port 4173
npm test                                # model/service/server-render checks
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/review-package.mjs
```

Observed environment: Node v22.23.2/npm 10.9.8. Review capture requires Node 22 native WebSocket, installed Chrome, local ports 5173/9224, and zip/unzip tools. `CHROME_PATH` and `MUNK_CDP_PORT` override browser path/debug port. Vite/static preview is not an API or persistent application backend.

| Source | Responsibility |
| --- | --- |
| `src/App.tsx`, `state.tsx`, `model.ts` | Shared network navigation, route resolution, preview-account gate, viewer state and dialogs |
| `src/fixtures.ts`, `fictional-catalog.ts` | Fictional Houses/creators/themes/introductions, works, posts/comments, presets and assets |
| `src/Home.tsx`, `Discovery.tsx`, `discovery-model.ts` | Classic/Discovery/My mix, shelves/search/series metadata |
| `src/Exchange.tsx`, `HouseMosaic.tsx`, `exchange-model.ts` | Illustrated mosaic, comparison, sample markets and local preferences |
| `src/House.tsx`, `Video.tsx`, `Article.tsx`, `Series.tsx`, `Board.tsx` | Existing fixture entity pages and local participation |
| `src/Creator.tsx` | Account-gated House setup, workspace, video/article editors, private reading/viewing preview, House designer/shared House renderer |
| `src/creator-model.ts` | Versioned creator state, file/admission/content/design validation, templates, draft defaults, plain-text paragraph normalization |
| `src/creator-state.tsx` | Separate creator context, storage adapter/warnings and tab-local File/object-URL lifetime |
| `src/creator-services.ts` | Typed draft repository/service contracts; explicitly unavailable backend implementation |
| `src/design-system.tsx` | Application-owned component registry/section renderer and shared responsive style variables |
| `src/Designer.tsx`, `components.tsx`, `Dialogs.tsx`, `progress.ts` | Existing Home editor, cards/threads/dialogs, local messaging/rooms and measured progress |
| `public/art`, `public/assets`, `public/media` | Illustrations, retained wordmark/temporary legacy imagery, original shared WebM/VTT/license |
| `scripts/*check.mjs`, `review-package.mjs` | Model/service/render verification and isolated browser journeys/screenshots |
| `docs`, `review`, `artifacts`, `.qa`, `dist` | Documentation, timestamped reviews, results, temporary bundles and compiled app |

## 2. What changed in this pass

- Added gated Create a House and Creator workspace entries to the existing network rail. Direct creator URLs show a permission state until the existing local preview account is enabled. No email/password account was introduced.
- Added a four-step House draft journey: House details/address/focus; public creator information and face-visible introduction; limited templates; preview/missing requirements/admission request. Separate identity, introduction-review and admission statuses never advance merely because a file is chosen. Draft saving/resumption is real local browser persistence; admission submission reports unavailable.
- Added overview, local library, upload/processing queue, House Design, community and settings panels. Founder/accountable operator are explained as creator responsibilities; future ownership interests are separate, unimplemented concepts.
- Added video drop/file selection, MIME/size checks, local native playback, thumbnail/captions selection, title/description, series/episode metadata with ordered private series in the library, drafts, request cancellation/retry and queue navigation. No fake transfer percentage, transcoding completion or transfer resume exists.
- Added plain-text article editor, cover selection, local draft reopening, reading preview and unavailable publish/unpublish actions. User markup is escaped by React and never passed to `dangerouslySetInnerHTML`.
- Added a separate versioned House design configuration, three templates, section hide/reorder, approved theme controls, responsive columns, inert component previews, undo/cancel/save and version restoration. The House introduction is outside the registry and cannot be removed or reordered.
- Extended the existing personal Home editor: legacy design schema remains valid, new saves carry schemaVersion 1; restoration/undo-save choices are drafts until Save Home, with an explicit Cancel. Discovery House shelves now consume actual column/density preferences as responsive House grids. Classic uses its existing shared HomeSections renderer.
- Exchange art/title area is the primary House link. A single secondary Market link and watch star replace repeated Enter House/Market buttons. Mosaic spans align at row boundaries with ordinary row flow, preserving DOM, reading and keyboard order; no dense packing or CSS order reshuffling. The latest Exchange correction replaces periodic size patterns with stable ID-derived small, medium, wide, tall and large tile proportions. `src/mosaic-layout.ts` packs explicit positions separately for 6/4/2-column desktop/tablet/mobile layouts, preserving sorted top-left DOM order while filling internal gaps. Shapes are scattered rather than assigned to every nth tile; layouts remain stable through ordinary rerenders. Captions are compact; creator/symbol details remain in the accessible DOM and comparison/detail views. `src/exchange-mosaic.css` is the final Exchange-only stylesheet; tile CSS variables consume the calculated placements. `scripts/mosaic-check.mjs` tests bounds, variation, stability, filtered/reversed lists, no overlaps/internal holes, and reading order. These checks do not establish browser-rendered geometry. Density changes gutters, not fixed text-card height.
- Added skip-to-content and route/step focus handling, mobile nav closure on route change, dialog body-scroll locking/viewport scroll bounds, larger legacy action targets, wrapping editor controls and reduced-motion handling. Queue entry lives inside shell inertness so it cannot remain an active background control under a dialog.
- Fixed Board “Most recent” to descending fixture time; equal-like ties use latest time. Fixed film-play icon on writing-only House featured essays.

No broader redesign of Discovery, fixture Houses, viewing pages or Board was introduced. The fixture catalog is still **20 Houses and 47 works: 19 films and 28 essays**, plus two Board posts, five seed comments, two series and 20 illustrative markets. Creator drafts are not added to these public fixture arrays. Original artwork inventory remains 20 distinct House SVGs and 47 work-specific SVGs.

## 3. Routes, dialogs and important journeys

All URLs below are hashes, e.g. `http://127.0.0.1:5173/#/creator/overview`. Unknown fixture IDs or wrong work kinds show a missing page; creator IDs are validated in the editor against this browser's library. Reloading a creator page requires enabling the preview account again; locally saved drafts then reopen. They are not shareable publication links.

| Route | Page/behavior |
| --- | --- |
| `#/home`, empty hash, `#/` | Discovery on a fresh profile; saved Classic designs retained |
| `#/home?preset=discovery` | Temporary Discovery preset preview without overwriting Classic |
| `#/home?tab=exchange&view=mosaic` | Default illustrated House mosaic |
| `#/home?tab=exchange&view=comparison` | Optional comparison grid |
| `#/home?tab=exchange&view=mosaic&market=:houseId` | Matching fictional market dialog |
| `#/home?tab=mix` | Local reposts, saved works and saved Board threads |
| `#/houses/:id` | Existing fixture House; reserved introduction above banner and custom content; Home/Films/Essays/Live/Community/About tabs are in memory |
| `#/videos/:id`, `#/articles/:id` | Existing fixture native sample video/reading pages, bookmarks/comments and details/theme controls |
| `#/series/road-less-travelled`, `#/series/a-simpler-life` | Ordered fixture episode collections |
| `#/board`, `#/board?house=:id` | Two fixture posts with All/Followed filter and sorting; most Houses have empty feeds |
| `#/board/posts/morning-light`, `#/board/posts/tides-and-letting-go` | Matching recursive local thread |
| `#/create/house` | Gated House draft wizard; save/resume, required introduction and admission requirements |
| `#/creator`, `#/creator/overview` | Gated workspace overview and creation shortcuts |
| `#/creator/library` | Saved local video/article drafts; edit metadata/organize/private preview |
| `#/creator/uploads` | Saved video selection/request statuses and resume-local-draft links |
| `#/creator/design` | Separate House designer and version history |
| `#/creator/community` | Existing Board link plus honest unavailable draft-House community state |
| `#/creator/settings` | Founder/operator information, setup link and independent admission statuses |
| `#/creator/house-preview` | Actual saved private House design using the same renderer as editor preview |
| `#/creator/videos/new`, `#/creator/videos/:draftId` | Local video preparation and metadata editor |
| `#/creator/articles/new`, `#/creator/articles/:draftId` | Local plain-text article editor |
| `#/creator/videos/:draftId/preview`, `#/creator/articles/:draftId/preview` | Private in-browser viewing/reading using saved metadata and available tab-local media |

Existing dialogs retained: wallet access preview, personal Home designer, Explore Houses/search, watchlist/saved threads, text creator introduction, House terms, per-work rights, page options, House recipient picker/messages, local room/minimize/resume and fictional market detail. Shared Dialog supports focus containment, Escape/backdrop close and focus return; market detail is portaled to body and separately inerts the shell. No new verification/payment dialog or sensitive-document input was added.

Guest journey: Discovery search/category → work or House → read/play sample; Exchange filter/search → House or sample market. Participation actions still open the local account gate. Board replies preserve exact parent IDs; bookmarks/reposts appear in My mix. These writes remain local.

Creator journey: Create a House → gate → details → creator introduction → template → local preview → Save House draft → resume from workspace. Missing requirements list points to House name/description/public name, valid local address, video selection/duration, face-visible self-declaration and public-information acknowledgement. Valid introduction target is 2–4 minutes, an explicit approximation of three minutes. Duration is read by the browser; face visibility is only a self-declaration. Address validation excludes catalog/reserved addresses and checks syntax, **not global reservation**. Identity and introduction reviews remain not verified/not reviewed; no simulated admission is offered. Submission uses the typed unavailable service and retains the draft.

Video journey: Create → Video → select/drop → local metadata/preview → server upload attempt/unavailable result → local draft/details/thumbnail/captions/series → private preview → unavailable publishing request. Selected files save a local draft snapshot/queue entry immediately; explicit Save saves later metadata edits. Retry repeats the service request without invented progress. Cancel aborts a request/releases the local video and retains draft metadata. Reopen queue restores metadata; after reload the file must be re-selected. Stage labels explain upload, processing, ready and published as server-dependent stages, not simulated accomplishments. Publish/unpublish state types support later adapter responses, but the current adapter never returns success. Unpublish is disabled for a draft that has never been published.

Article journey: Create → Article → title/description/optional cover/plain text → Save local draft → reopen → reading preview → unavailable publish request. HTML/script-like input displays as literal text. Paragraphs normalize CRLF/control characters, then render as React text nodes. No arbitrary HTML, rich embeds or remote executable markup is accepted. Series/episode grouping applies to video drafts; full ebook publishing remains deferred.

## 4. Personalization and presentation boundaries

Discovery retains the established CrazyGames-inspired search/categories/features/shelves. Editorial order is explicit in `discovery-model.ts`, not a personalized ranking algorithm. Search covers work title/summary/House/creator, House name/creator/bio and series title/description; Board/comments are not searched. Search/category state is in memory. Continue uses measured local video time/reading scroll, not fabricated activity.

Exchange retains the Poki-inspired House mosaic, search/mode controls, collapsed Filters & sort, Video/Writing categories including mixed Houses, independent watchlist, change/volume/valuation sorting, density and optional comparison columns. All seven-point histories/prices/market caps/volumes/valuation scores are fictional source records. Market financial details stay secondary. There is no issued coin, live quote, valuation engine, transaction, order book or fractional ownership.

`design-system.tsx` provides `SectionRegistry`, `RegisteredSections` and `designStyle`. Discovery registers only application-supplied shelf components; `HomeSections` is the common Classic page/editor renderer. `LocalHousePreview` registers featured/library/about/community and is reused by House editor, wizard and actual private House preview. No config loads code, CSS, remote URLs or HTML. House introduction and network navigation are outside customizable section arrays. Hiding all custom House sections still leaves introduction/identity warnings visible. Registry validation rejects unknown/duplicate sections and unsupported versions/theme values.

Personal Home has MUNK Discovery/Classic presets; four surfaces, three fonts, approved spacing/density and desktop House-grid columns. Discovery has seven independently hideable/orderable shelves; Classic has six supported section types. Personal Home and House designs use different state stores and version arrays. Existing pre-version Home designs continue to load as legacy version-1-compatible records; commits add `schemaVersion:1` without destructive migration or losing versions/comments/drafts. House config/state starts at version 1. Version/undo histories are capped at 30. Wizard template changes also preserve the preceding House design in history; ordinary House metadata saves do not add redundant design versions. Home and House restoration are draft choices until explicit save; closing/cancelling leaves the saved design intact.

Desktop column preferences reflow to bounded tablet/mobile columns. Home House grids use preferred desktop columns, two on tablet and one at narrow mobile; House content libraries use preferred columns, at most two on tablet and one on mobile. Density/spacing/font choices have actual renderer/CSS consumers. Other editorial feature layouts remain intentionally fixed. The designer does not claim to customize Exchange presentation or arbitrary navigation. Desktop/Mobile previews are inert component-width previews, not a real-device emulator. Verify actual viewports independently.

Fixture House themes still come from `fixtures.ts`, with creator introductions in a reserved first content region (not viewport-fixed). The Margin/Field Notes literary, Signal Hill modern and the original Off Grid design remain independent of personal Home. Article network-default/House-theme toggle remains component state.

## 5. Persistence, data and service boundaries

There is **no server persistence**. localStorage belongs to an origin/browser profile, survives ordinary reload/browser/server restarts when available, and is not synchronized across users/devices/origins. `localhost` and `127.0.0.1` or different ports are separate origins. Anyone able to read a browser profile can inspect its plaintext drafts; the preview gate is not authorization. No public profile includes private keys, balances, wallet details or identity documents. House/public creator information is explicitly identified in setup; it is not actually published here.

| Feature/store | Data and lifetime | Cross-user functionality |
| --- | --- | --- |
| `munk-frontend-v2` | Personal design/version/undo, follows, saved works/posts, repost IDs, local like flags, comments/reply parents, plaintext House-addressed message drafts | None; no shared backend or reliable cross-tab reconciliation |
| `munk-creator-preview-v1` | Validated schemaVersion 1 House draft/introduction metadata/self-declarations/unverified statuses/House design versions plus up to 100 content drafts (text, filenames/types/sizes, series/episode, request/status metadata) | None; separate from viewer data; explicit saves/file selections persist snapshots |
| Creator File/object-URL map | Video, introduction, image and captions File objects/URLs, retained across hash navigation within current tab | No disk/server upload; lost on full reload; URLs revoked on replacement/cancel/provider teardown |
| `munk-exchange-preview-v1` | Search/category/mode/sort/density/columns/watchlist | Local preferences, no financial activity |
| `munk-reading-watching-progress-v1` | Up to 100 validated measured progress records; unfinished <97% appears on Home; `?resume=1` restores | Local only; progress listens for storage events |
| Preview account | Provider boolean in memory | Resets on reload; no wallet signature/authentication/permission enforcement |
| Live rooms | Shell notes/reactions/reduce-motion/minimize state in memory | Local notebook; no audience, broadcaster, presence or socket |
| Fixture catalog/articles/posts | Compiled TypeScript arrays; short original fixture writing | Same fixed catalog for every bundle, no new shared posts |
| Fixture video | All 19 films play one disclosed original silent eight-second CC0 VP8/WebM with VTT captions | Actual native sample media only, no full creator footage or streaming |

File validation limits: video 2 GB; introduction 512 MB; JPEG/PNG/WebP image 10 MB; WebVTT captions 1 MB; non-empty and permitted MIME types. Browser validation is basic and spoofable; server must inspect actual bytes/security/codecs/duration. Unsupported/decode errors are shown. File bytes/object URLs are never serialized to localStorage. Intro duration/self-declaration never constitutes identity verification.

Storage reads/validation failures show usable defaults and warnings; creator invalid raw data is retained until explicit save. Storage quota/denial keeps the current in-memory draft with a persistent warning. Optional viewing-progress failures do not interrupt playback. Interrupted persisted upload/processing states are downgraded to failed with reselection instructions, not restored as a working resumable transfer. Concurrent-tab conflict handling/export/backups are not implemented.

### Typed frontend contracts (implemented seams, unavailable services)

`CreatorDraftRepository.load()/save()` is implemented by the local storage adapter in `creator-state.tsx`. `CreatorServices` in `creator-services.ts` defines:

- `checkAddress(address)` → availability result.
- `submitAdmission(house, introFile, AbortSignal)` → submission ID and separate pending identity/introduction statuses.
- `uploadVideo(content, file, AbortSignal)` → asset ID, state, actual byte counts, optional playback URL/resume token.
- `getUpload(assetId, AbortSignal)` and `resumeUpload(token, file, AbortSignal)` → typed upload receipt.
- `publish(content, AbortSignal)` → published ID/public URL/status.
- `unpublish(id, AbortSignal)` → unpublished confirmation.

All remote methods currently return `{ok:false, code:'unavailable', message, retryable:false}`. Other defined result codes are permission, validation, network and cancelled. Request AbortControllers cover navigation/cancel, but no network transfer occurs. The UI has failure/busy handling and result branches; the interfaces are integration seams, **not a connected API**. There is no email auth, upload SDK, socket, database, server schema/migration, processing worker, chain RPC or wallet provider in application use. No fabricated success responses are generated. Any future cached publication status is labeled unverified, not proof of public availability.

### Required centralized endpoints (proposed, not implemented)

Keep the frontend screens and replace adapters/data access. Define server-authoritative IDs, ownership, authenticated sessions, errors and pagination before connecting:

| Proposed API | Needed responsibility |
| --- | --- |
| Wallet challenge/session create/revoke/current user | Nonce/expiry/replay protection, real signature verification, authorization; no password collection |
| `GET /house-addresses/:address/availability` | Global uniqueness check; reserve atomically with House creation |
| `POST/PATCH/GET /me/house-draft` | Durable House/public creator details, owner/operator roles and design/version config |
| `POST /houses/:id/admission`, `GET /houses/:id/admission` | Intro asset reference, separate verification/review states, actual admission decision and permissions |
| `POST /uploads`, transfer URL/session, `GET /uploads/:id`, cancel/resume | Authenticated storage, actual transferred bytes/resume capabilities; reject unauthorized media |
| `POST /assets/:id/process`, asset status/playback metadata | Inspect media, transcoding/captions/thumbnails, honest errors/ready status, validated playback URLs |
| `POST/PATCH/GET /me/works`, `POST /works/:id/publish`, `/unpublish` | Durable metadata/body/series, authorized publication transitions; admitted-House prerequisite |
| `GET /houses/:address`, `/works/:id`, public catalog/search | A different guest browser can fetch only admitted/published records and real assets |
| Personal preferences/design versions/progress | Account-scoped sync with concurrency/version checks; preserve current local designs during opt-in migration |
| Posts/comments/reactions/follows/bookmarks and moderation | Actual shared participation, ownership/permissions, pagination, reporting/rate limits |
| Messaging and live services if included later | Authorized delivery/retention, privacy/moderation and real broadcast/presence; not local notebook behavior |

Upload receipts/processing polling/publication IDs must be reconciled from the server rather than trusting local fields. A real storage/media adapter needs durable remote asset IDs and status polling; current file previews alone cannot provide those. Authentication, admission and publishing must be enforced server-side. Keep public profile serialization separate from wallet/session/private verification records. Financial fixtures and MUNK/MUNKEE rights disclosures stay nontransactional. Custom L1 consensus/validators/accounts/fees/settlement/economics/testnet/indexers remain a separate future project, not required for the first centralized content MVP.

## 6. Validation and known limitations

Current commands are `npm run build`, `npm test`, and `node scripts/review-package.mjs`. Build runs TypeScript and Vite. `npm test` runs render-check, exchange-check, discovery-check and the new creator-check. New assertions exercise draft roundtrips and viewer-state isolation, missing admission requirements/address conflicts/duration, unavailable service methods, MIME/size rejection, interrupted states, design validators/history, escaped article text, legacy Home config compatibility, creator route/gate SSR, and mosaic entry destinations. Existing tests retain fixture routes/identities/ownership/assets, recursive threads/counts, model search/filter/sort and serialization checks. A passing assertion count is not browser evidence.

The initial compile/integration runs pass. The final review package reruns build/tests and records exact stdout, timestamps and exit codes in `test-results.txt/json`. The completed run passed both commands (exit 0), reporting 121 model/service/server-render check lines; that count is not evidence of browser behavior. Automated checks execute models/service contracts and React server rendering with mocked storage. They do not run browser events, validate visual quality or prove screen-reader accessibility.

The browser runner now has real DOM-event/file-selection/reload tests at **1440×1024, 768×1024 and 390×844** in `scripts/creator-browser-check.mjs`, called by the review tool. It checks House draft saving/resumption and insufficient intro duration; workspace navigation; wrong/valid video files and local decoding; unavailable upload/retry/cancel and queue resumption; article save/reopen/escaped preview/unavailable publishing; cancel edits; House/Home design separation and House version restoration; protected introduction; personal designer cancellation, Tab/Escape and reachable actions; reduced-motion preference and horizontal geometry. It uses the bundled sample as test input, not new creator footage. Tests are designed to run in an isolated Chrome profile and do not reset the user's normal storage.

**Fresh browser execution was blocked:** the current review attempt failed on localhost startup with `listen EPERM: operation not permitted 127.0.0.1:5173`. All 72 requested captures and browser journeys are blocked; zero fresh screenshots were obtained. See the timestamped browser-results and manifest. No UI behavior, geometry, keyboard test or sample playback is claimed as browser-observed. No historical images are substituted, and zero recorded browser errors in a blocked run is not proof of no errors. Local Mac command is below.

Remaining limitations requiring browser review or later backend work:

- All creator drafts/publication links are local; no real creator can deliver a newly published work to another viewer. Verification/admission/server upload/transcoding/publication are absent.
- One creator House draft is supported per browser preview. No multiple-House permission model, moderation dashboard, collaborator roles or ownership transfer. Founder and accountable operator are the same public-name draft in this limited flow.
- Media is not persisted as bytes; re-selection is intentional. No real resumable transfer, background processing, automatic thumbnail generation, face recognition or sensitive-document verification. Browser codec support varies, especially QuickTime; MIME/size checks do not guarantee decoding.
- Plain-text article editing is deliberately limited; rich text and ebook publishing are deferred. Optional captions are selected as English VTT; there is no multilingual caption editor/validator or server caption processing.
- Local library limit is 100 drafts, bodies up to 100,000 characters; storage quota may be reached sooner. Save failures are visible. Cross-tab conflict recovery, export and account migration remain unimplemented.
- Existing Board has no top-level composer/edit/delete/report/block workflow; comments, reactions, reposts, messaging and rooms remain local. No delivery, encryption, live broadcast, decentralized publication or financial functionality is claimed.
- Fixture introductions/portraits remain placeholders/unverified. Artwork is original illustration, not real creator photography. All fixture films share the same disclosed silent sample.
- Mobile Exchange packing, overlay readability, long labels/files, visual balance, touch target geometry, native video controls and sticky dialog headings need fresh browser/human approval. Controls are designed for accessible DOM order/labels/focus but have not earned an accessibility certification.
- Component mobile previews are not full device emulation. Test Safari, keyboard-only/screen reader, 320px and 1024px widths, storage rejection, long/nested threads and focus-return edge cases independently.
- There is no configured lint, coverage, API, load or security test suite. `npm run capture`/`test:browser` still invoke the older capture-discovery tool; the authoritative new full review command is `node scripts/review-package.mjs`.

## 7. Review package and continuation

`scripts/review-package.mjs` now requests **24 screens × three viewports = 72 fresh screenshots**: existing Discovery, Exchange mosaic/comparison/market, House, video, article, Board, thread, personal designer; plus House creation/introduction/admission, creator overview/library/uploads/House design/settings/community/private House preview, video editor/private preview and article editor/private preview. Creator example drafts are created by normal UI interactions in the isolated review profile and labeled local review drafts, not public fixture works.

Historical creator-completion package (predates the focused Exchange square-tile refinement): `review/current-state-2026-10-27T20-34-30-984Z/MUNK-CURRENT-STATE-REVIEW.zip`. Build and npm test both exited 0. Browser status was BLOCKED, with **0/72** fresh screenshots. The subsequent Exchange refinement also passed build/tests; its focused six-view capture was blocked at localhost bind, recorded in `review/discovery-exchange/capture-result.json`. Exact visual matching to Poki is unverified.

The package includes this report, fixture/source/asset inventories, exact tests, creator model results, browser journey results, per-capture manifest (route, viewport, timestamps, status/error, hashes for successful PNGs), copied review/browser tools and one ZIP. Application source/assets are hash-checked during execution and ZIP contents are verified byte-for-byte. Most page captures use full document height; dialog captures use viewport height. Finder-open failure is independent of ZIP integrity.

If capture is blocked, use ordinary **Mac Terminal**, outside the restricted agent session:

```sh
cd /Users/azayel/monk
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/review-package.mjs
```

Use Node 22, installed dependencies and Chrome; ensure port 5173 is free or serving this exact repository (the script reuses a reachable Vite server). Each run creates a new `review/current-state-<timestamp>/` and `MUNK-CURRENT-STATE-REVIEW.zip`. Read both capture and journey results: image count alone does not prove interaction correctness. No earlier PNGs are copied.

Next functional MVP milestone: after fresh rendered frontend acceptance, connect a **centralized creator-to-viewer publication vertical slice** using wallet-authenticated sessions, authorized House drafts/admission, durable article storage and public read/search endpoints. Start with articles to establish publication/permission semantics; then add video storage/processing through the same contracts. Acceptance: creator A signs a genuine challenge; drafts survive backend restart; unadmitted/unauthorized publishing is rejected; admitted A publishes a validated article; guest B in an independent browser sees the public record; drafts/private fields remain inaccessible; A edits/unpublishes and B sees the change; server logs/tests establish actual status transitions. Later video acceptance additionally requires real bytes, processing errors/status, captions and playback of A's own media, with no fabricated progress.

Owner decisions for the next milestone: approve rendered frontend once fresh captures work; choose wallet/auth provider and creator identity/admission policy; approve hosting/storage/processing budget before provisioning; define retention/moderation and operator roles. No deployment/provider purchase, trading, custom L1 or fractional-ownership decision was made in this frontend pass.

## Appendix: full current entity route inventory

Generated from the fresh `route-fixtures.json` produced by bundling current TypeScript fixtures; no historical route list was reused.

| House | Creator | Route |
| --- | --- | --- |
| Off Grid | Maya Laurent | `#/houses/off-grid` |
| The Margin | Elias Reed | `#/houses/the-margin` |
| Field Notes | Nia Brooks | `#/houses/field-notes` |
| Signal Hill | Theo Park | `#/houses/signal-hill` |
| Kiln & Clay | Ada Mercer | `#/houses/kiln-and-clay` |
| Night Observatory | Ivo Vale | `#/houses/night-observatory` |
| Glasshouse | Lena Moss | `#/houses/glasshouse` |
| Thread & Tide | Amara Finch | `#/houses/thread-and-tide` |
| Blue Note Room | Jonah Bell | `#/houses/blue-note-room` |
| Paper Orbit | Cleo Hart | `#/houses/paper-orbit` |
| Supper Club | Ravi Sen | `#/houses/supper-club` |
| Tiny Machines | Mira Cole | `#/houses/tiny-machines` |
| Wild Atlas | Sol Rivera | `#/houses/wild-atlas` |
| Brick by Brick | Owen Lake | `#/houses/brick-by-brick` |
| Salt & Sail | Esme North | `#/houses/salt-and-sail` |
| Small Stage | Felix Rowan | `#/houses/small-stage` |
| Afterimage | Zara Quinn | `#/houses/afterimage` |
| Moss & Myth | Orla Wren | `#/houses/moss-and-myth` |
| Slow Mile | Tomas Reed | `#/houses/slow-mile` |
| Letterpress | Sana West | `#/houses/letterpress` |

| Work | Kind | House | Route |
| --- | --- | --- | --- |
| The long way home | FILM | off-grid | `#/videos/the-long-way-home` |
| Building a simpler life | FILM | off-grid | `#/videos/building-a-simpler-life` |
| Tides and timing | FILM | the-margin | `#/videos/tides-and-timing` |
| A quieter notebook | ESSAY | field-notes | `#/articles/a-quieter-notebook` |
| City to forest | FILM | signal-hill | `#/videos/city-to-forest` |
| Meeting the mountains | FILM | off-grid | `#/videos/meeting-the-mountains` |
| People on the road | FILM | off-grid | `#/videos/people-on-the-road` |
| Why I live this way | FILM | off-grid | `#/videos/why-i-live-this-way` |
| A slower kind of morning | ESSAY | off-grid | `#/articles/a-slower-kind-of-morning` |
| A journal at the pass | ESSAY | off-grid | `#/articles/a-journal-at-the-pass` |
| A path through pines | ESSAY | off-grid | `#/articles/a-path-through-pines` |
| Notes from the road | ESSAY | field-notes | `#/articles/notes-from-the-road` |
| Back to the trees | ESSAY | signal-hill | `#/articles/back-to-the-trees` |
| The edge of everything | ESSAY | off-grid | `#/articles/the-edge-of-everything` |
| On tides and timing | ESSAY | the-margin | `#/articles/on-tides-and-timing` |
| The shape of a first bowl | FILM | kiln-and-clay | `#/videos/kiln-and-clay-first-light` |
| Notes beside the kiln | ESSAY | kiln-and-clay | `#/articles/kiln-and-clay-notebook` |
| A night with Saturn | FILM | night-observatory | `#/videos/night-observatory-first-light` |
| A map of the dark | ESSAY | night-observatory | `#/articles/night-observatory-notebook` |
| The winter greenhouse | FILM | glasshouse | `#/videos/glasshouse-first-light` |
| Seeds for another season | ESSAY | glasshouse | `#/articles/glasshouse-notebook` |
| Weaving the coastline | ESSAY | thread-and-tide | `#/articles/thread-and-tide-first-light` |
| A language in the loom | ESSAY | thread-and-tide | `#/articles/thread-and-tide-notebook` |
| After the last chord | FILM | blue-note-room | `#/videos/blue-note-room-first-light` |
| A room that learned to listen | ESSAY | blue-note-room | `#/articles/blue-note-room-notebook` |
| An edition of one | FILM | paper-orbit | `#/videos/paper-orbit-first-light` |
| The patient print | ESSAY | paper-orbit | `#/articles/paper-orbit-notebook` |
| A table for the neighbourhood | FILM | supper-club | `#/videos/supper-club-first-light` |
| A recipe worth keeping | ESSAY | supper-club | `#/articles/supper-club-notebook` |
| The clock on the workbench | ESSAY | tiny-machines | `#/articles/tiny-machines-first-light` |
| A drawer of useful things | ESSAY | tiny-machines | `#/articles/tiny-machines-notebook` |
| Following the herons | FILM | wild-atlas | `#/videos/wild-atlas-first-light` |
| A field guide to patience | ESSAY | wild-atlas | `#/articles/wild-atlas-notebook` |
| The courtyard between us | FILM | brick-by-brick | `#/videos/brick-by-brick-first-light` |
| Windows on a quiet street | ESSAY | brick-by-brick | `#/articles/brick-by-brick-notebook` |
| Leaving with the morning tide | FILM | salt-and-sail | `#/videos/salt-and-sail-first-light` |
| The harbour after rain | ESSAY | salt-and-sail | `#/articles/salt-and-sail-notebook` |
| Before the curtain | ESSAY | small-stage | `#/articles/small-stage-first-light` |
| A rehearsal of beginnings | ESSAY | small-stage | `#/articles/small-stage-notebook` |
| The city in a single frame | FILM | afterimage | `#/videos/afterimage-first-light` |
| What the photograph leaves out | ESSAY | afterimage | `#/articles/afterimage-notebook` |
| The story beneath the bridge | FILM | moss-and-myth | `#/videos/moss-and-myth-first-light` |
| An inventory of small legends | ESSAY | moss-and-myth | `#/articles/moss-and-myth-notebook` |
| A bicycle and a Sunday | FILM | slow-mile | `#/videos/slow-mile-first-light` |
| The map in my pocket | ESSAY | slow-mile | `#/articles/slow-mile-notebook` |
| Letters from an open window | ESSAY | letterpress | `#/articles/letterpress-first-light` |
| A poem for the evening | ESSAY | letterpress | `#/articles/letterpress-notebook` |

| Conversation / series | Route |
| --- | --- |
| Morning light in the high country. This is why we keep going. | `#/board/posts/morning-light` |
| A short essay on tides, timing and letting go. Sometimes the best plan is no plan. | `#/board/posts/tides-and-letting-go` |
| The road less travelled | `#/series/road-less-travelled` |
| A simpler life | `#/series/a-simpler-life` |
