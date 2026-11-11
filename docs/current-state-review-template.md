# MUNK — current-state implementation report

Review date (UTC): {{DATE}}

This report describes the current source, current build/test run, and only the fresh browser observations in this package. It does not reuse previous implementation reports or historical screenshots as verification. The application is a local frontend demonstration, not a network beta or a production system.

## 1. Repository and evidence provenance

{{GIT}}

The review tooling does not edit `src/` or `public/`. `source-inventory.json` records SHA-256 hashes of those files and `browser-results.json` reports whether they stayed unchanged during the review. Building generates `dist/` and TypeScript build metadata; tests may generate test artifacts. Review documentation and capture tooling are the authorized new files: `docs/current-state-review-template.md`, `scripts/review-package.mjs`, and this timestamped review folder.

No earlier baseline exists in Git here, so “latest changes” below describes identifiable current implementation layers, not a proven chronological diff. Dependencies and source on disk are authoritative. Screenshots only prove the views whose manifest entries say SUCCESS, not every documented interaction.

## 2. Do the new layouts exist? Which files implement them?

Latest refinement: expanded four Houses to 20 with 16 distinct fictional creators and 32 owned works; compacted the canvas with smaller periodic width/height variations instead of a dominant lead; collapsed advanced controls for mobile and removed comparison-only UI from mosaic; replaced repeated content art with work-specific SVGs; unified network navigation across routes; added backward-compatible Discovery section show/hide/order. Existing four identities/market records and all previous IDs remain, so valid saved follows, bookmarks, drafts and versions still resolve. No backend scope changes.

**Yes, both exist in current application source.** Home imports `Discovery.tsx`; its explicitly named `MUNK Discovery` layout renders a different full-width shell and a feature mosaic plus discovery shelves. Exchange imports `HouseMosaic.tsx` and selects it when its mode is `mosaic`. It is not the old Stories screen renamed for screenshots. Browser rendering status is separately stated in section 10.

| Current implementation layer | Relevant files | Actual responsibility |
| --- | --- | --- |
| Full-width network shell | `src/App.tsx` | One collapsed/expanded network rail shared across Discovery, Exchange, Houses, video, Board, articles and threads; stable route composition. Creator content retains its own themes and locked introduction. |
| New Home and preserved Classic | `src/Home.tsx` | Named Discovery branch, nonpersistent `preset=discovery` preview, Stories/Exchange/My mix, preserved `LegacyHome` and its custom sections. |
| Discovery components | `src/Discovery.tsx` | Search, category buttons, featured/supporting work tiles, shelves, House tiles, series links, actual local resume records. |
| Discovery catalog | `src/discovery-model.ts` | Explicit editorial ordering, fixture search and categories, two series, unique work illustrations and viewer-configured section ordering. |
| Canvas and detailed comparison | `src/HouseMosaic.tsx`, `src/Exchange.tsx`, `src/exchange-model.ts`, `src/exchange.css` | Default visual House tiles; optional uniform comparison cards; matching market modal; filters/sorts/density/local watchlist. |
| Shared styling overrides | `src/discovery.css`, `src/main.tsx` | Scoped network presentation and canvas sizes; loaded after original styles and correction overrides. |
| Preset preservation | `src/fixtures.ts`, `src/model.ts`, `src/Designer.tsx` | Optional layout field accepts legacy configurations, Discovery for new profiles, explicit preset saving, prior-layout snapshots/undo/versions; optional validated Discovery show/hide/order list, with existing saved designs left valid. |
| Resume functionality | `src/progress.ts`, `src/Video.tsx`, `src/Article.tsx` | Native video time and article scroll position, separate guarded browser store, explicit resume URLs. |
| Tablet player correction | `src/visual-fixes.css` | Removes aspect-ratio/min-height width pressure; constrains player inline size and sets explicit responsive height. Rendering still needs fresh geometry evidence. |
| Expanded fictional catalog/artwork | `src/fictional-catalog.ts`, `src/fixtures.ts`, `public/art/*.svg`, `scripts/create-house-art.mjs`, `scripts/create-catalog-art.mjs` | 20 distinct House identities/routes/artworks, 47 owned works and work-specific illustrations; original CC0 artwork and clearly fictional monograms. |
| Structural validation | `scripts/render-check.mjs`, `scripts/exchange-check.mjs`, `scripts/discovery-check.mjs`, `scripts/test-all.mjs` | Current route/entity/configuration/render checks. |

Preserved in source: House identities, reserved creator-introduction placement, correct work/thread links, native sample video, article reader, Board threads, local comments/replies/bookmarks/reposts, local room preview, plaintext message drafts, wallet-preview gate, legacy Home sections, and independent House themes. Preservation is partly established by model/server-render tests; it is not a claim that every browser interaction was re-executed.

## 3. Complete route inventory

Routing is hash-based (`parseRoute` in `src/model.ts`). Unknown paths/IDs and film/article type mismatches show the missing-fixture page with a Home link. Root, `#/` and `#/home` map to Home. Hash changes update the page and close modal/gate state. Main page components are keyed by route type and ID, so selecting a different work or House starts the matching component. Browser Back/reload are supported structurally through hash URLs; browser history behavior must be tested separately.

| Query-controlled destination | Actual behavior |
| --- | --- |
| `#/home` | Stories in the viewer's saved Home design; new profiles use Discovery, legacy saved designs retain Classic. |
| `#/home?preset=discovery` | Discovery preview even when a Classic design is saved. Uses Discovery's default visible configuration; does not commit/save it. Preview banner appears only if the saved design is not Discovery. |
| `#/home?tab=exchange&view=mosaic` | Forces actual House canvas; saved mode does not override this URL. |
| `#/home?tab=exchange&view=comparison` | Forces uniform detailed comparison cards. |
| `#/home?tab=exchange` | Exchange in its locally saved mode, falling back to mosaic when absent. Thus an explicitly saved comparison preference can override the default on this non-forced URL. |
| `#/home?tab=exchange&view=mosaic&market=off-grid` | Off Grid market dialog above the mosaic; any valid House ID can be used. Invalid market ID displays an alert. |
| `#/home?tab=mix` | Saved works, saved Board posts, local reposts. |
| `#/board?house=<house-id>` | Board feed filtered to that House; unknown House ID gives an empty feed rather than a missing route. |
| `#/videos/<film-id>?resume=1` | Native sample seeks to locally saved progress after metadata loads. |
| `#/articles/<essay-id>?resume=1` | Reader attempts to restore saved local scroll fraction. |

The `preset` query is preview-only, not a durable new account setting. Home/wordmark links and tabs do not consistently carry this query onward. Returning Home restores the saved design; it may show Classic if the user only previewed Discovery. Category/search state is React state, not encoded in the URL. House tabs and designer devices also have no dedicated route. Designer, messages, wallet gate, introductions, ownership/rights, Explore, watchlist and local rooms are modal destinations opened by controls.

All currently valid entity destinations, generated from the present fixtures:

| Entity | Route |
| --- | --- |
{{ROUTES}}

There are 20 distinct fictional Houses, 47 works (19 films/28 essays), two Board posts and two series. Sixteen new Houses have original topic-specific creator identities, introductions, two owned works each, themes, monograms and artwork; they are not duplicates of the existing four. All are explicitly fictional fixtures, not admitted/verified real creators. There are no creator dashboard, upload, editor, e-book, viewer profile, real inbox, login, moderation, governance or transaction pages.

## 4. CrazyGames-inspired Discovery — actual implementation

**Code findings, not an assertion of a rendered reference match:**

- The network shell spans the window instead of the legacy bounded application panel. Desktop sidebar is 80px collapsed or 216px expanded. Icon navigation includes Home, Exchange, Board and Messages, plus existing fixture House links. The menu button changes local expanded state. The same recognizable navigation now wraps existing content pages; House-specific typography/surfaces and intro structure remain separate.
- The page starts with a small context label, a 30px serif heading and Presets & design action, followed by Stories/Exchange/My mix. A large bordered search field searches actual fixture titles, summaries, House names and creators. Series search matches series title/description; it does not search all the same creator metadata as work search. Search is local and case-insensitive, with a reset action and result counts.
- Five illustrated/icon shortcuts: All, Films, Writing, Series, Houses. They change the results immediately. With no search/category restriction, the editorial Home is visible. Search/category results replace it with matching work/House/series tiles. See all changes the category rather than navigating to a separate catalog route.
- Five featured works occupy a four-column/two-row grid on wide screens: first spans two columns and two rows; four supporting tiles fill the right half. Default rows are 175px high. Titles/creator context sit on image gradients, and the lead includes a synopsis/play affordance.
- Shelves include measured Continue watching/reading, ordered films, ordered writing, fixture series, followed Houses and all Houses. Horizontal overflow is intentional inside each shelf. Editorial arrays explicitly define order. There is no undisclosed recommendation service or personalized ranking. Followed Houses uses local follow records. Continue uses actual recorded activity and shows an honest empty state on fresh profiles.
- Default shelf grid allows approximately six tiles across wide screens, four at <=1200px and three at <=900px; mobile uses 170px horizontal tiles. Feature grid becomes three columns at <=900px, with the lead spanning two, and two columns at <=760px with a full-width lead. Search results use configured desktop columns, then three/tablet and two/mobile.
- At <=760px the rail becomes a compact top navigation with icon actions and expandable two-column House links. Categories become horizontally scrollable shortcuts; subtitles hide; headings reduce. Desktop content padding is 24px/28px, mobile 18px/16px. Typical tile gaps are 14px, mobile 10px. Some supporting labels are 11–12px; accessibility at actual zoom is not established by CSS alone.

Differences/limits against requested CrazyGames presentation: catalog is a finite local 20-House demonstration rather than a service-scale feed, original flat illustrations substitute for rich photographic thumbnails, MUNK retains a serif/editorial visual personality and prominent heading/tabs/disclosure instead of reproducing every reference element. There is no infinite catalog, promotional system, account service or remote discovery. Continue/follows operate only on local state. The viewer can now show/hide and reorder seven Discovery sections independently of Classic. Editorial order inside each shelf remains fixed and disclosed. Exact spacing, visual density, proportion and reference similarity require fresh browser comparison and approval. This report does not claim a pixel match or fresh visual inspection of the reference site.

## 5. Poki-inspired Exchange — actual mosaic versus comparison

Default setting is `mode: mosaic`. Old settings without a mode field still validate; explicit query `view=mosaic` always renders the canvas. The mode choice is distinct from tile density and column preference.

**Canvas CSS:** six tracks on wide desktop, four at 1001–1279px, three at <=1000px and two at <=760px. Compact rows use a text-driven minimum 230px; comfortable rows minimum 250px, with 10/14px gaps. Mobile uses minimum 235px rows and 8px gaps. No special oversized first tile remains. Desktop every seventh pattern includes a two-column tile and every eleventh pattern includes a two-row tile; tablet uses occasional two-column/tall tiles; mobile uses a full-width tile every eighth pattern and otherwise paired cards. Sorted reading order follows DOM order: the grid uses row flow, not dense CSS repacking. The composition can still leave small grid gaps around size variations; it is a finite canvas, not an infinite masonry service.

Each of the 20 tiles represents exactly one House and matching creator. Independent original 1600×1000 illustrations convey ceramics, astronomy, gardening, textiles, music, printmaking, food, making, nature, architecture, sailing, theatre, photography, folklore, cycling and poetry, alongside the existing mountain/coast/notebook/forest Houses. Symbols, sample USD price/change, star watchlist, blue Enter House and green Market actions remain visible without hover. Sample fixtures are disclosed in the catalog header and on tiles. Name/Enter routes to the exact House; Market opens matching read-only details. Artwork alone is not a click target. Hover only scales imagery; reduced motion disables it. Mosaic still omits a separate House icon and explicit content-kind badge; comparison includes those.

**Mobile controls:** normal network rail becomes a compact top bar; the duplicate Exchange Home heading is hidden, not the network navigation. The search field and House canvas/Comparison grid mode switch stay outside a collapsed native details panel. Filters & sort exposes category, watchlist-only, price-change/volume/valuation sort, direction and density. Comparison columns do not render at all in mosaic; they are only inside comparison's advanced controls. A compact sample-USD/no-trading notice replaces the large disclosure panel. Code aims to place tiles in the first 390×844 viewport; `browser-results.json` records actual first tile top and count when a browser connects. CSS estimates are not visual verification.

**Filtering:** search matches House, creator and sample symbol. Video/Writing include Both-category Houses. Clear filters clears query/category/watchlist-only, not memberships or mode/sort/density. Watchlist toggles remain local-preview-account gated. Settings persist under the existing separate Exchange key. Sixteen new market fixtures use deterministic illustrative records; existing four market values remain unchanged.

**Expanded market:** matching House/creator, sample price/change, seven-day SVG chart, volume/capitalization, separate fixed 0–100 valuation score, ownership context, inspectable history and Enter House. Founder/operator remain one fictional person, not verified ownership. Modal close/backdrop/Escape/focus/inert behavior is retained. No issued coin, order book, trade, live pricing, ownership sale or transaction service exists. Chart scales differ per House and are clearly fictional; score is not monetary value.

**Comparison mode is separate:** regular cards retain small cover/icon/identity/category, sample price/change, chart/volume/cap/score and actions. Desktop columns remain 2/3/4, responsive two at <=1279px and one at <=760px. It is an optional financial comparison display, not the default canvas or a substitute screenshot for it.

Remaining limits: the 20-House canvas is finite and uses original illustrative placeholders, not licensed creator footage/photos. Tile sizes are positional rules rather than a fully configurable masonry engine. Narrow two-column mobile cards must fit labels/actions; minimum sizing and wrapping mitigate collisions, but actual screenshots and keyboard/touch review remain required. No exact Poki rendering match is claimed.

## 6. Personal and House interfaces

`munk-frontend-v2` accepts older valid Home designs with no layout field. Missing layout means Classic; fresh state uses Discovery. The preview query only changes the visible layout. It does not replace the saved object. Choosing a preset in the designer changes a draft until Save Home. An explicit layout-switch save snapshots the old design as Before layout switch, adds a new version, caps history at 30 and retains other local records. Undo edit is draft-local. Undo last save and Restore version immediately change persistent Home state, even before pressing Save again; these controls are not merely a draft preview. Restore network default changes the draft to Discovery.

Classic designer supports add/remove/reorder of six predefined sections (featured/new/conversations/watchlist/Board/local room), font preset, surface palette, spacing, density and columns. It is a validated configuration, not arbitrary executable code. Discovery has its own optional `discoverySections` list. Checkboxes show/hide featured, continue, films, writing, series, followed Houses and discover Houses; up/down controls reorder visible sections. Hidden sections remain available to enable again. A missing field retains the original seven sections in original order, so old Discovery designs and versions stay valid without migration. Search/categories always remain. All-hidden has an explicit recovery message. Changes remain drafts until Save Home, and undo/version restoration uses the existing mechanism. Classic sections remain independently configured. Some settings affect only specific components (columns affect search results rather than feature/canvas composition). Its font variations have scoped overrides, not arbitrary user font uploads. Desktop/mobile preview reuses components within a bounded/inert preview; it does not replace testing at real viewport sizes.

The original four Houses keep their independent fixture configurations: Off Grid ivory/classic/4 columns; The Margin paper/literary/2; Field Notes sage/literary/3; Signal Hill peach/modern/3. Sixteen new fictional Houses have independently selected surface/font/spacing/density/column configurations and topic-specific identities. Creator names, bios, intro IDs, collections and recipients match each selected House. The creator-intro section sits before the customizable/themed banner/content and remains across House tabs; no UI hides/repositions it. It is not CSS-fixed/sticky to the viewport. It is a portrait/text introduction preview, not the required approximately three-minute face-visible welcome video or admission validation. There is no House-design editor or creator publishing management UI. Returning Home resolves the saved personal design, not the House theme.

## 7. Major interaction inventory

Status here comes from current event handlers/model tests unless a fresh browser observation explicitly states otherwise. “Local” means one browser's records, not a network service.

| Screen/control | Actual result | Boundary/status |
| --- | --- | --- |
| Wordmark/Home/Board/Exchange navigation | Changes hash route; Home restores saved design; preview query may be dropped | Local routing |
| Menu | Collapses/expands network rail or original mobile navigation | Local transient state |
| House links/Explore | Matching fixture House; Explore modal searches name/creator | Local navigation/search |
| Discovery search/categories/reset/See all | Filters actual fixture catalog, resets or selects category | Working local model; browser unverified if capture blocked |
| Featured/supporting work, House and series links | Exact work/House/series destination | Local routes |
| Continue cards | Read real local progress; resume query seeks/scrolls | Local persistence; actual playback result separate |
| Stories/Exchange/My mix | Switches query destination; mix shows reposts/saved works/posts | Local records |
| Exchange modes/filters/sorts/density/columns | Search/modes always accessible; advanced controls in collapsible panel, columns only comparison | Local; all financial values fictional |
| Exchange star | Account-preview gate then toggle matching House | Local persistent watchlist |
| Enter House | Exact House identity and content | Local route |
| Market details/history disclosure | Matching read-only sample modal; expands fixture table | Fixture presentation, no market service |
| House tabs | Home/Films/Essays collections, Live card, Community Board link, About text | Local transient tab, not reloadable tab routes |
| Creator portrait/Read introduction | Matching text/portrait dialog | Fixture; no intro video or admission check |
| Follow | Toggles House and changes followed feeds | Local, account-preview gated |
| Ownership & terms / Content rights | Disclosure-only modal | No purchase, contract, license or rights transfer |
| Native video controls | Actual bundled eight-second silent WebM, captions, seek/pause/volume/fullscreen as supported by browser | Real HTML media sample, not actual films/adaptive streaming |
| Overlay toggle | Show/hide up to three fixture/local comment bubbles; responsive CSS hides some | Local static overlay, not live comments |
| Video Local reaction | Toggles per-work local like flag/count | Local; no cross-user reactions |
| Video Comments/Details | Shows permanent-local Thread or description/bookmark | Local state |
| Article House/network theme toggle | Explicit per-page fixture theme choice | Local transient state; network default ivory/orange |
| Work bookmark/watchlist | Saves works in shared store; opens saved works/posts | Local account-preview gated |
| Board All/Followed/Most recent/Most liked | Filters/sorts two fixture posts, count uses current local likes | Local; Most recent uses fixture numeric ordering, not actual server timeline |
| Board photos/essay card/permalink/Open thread | Matching work/thread destination | Local routes |
| Post like/repost/save | Local toggles; repost appears in My mix | No broadcast/publication |
| Post reply / comment reply | Targets post/actual parent; focuses composer | Local thread |
| Post comment/reply/like/cancel | Adds record with parent and target, recursive nested display; toggles local like | Browser storage only; no cross-user delivery |
| Messages | Entity context chooses correct House, or opens recipient picker | House-only local draft UI |
| Save local draft | Saves plaintext addressed to creator; never delivered | Local, no encryption or actual inbox |
| Open local room | Account-preview gate, labeled notebook with no broadcast/audience | Simulation explicitly disclosed |
| Room note/reaction/minimize/resume/close | Adds local notes/emoji, preserves tab memory while minimized, close hides UI | Local transient state, reload clears rooms |
| Room reduced motion | Stops reaction animation; OS CSS also disables animations | Local preference; browser check separate |
| Presets & design / Edit Home | Gate then personal configuration modal | Local designer |
| Preset buttons/settings/section controls/device tabs | Change draft or preview; Discovery checkboxes show/hide, up/down reorders, Classic separate | Local configuration; no creator editor |
| Save Home/Undo edit/default/version/Undo last save | Save/draft undo or immediate restored state as described above | Local validated persistence |
| Create/Connect wallet | Disabled, labeled unavailable | Not implemented |
| Use local preview account | Session boolean, resumes pending action | Explicit simulation, no auth/security |
| Options menus | Work/post bookmark toggle where applicable, Home link, and unavailable-services disclosure | Local bookmark only; real report/block/share tools absent |
| Modal close/backdrop/Escape/Tab | Closes, restores focus and traps keyboard per shared Dialog | Implemented handlers; limited fresh keyboard observations if captured |

No viewer-to-viewer messaging, acceptance/requests, blocking/reporting workflow, real live transport, publishing, upload, film transcoding, e-book chapters or token transaction interaction exists. Some guest actions (following/commenting/design) are gated, but guests can open informational dialogs and adjust discovery controls. This is a preview of the account boundary, not a strict/server-enforced “watch/read/search only” security policy.

## 8. Stack, assets, data and service boundaries

React 18.3.1 / ReactDOM 18.3.1, TypeScript 5.9.3, Vite 5.4.21, Lucide 0.312.0; esbuild 0.21.5 supports tooling. CSS is original `styles.css` then `visual-fixes.css` then `discovery.css`; Exchange also imports scoped `exchange.css`. Hash routing is custom; no framework router/server-rendering service is deployed. React server-render is used by tests only.

- Fixture entities/text/images/creator identities/market metrics are bundled source. Users cannot create Houses, upload/publish works, write new Board posts or change market values through the UI.
- `munk-frontend-v2`: validated Home config, 30 versions/undo states, follow IDs, saved works/posts, repost IDs, likes, comment/reply records, plaintext addressed message drafts. Reload survives when browser storage works. Shared-state persistence errors are caught with a warning. Invalid records fall back to safe defaults; the provider subsequently persists defaults, so corruption recovery can replace the invalid stored object. Older unrelated `munk-*` keys are not migrated.
- `munk-exchange-preview-v1`: separate validated query/filter/sort/density/columns/watchlist/mode. Exchange saves settings on mount/change in that browser profile. It does not modify personal Home config.
- `munk-reading-watching-progress-v1`: actual native sample time/reader scroll fractions; optional storage failures are silently ignored so media is not interrupted. Not cloud-synced.
- Session only: local-account boolean, modal/gate, current search/category, House tab, current article theme, local rooms, minimized state, unsaved designer draft.
- Identity is “Viewer 7F2A” preview rather than verified wallet identity. Fixture comments include named anonymous viewers but do not demonstrate independent sessions communicating.
- No `fetch`/WebSocket transport, backend/API connection, database, processing queue, wallet SDK, key generation, signed records, blockchain contract/node, storage replication or independent-client protocol is connected by application source. Vite and browser asset requests are local file serving, not product services. Installed unused/transitive packages do not establish an integration.
- No blockchain exists in this implementation, neither an existing public ecosystem nor a custom MUNK L1. There is no basis for claiming decentralized retrieval, data availability, wallet privacy, chain privacy or server-enforced publishing authority. No backend, deployment or paid infrastructure was added by the review.

**Visual assets and palette:** exact provided-style MUNK wordmark is a raster crop `public/assets/wordmark.png`, not an editable vector font/logo. System fonts substitute for original font assets: Georgia/Times headings and Arial/Helvetica support text; handwritten titles request a locally installed Noteworthy Light via Munk Hand with Segoe Script/Snell Roundhand/cursive fallbacks. No original handwritten font is bundled, so appearance varies with the machine. Network overrides explicitly use bold Georgia headings (30px main, 24px shelf, 19px tiles/34px lead); canvas titles 25px/45px lead. Blue `#005bff`, green `#008d26`, ivory `#fff5e8`, peach `#ffd1ae`, and light orange rail `#ffefda` preserve button-role/palette intent. Text over artwork uses white/cream and dark gradients.

New artwork includes 20 distinct 1600×1000 House illustrations, 47 unique work-specific 1600×1000 illustrations, 16 new 320×320 creator-monogram SVGs and retained landscape variants. All new SVGs are original CC0, not reference branding or game assets. House banners, navigation icons and work cards/posters/readers now use sharp art through `asset(art:...)`; new Discovery uses the same corresponding work illustration. Within-House motifs are intentionally related, but each work has its own file/composition. Some originals still share landscape motifs. Board photo pairs, the original Maya portrait, viewer avatars and some legacy Classic decoration remain screenshot crops; three older creator monograms and all new creator monograms remain clear placeholders. No actual creator photography is supplied. Remaining raster crop softness is disclosed rather than called fixed. `asset-inventory.json` in this package records native dimensions from current files.

## 9. Responsiveness and accessibility: what is and is not proven

The fresh capture tool targets 1440×1024, 768×1024 and 390×844 at DPR1. It navigates exact URLs, verifies unique expected DOM content/layout classes and item counts before capturing, records document overflow/player geometry/broken images, and tries dialog Tab/Escape. Modals use viewport captures; other pages are full-height captures. Shelf content beyond its horizontal scroll viewport is not expanded into a fake grid. A route failure is a failed manifest entry, never a renamed old layout image.

CSS has visible-focus outlines, semantic links/buttons, search labels, pressed-state attributes, dialog roles/focus handling, inert backgrounds and reduced-motion rules. Most principal mobile actions are >=44px. Some metadata remains 10–12px, and paired mobile cards can be text-heavy. Existing deep reply nesting can progressively consume width; arbitrary long-content zoom and nesting need browser tests. Generic modal focus selectors do not exclude all elements inside inert subtrees (e.g. the designer preview); rigorous focus containment needs checking. Native video controls/VP8 support vary by browser.

At tablet the player is now constrained with `width/max-width:100%`, `min-width:0`, `aspect-ratio:auto` and `height:clamp(265px,24vw,380px)`; at <=760px height is 260px. That is a concrete code fix, not proof clipping disappeared. Overlay CSS reserves lower player space and narrows the visible bubbles, but native controls and safe interaction areas still require actual viewing. Code-only no-overflow assertions are not sufficient.

This review package does not execute 1024/320px checks, full keyboard walkthroughs, touch gestures, screen-reader testing, color-contrast measurement, long strings, saved-layout migration in the user's normal profile or every interactive form. Those must not be inferred as passed from successful PNG output.

## 10. Actual verification in this package

{{RESULTS}}

`npm test` combines model/fixture/schema checks and React server-render assertions: unique routes/ownership, reserved intro, correct destinations, safe storage handling, version serialization, parent replies, current counts/sorting, theme isolation, fixture video container header, Exchange filtering/price/score/chart logic, valid presets/legacy data preservation and structural presence of new layouts. No test authenticates a wallet, proves two users communicate, streams creator films, publishes a signed record or checks a live chain.

The package includes full logs, current fixture route data, source hashes and capture results. Historical screenshots and former PASS reports are deliberately excluded. Screenshot SUCCESS establishes a fresh PNG and expected-view guard, not pixel matching, complete feature acceptance or production readiness.

Known limitations/defects from current source: Board “Most recent” sorts numeric createdAt values ascending (3 before 5), so the label is misleading if those values are timestamps; preview query drops when returning via ordinary Home links; finite 20-House canvas and positional sizes still need rendered reference review; mosaic lacks explicit content-kind badge/icon; smallest metadata remains small; no actual introduction video/admission; all films share one eight-second sample; local-room reactions are not live; messages are plaintext drafts; no real wallets/permissions; no independent retrieval. The tablet clipping fix, focus edge cases and mobile tile text fit remain unverified until browser observations/images establish them. This refinement keeps these product boundaries explicit; the package generator itself does not alter source or assets during capture.

## 11. Requirements coverage and next steps

| Requirement | Current behavior | Status | Missing work |
| --- | --- | --- | --- |
| CrazyGames-style Discovery | Shared compact shell, search/categories/featured+shelves, configurable section order | Partial | Rendered reference comparison, richer catalog/assets, final visual approval |
| Poki-style Exchange | Default mixed-size House canvas; optional comparison | Partial | Verify 20-House density/rhythm/mobile and richer production catalog |
| Unique identity/routes | 20 matching Houses, 47 works, two threads/two series | Implemented locally | Browser history regression checks and real entity management |
| Guest watching/reading/search | Sample clip, fixture essays, local search | Implemented locally | Real published content/search service |
| Wallet-only accounts/replay protection | Labeled local gate; disabled wallet controls | Missing | Actual auth, nonce/replay protections and security review |
| Public anonymity/financial privacy | Preview alias; no financial wallet data exists | Partial preview | Real identity/privacy architecture and verified properties |
| House drafts/management/permissions | Static fixtures and matching themes | Missing | Creator workflows, verified identity, server/network enforcement |
| Required fixed creator welcome | Reserved identical structural slot, text preview | Partial | Real face-visible welcome video, private verification/admission enforcement |
| Viewer visual designer | Classic editor plus Discovery show/hide/order; config presets/versions | Partial | House creator editor and more advanced section composition |
| Upload/processing/retries/streaming | Bundled WebM+VTT only | Missing | Resumable upload, queue/transcode/retry, adaptive playback |
| Films/series/collections | Fixture links and two series episode lists | Partial | Creator publishing/catalog management and real media |
| Blogs/e-books | 28 fixture essays/readers; no e-books/editors | Partial / missing | Draft/edit/publish, chapters/navigation |
| Comments/follows/bookmarks/reactions | Persistent local records and parent nesting | Implemented locally | Cross-user persistence, permissions, moderation |
| Board | Two House-authored fixture posts, thread/repost/save | Partial | Creation/publishing, real distributed feed and cross-user replies |
| Live interactions/video live overlays | Local notebook and static/local overlays | Missing network feature | Actual transport, multi-user state, broadcast and safeguards |
| Private messaging | Matching House plaintext local drafts | Missing messaging feature | Requests/accept/block/report, delivery, verified encryption/key recovery/devices/House inboxes |
| Decentralization/protocol/independent retrieval | No network backend or chain | Missing | Decide architecture, signed records/storage/replication/client API and independent proof |
| Governance/98% threshold | No binding governance | Deferred / missing | Resolve voters/quorum/Sybil/appeals/visibility/removal semantics before implementation |
| Financial roadmap | Clearly fictional House metrics; MUNK/MUNKEE agreement distinction in text | Deferred appropriately | No trading; explicit agreements and architecture remain future work |
| Two independent users/restart | Same-browser local records survive reload | Missing acceptance criterion | Real isolated user sessions, shared persistence and backend/network restart tests |
| Responsive/accessibility verification | CSS and fresh capture harness; actual outcome above | Partial | Visual review, broad keyboard/touch/assistive-tech and no-overflow checks |
| Setup/tests/docs | Vite commands, structural checks, current report/capture package | Implemented for frontend | Production operations, deployment configs, real backup/restore and protocol documentation |

Recommended next steps: (1) run/review fresh captures at all three sizes and approve or identify frontend corrections; (2) verify tablet player/native controls, mobile narrow canvas cards, focus order, preset/version persistence, Back and reload with actual interactions; (3) replace remaining temporary photos/font/portrait assets and evaluate the now-expanded 20-House density; (4) only after visual approval, authorize subsequent architecture/backend milestones. No deployment is recommended by this report.

Decisions genuinely still outstanding: visual approval, final supplied creator/font/art assets, scope of more advanced Discovery composition and the House creator designer, and future decentralized architecture/governance/privacy decisions. The CrazyGames/Poki direction is already specified and does not need to be chosen again. No existing chain or custom L1 is falsely represented as implemented.

## 12. Reproduce and share

View locally: `npm run dev -- --port 5173 --strictPort`. New non-saving preview: `http://127.0.0.1:5173/#/home?preset=discovery`; Exchange: `http://127.0.0.1:5173/#/home?tab=exchange&view=mosaic`.

One-command review package from ordinary Mac Terminal (Node 22, installed Chrome):

```sh
cd /Users/azayel/monk && node scripts/review-package.mjs
```

The script uses the existing server on 5173 if reachable, otherwise starts its own Vite and stops only that child. It uses a disposable Chrome profile, never invokes Save Home or applies a preset, verifies saved Home data is unchanged during captures, and cannot read/write normal Chrome-profile storage. To show the personal designer it enters the explicitly labeled session-only local account preview; this does not change saved Home design. It creates a new timestamped directory on every run, records all 30 expected capture outcomes including failures, builds/tests, creates a single ZIP, verifies ZIP CRC and extracted bytes against each packaged file, and requests Finder to open the containing folder. Capture failures still produce an honest report/ZIP and a nonzero exit code.

A full package should contain 30 fresh PNGs, this report, screenshot-manifest.json, browser-results.json, test-results files, route-fixtures.json, source-inventory.json, asset-inventory.json, Git status and tooling/template copies. ZIP verification and Finder-launch logs are alongside the ZIP. Successful automated capture is not visual approval or production readiness.
