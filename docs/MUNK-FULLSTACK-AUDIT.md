# MUNK full-stack audit

Audit date: 2026-10-29 UTC. Repository: `/Users/azayel/monk`. This report and its companion [hosting assessment](MUNK-HOSTING-READINESS.md) are one integrated handoff. Evidence package: `review/fullstack-audit-2026-10-29T21-17-41Z/`. Source was inspected afresh; historical reports were not accepted as verification. Application code was not modified. No provider account, infrastructure, transaction, purchase, or deployment was created.

## 1. Current product status

MUNK currently combines a substantial fictional browsing application with a real private creator-service foundation. It is **not a complete centralized creator-to-viewer product**: no working publication, public House/work lookup, or shared interaction endpoints exist. A database table or unavailable adapter is not a working feature.

The following labels describe a feature at the stated scope, not the entire product:

| Label | Meaning |
|---|---|
| Implemented and verified | Current code plus a passing check listed in section 7; scope explicitly limited to what that check exercised. |
| Implemented but unverified | Concrete code exists, but its real external/user/operational journey was not established. |
| Local/browser-only | Operates in memory, localStorage, sessionStorage, or local object URLs; no shared server persistence. |
| Fixture/simulation | Fictional catalog, synthetic identities/review records, or test-only SDK/API replacements. |
| Missing or blocked | No working implementation, unavailable boundary, missing configuration, or an unmet prerequisite. |

| Capability | Status and evidence |
|---|---|
| Browse, filter and search Discovery; House/article/series/Board navigation | Implemented and verified for guest UI/search/rendering; content itself is Fixture/simulation. `frontend/src/{Discovery,discovery-model,model,fixtures,fictional-catalog}.ts*`; current browser-navigation results. |
| Exchange mosaic/comparison, filters, sample market dialogs | Fixture/simulation; rendering/model behavior verified by current frontend tests. No market data, trading or valuation engine. `Exchange.tsx`, `HouseMosaic.tsx`, `exchange-model.ts`. |
| Native sample video | Implemented and verified at render/model and earlier hash-matched screenshot scope only; actual play/seek was not asserted in this audit. Every fixture film uses the same explicitly labeled eight-second WebM. `Video.tsx`. |
| Real passkey signup, automatic user-owned wallet setup, external-wallet login | Implemented but unverified as a real Privy journey. Actual SDK initializes to idle in this audit. Authenticated browser checks are Fixture/simulation, not signup evidence. `privy-auth.tsx`, `auth-flow.ts`. |
| Sessions, JWT verification, CSRF, logout replay denial, account/House isolation | Implemented and verified in synthetic-identity HTTP tests on native PostgreSQL and PGlite; live provider lookup remains unverified. `backend/src/auth/`, `tests/auth.test.ts`. |
| Actual House drafts and memberships | Implemented and verified at native service/HTTP test scope; My Houses UI selection/error gates verified with isolated fixtures. No fixture ownership fallback. |
| Uploads, durable private storage, FFmpeg worker | Implemented and verified against generated test media/native PostgreSQL. Real large browser uploads, private media seeking and production loads remain unverified. |
| Manual creator review | Implemented and verified for synthetic transitions, evidence immutability and self-review denial. Human review, provider-linked reviewer provisioning and real introduction submission remain unverified. This is not legal identity verification or KYC. |
| Viewer follows/comments/replies/saves/reactions/reposts, Home customization | Local/browser-only; seeded conversation/follow defaults are Fixture/simulation. No shared persistence. |
| Content metadata/articles/House designs | Local/browser-only account/House drafts; media file bytes remain tab-local until explicitly uploaded. |
| Publication/unpublication/public work discovery and real creator footage | Missing or blocked. `creator-services.ts` returns unavailable; `works` is schema only. |
| Messaging/live audience, shared Board, financial onboarding | Missing or blocked; local notebooks/sample views exist. Trading/blockchain intentionally deferred. |

**Configuration finding:** a names/presence-only inspection found `backend/.env` and nonempty database/tool settings, but **no nonempty `PRIVY_APP_SECRET` in that file**. No contents or values are included. The existing API reports health/readiness 200 and denies unauthenticated House access with 401. Readiness does not validate the secret or Privy connectivity. The running process may have inherited configuration; its environment was not read. Do not infer that the previous secret-saving step is still effective. A fresh API process needs a valid read-only secret entered locally. See `configuration-status.json`.

## 2. Frontend inventory and assessment

Routing is a custom hash parser in `frontend/src/model.ts`, rendered by `App.tsx`. It validates public IDs against imported fixture arrays; an actual server House address or work UUID cannot currently become a public page merely by existing in PostgreSQL. Query parameters are read independently by screens; there is no server router or public catalog adapter.

### Routes and screens

| Route | Screen, states, data source and access |
|---|---|
| `#/`, `#/home` | Personal viewing Home; default Discover; query `q` search, `preset=discovery` preview, `tab=mix` My mix. Guests browse; My mix requests sign-in. Design and viewer data are browser-local. `Home.tsx`, `Discovery.tsx`. |
| `#/home?tab=exchange` | Exchange; `view=mosaic|comparison`, `market=<fixture-house>` dialog. Guest browsing, account-gated local watchlist; filters/sort/density/columns browser-local. |
| `#/houses/:fixture-id` | House Home/Films/Essays/Live/Community/About tabs; protected-position creator introduction fixture, theme, collection, follow/message/local-room entries. No real server House fetch. `House.tsx`. |
| `#/videos/:fixture-id` | Sample player, comments/details, local reaction/bookmark/progress; rights/options/local-room dialogs. `Video.tsx`. |
| `#/articles/:fixture-id` | Plain rendered fixture paragraphs, network/House theme toggle, local progress/bookmark/comments. `Article.tsx`. |
| `#/series/:fixture-id` | Fixture series organization/episode links. `Series.tsx`, `discovery-model.ts`. |
| `#/board`, `#/board/posts/:fixture-id` | Fixture post feed/thread, local likes/saves/reposts/comments; filters and local room. `Board.tsx`, `components.tsx`. |
| `#/sign-in` | Focused welcome; Sign in / Create account; secondary More ways to sign in → existing wallet / linked email; Continue browsing. Distinct loading/device/setup/verifying/cancel/error/setup-failed states. `Onboarding.tsx`. |
| `#/account/settings` | Private sign-in/recovery, Link backup email; collapsed advanced wallet export/account ID; sign-out. Guest sign-in gate. No public wallet details. |
| `#/my-houses` | Real `/me/houses` list, role/status, intentional create, select workspace/edit. Loading, server failure/retry, empty, permission states. `MyHouses.tsx`. |
| `#/create/house[?house=UUID]` | New House if no selection; existing authorized owner edit if selected. Four steps: details, creator introduction, design, preview/admission. Server House save and admission; local design and selected file. |
| `#/creator`, `#/creator/overview` | Explicit selected House required; role and House context, local content counts and actual admission status. `CreatorGate`, `Creator.tsx`. |
| `#/creator/library` | Local video/article drafts and local series; no server work library. |
| `#/creator/uploads` | Actual account-owned server uploads/status/retry/private playback. `RemoteUploadQueue.tsx`. |
| `#/creator/design` | House theme/section ordering, Desktop/Mobile component preview, versions/undo/local save. |
| `#/creator/community` | Local activity/sample interactions, not delivered cross-account community. |
| `#/creator/settings` | House details/status; reviewer UI where account has capability. See reviewer placement in `Creator.tsx`/`ReviewerPanel.tsx`; no dedicated review route. |
| `#/creator/house-preview` | Private local design preview; selected House gate. |
| `#/creator/videos/:draft-id[/preview]` | Local video editor/preview; `new` creates local draft ID. Actual transfer button links media to upload IDs locally; metadata is not saved as a server work. |
| `#/creator/articles/:draft-id[/preview]` | Plain-text article editor/private preview; local only, no article backend model. |
| Unrecognized route/unknown public ID | Missing fixture page with Home link; not server lookup. |

All creator workspace/editor/preview links must carry `?house=UUID`. `creator-state.tsx` reads selection on reload, validates it against server-authorized memberships and never chooses a fictional or first House on failure. Account changes clear in-memory asset references; local drafts use account+House keys. One account can view and operate Houses; no signup role selection or automatic House creation exists.

### Dialog and editor inventory

`state.tsx` defines edit/designer, explore, watchlist, options, intro, messages, terms, live and rights dialogs. `Dialogs.tsx` renders them. `App.tsx` also owns recipient picker and minimized local room; `Exchange.tsx` owns a URL-selected market preview portal. `Designer.tsx` edits personal Home presets, surface/font/spacing/density/columns/sections, undo/history and preview before explicit Save Home. `Creator.tsx` separately edits House details/introduction/design and content metadata/article paragraphs, covers/captions/series. Native confirm dialogs guard House save/admission, upload, review decision and local comment submissions. Publication calls are labeled unavailable rather than silently succeeding.

Discovery has CrazyGames-like dense illustrated shelves, featured tiles, continue watching/reading and category filtering. Exchange has a Poki-like packed House canvas plus comparison grid. These descriptions explain existing visual organization, not evidence that either third-party site's behavior was reproduced. Preserve these surfaces; the functional blockers are data/service integration, not a reason for redesign.

### Header, Home, categories and accessibility

Current `NetworkHeader.tsx` and `network-navigation.css`: compact menu/wordmark, desktop search height 44px/max width 560px, one exclusive guest Sign in or account control. Mobile search toggle opens a full-width input; native labeled form submits to Discovery. Side rail has Home, Exchange, Board, Messages, My Houses and secondary Create/Discover Houses. No oversized sidebar signup remains. Discover/My mix is a compact secondary row; Customize Home is in the signed-in menu. Current real-guest browser checks passed navigation, live query/reset, mobile drawer inert background/Escape, search focus and no horizontal page overflow at 390px.

`Discovery.tsx`/`discovery.css`: All/Films/Writing/Series/Houses are native content-width 48px buttons, 20px icons, 14px labels, no subtitles, soft backgrounds and restrained blue selected/focus treatment. Narrow rows scroll horizontally instead of stretching/overflowing the page. Current fresh mobile screenshot was visually inspected; category row is compact and intentionally clips offscreen categories into its own scroll area. Model/render tests cover filtering; this audit did not repeat every category keyboard permutation.

Useful accessibility implementation: skip links; main/heading focus on navigation; labeled search/forms; aria-pressed category/tab controls; status/alert messages; modal focus trapping/Escape/focus return and body scroll locking in `components.tsx`; mobile content inert while menu open. Onboarding browser fixture verifies keyboard order, activation, email autofocus and focus restoration. Native file controls and plain text rendering avoid a fake editor/auth form. Limits: no screen-reader audit, WCAG contrast measurement, zoom/large-text assessment, Safari/iOS/Android matrix, automated axe scan or exhaustive keyboard traversal was run. These remain Implemented but unverified where applicable; no accessibility conformance claim is made.

The creator introduction is outside customizable section registration in `LocalHousePreview`; no template can hide/reorder it. Public fixture `House.tsx` likewise renders its intro above House tabs/content. Verified component/model behavior does not establish a public introduction delivery service.

### State coverage and concrete problems

Implemented states include account SDK loading/idle/device/setup/verifying/cancelled/error/setup-failed; server House loading/retry/empty/permission denial; local storage failure warnings; empty search/library/watchlist; selected file/decode error; actual queued/processing/ready/failed uploads; explicit save/review success; and publication unavailable feedback. Not all backend error codes retain a distinct frontend type: `api.ts` collapses conflicts, rate limits and some not-found errors into generic network/permission categories, while preserving server messages.

The following are observed source defects or verified limitations, **not optional visual preferences**:

| ID | Problem and evidence | Reproduction / implication |
|---|---|---|
| F01 | No public actual House/work resolver. `model.ts` permits only fixture IDs; `App.tsx` imports fixture lookup. | Save an actual House through service, then open `#/houses/<actual-address>` in guest browser: parser returns missing. Public work creation is not available to attempt next. |
| F02 | Introduction submission always allocates/uploads a new file; no UI reuses an already-ready introduction. `creator-state.tsx: submitHouse`, `server-creator.ts`. | Submit, then lose/timeout the response or close before admission. Reopen; queue may contain a ready intro, but setup requires file reselection and uploads again. Consumes quota and duplicates immutable evidence candidates. Source-derived, not reproduced with private data. |
| F03 | Watch/read progress uses global `munk-reading-watching-progress-v1`; Exchange settings/watchlist use a global key. `progress.ts`, `exchange-model.ts`. | Account A watches/stars; sign out and account B uses same browser/origin: same progress/Exchange preferences remain. Ordinary saves/comments/follows use account-scoped v3 state and are separate. Shared-device privacy inconsistency. |
| F04 | New accounts get `display_name='MUNK creator'` before any House. `backend/src/auth/sessions.ts`. | A first real login would show this in private account settings despite the one-viewer-account product model. Source-derived; no real new account was created. |
| F05 | Recovery link action directly invokes `privy.linkEmail()` with no local success/failure wrapper/status refresh. `privy-auth.tsx`, `AccountSettings`. | Cancel/fail linking and inspect MUNK status; only provider UI may explain it. Real provider result and recovery were not tested; wrapper gap is observed in source. |
| F06 | Legacy unavailable publication interface and live upload interface coexist; UploadStatus state is free-form string. `creator-services.ts`, `server-creator.ts`, `contracts/src/{index,creator}.ts`. | Future adapter may confuse asset/upload IDs or accepted states. Current consumers typecheck; no demonstrated runtime contract mismatch. Tighten before adding publishing. |
| F07 | Upload queue's Retry processing is shown for every failed upload, including failed transfer without source. `RemoteUploadQueue.tsx`, `uploads.ts:retryProcessing`. | Oversize/interrupted transfer → failed → queue Retry processing → backend conflict (no received source). Correctly no false success, but wrong recovery action. Native test proves failed transfer state; UI consequence is source-derived. |
| F08 | Pending admission has no dedicated submission-history/status endpoint; UI can see House status but not detailed returned reviewer reasons. | Reviewer requests changes → creator reloads House → status visible, reasons not provided by House DTO. No human review attempted. |
| F09 | Reviewer capability UI is embedded in creator workspace, which requires a selected House. | Reviewer with no memberships has no dedicated review screen; granting capability alone does not provide a straightforward queue route. `CreatorGate`, `ReviewerPanel`; source-derived. |
| F10 | Comment draft/reply keys use target only in sessionStorage, not account identity. `components.tsx:Thread`. | Draft a comment, switch account in same tab: draft text can remain. Unsaved text preservation is intentional across auth, but account-switch privacy needs an explicit policy. |

Optional polish, separate from defects: menu wording refinements, more mobile device coverage, reduced motion review, chunk splitting and standardized form spacing. No card/header redesign is necessary for the functional milestone.

## 3. Backend inventory

### Runtime, configuration and startup

Node >=22, ESM TypeScript run through `tsx`; Fastify 5.12.7, cookie plugin 11.1.5, Privy Node 0.37.0 and pg 8.23.1 are installed per lockfile. `backend/tsconfig.json` is strict/noEmit; backend `start` executes TS and therefore needs runtime `tsx`, currently a **devDependency**. An `npm ci --omit=dev` installation cannot be assumed to start it. FFmpeg/ffprobe installers and native PostgreSQL are devDependencies; real hosting must provision compatible binaries separately or change packaging in an approved follow-up.

From root: `npm run dev:backend`; `npm run worker --workspace backend`; `npm run db:migrate`; `npm run dev -- --port 5173 --strictPort`. Backend non-watch startup: `npm run start --workspace backend`. API/worker are separate processes; neither launches the other. No operational supervisor/build/deployment manifest is present. Current audit did not restart existing services or migrate personal data.

`config/env.ts` validates URL shape/origin/integers/TLS flag, resolves media relative to backend and requires HTTPS APP_ORIGIN for production. Names/status only: `configuration-status.json`. Defaults: loopback API port 3001, frontend origin localhost:5173, five DB connections per process, media under `backend/.data/media`, tools on PATH. No secret value is ever needed in a report or browser variable. `.env` and `.data` are ignored.

### Complete registered API inventory

Source: `backend/src/api/{app,auth,protected}.ts`. Exactly **21 explicitly registered routes** (framework HEAD behavior is not a separate application endpoint). All mutation routes require exact configured `Origin`; all protected mutations also require session-derived `X-CSRF-Token`. Schema rejects additional input fields. “Member/uploader” means fresh House membership plus the original upload account, not all House members.

| Method/path | Authentication / authorization | Purpose and storage |
|---|---|---|
| GET `/api/health` | Public | Liveness only; no dependency test. |
| GET `/api/ready` | Public | DB applied checksums must match complete migration list; 503 otherwise. Not Privy/media/worker readiness. |
| GET `/api/auth/challenge` | Public, IP rate window | Five-minute one-use challenge hash in PostgreSQL + HttpOnly challenge cookie. |
| POST `/api/auth/sessions` | Real verified Privy access token, challenge cookie/header, origin/rate limit | Account/identity/wallet mapping, hashed seven-day persistent session, CSRF response. |
| GET `/api/me` | Active, unexpired MUNK session | Private account display name/reviewer flag/expiry/CSRF. |
| DELETE `/api/auth/session` | Session + CSRF + origin | Revoke matching provider-session MUNK sessions and clear cookie. |
| GET `/api/me/houses` | Active account | Actual memberships with owner/publisher role. |
| POST `/api/houses` | Active account + CSRF/origin, UUID Idempotency-Key | Atomically create House+owner membership+creation request; unique reserved address. |
| GET `/api/houses/:id/draft` | House member | Private draft/status/version. |
| PATCH `/api/houses/:id/draft` | House owner + CSRF/origin, expected version | Update fields, reset review on material change; founder/address immutable. |
| POST `/api/houses/:id/uploads` | Member for video; owner for intro; CSRF/origin | Allocate asset/upload session and quota. |
| GET `/api/houses/:id/uploads` | Member; results only current uploader | Latest 100 uploads for account/House. |
| GET `/api/uploads/:id` | Member/uploader; intro owner | Current durable asset state and bytes/duration/error. |
| PUT `/api/uploads/:id/content` | Member/uploader + CSRF/origin, valid receive lease | Stream octet bytes to private file, checksum, queue job. |
| DELETE `/api/uploads/:id` | Member/uploader + CSRF/origin | Cancel created/receiving/failed-without-source; completed evidence cannot cancel. |
| POST `/api/uploads/:id/retry-processing` | Member/uploader + CSRF/origin | Requeue failed asset with received source; resets attempts. |
| GET `/api/uploads/:id/playback` | Member/uploader; ready only | Private MP4 stream. No byte-range implementation. |
| POST `/api/houses/:id/admission` | Owner + CSRF/origin, expected version | Immutable submission snapshot bound to ready intro checksum. |
| GET `/api/reviews` | Active reviewer capability | Up to 100 current pending submissions, excluding own/involved Houses. |
| POST `/api/reviews/:id/decisions` | Reviewer, no self/involved review; CSRF/origin | Append-only creator-control/introduction decisions and derived House status. |
| GET `/api/reviews/:id/introduction` | Reviewer, current revision, no self/involved review | Private reviewed intro stream. No public access/range. |

There are **no** work CRUD/publish/unpublish, public catalog/House/work/media, follows/comments/Board/messages/preferences/membership-management endpoints. No cancellation frontend service maps DELETE today. `api-inventory.json` supplies exact source lines; the table above adds semantics.

### Database and migrations

`0001_foundation.sql`: accounts → identities/wallet credentials; houses reference founder/operator accounts; memberships join House/account; assets belong to House/creator; upload sessions belong to asset/uploader; processing jobs reference asset+generation. Admission submissions bind House+revision+intro SHA/snapshot, decisions bind submission/reviewer. Reviewer capability is explicit. `works` references same-House video/thumbnail/captions assets; follows join account/House; comments reference work/account with same-work parent constraint. **works/follows/comments are unused service scaffolding, not working endpoints.** No article, message, Board, preference or saved-item tables exist.

`0002_creator_workflow.sql`: reserved addresses, immutable founder/address trigger, receive leases and account-scoped creation idempotency. `0003_auth_sessions.sql`: login challenges, sessions, provider-session revocations and hashed-IP rate windows. Migration runner additionally creates `schema_migrations` with SHA-256 checksums; session advisory lock serializes migration runners, each file is transactional, drift/unknown history fails readiness. Forward-only; no rollback scripts. Indexes cover memberships, asset House, job claims, work/comment lookup and sessions. No seeded production accounts/reviewers exist.

Native PostgreSQL 18.4 tests applied the current migrations in isolated schemas, enforced constraints/triggers, rolled back failures and verified a process restart retains a probe. PGlite exercises additional persisted reopen. This is not a backup/restore drill or proof of hosted persistent disks.

### Authentication, authorization and privacy

`PrivyIdentityVerifier` uses installed SDK signature/app/issuer/expiry verification, then server-side provider user lookup; verifies subject/session/future issue time, rejects guest users and delegated/non-user-signable Ethereum wallets; embedded wallets require provider wallet ID. MUNK stores identity mapping and wallet metadata, **not private keys, passkeys, key shares or provider access tokens**. Frontend signup creates wallet through the authenticated client without developer signers; existing-wallet login uses real provider modal. No MUNK signing endpoints exist. Actual dashboard custody/recovery/secret scopes cannot be proven from this source or SDK initialization alone.

Login uses a challenge cookie whose hash matches a header and unconsumed DB entry. Challenge is atomically consumed; per-IP five-minute counter allows at most 30 challenge/login operations (both consume budget). Account mapping is serialized by subject advisory lock; unique wallet binding prevents cross-account reuse. Fresh random session token is cookie-only; database stores SHA-256; CSRF derives HMAC from the token. Cookie is HttpOnly, SameSite=Strict, `/api`, Secure when APP_ORIGIN is HTTPS, seven days. API includes private CSRF in `/me` response and frontend keeps it in memory. Origin and timing-safe CSRF checks protect mutations. Tests exercise real cryptographic verification using generated ES256 keys, but provider user lookup and identities are synthetic.

Every protected request queries active/unexpired/unrevoked session; House operations recheck active account and membership under locks, never trust actor IDs from HTTP input. House owner may edit/admit; publisher may upload video. Upload objects are **uploader-specific**, so one publisher cannot play another member's private upload via current endpoints. Reviewer grant is an operator CLI requiring an existing active Privy-linked account; queue/decisions reject founder/operator/submitter/membership self-review. One reviewer can supply both checks; no quorum requirement. No reviewer revocation CLI/UI or general membership CRUD exists; DB operator work would currently be required.

Logout revokes all local sessions for that subject/provider-session ID, bans re-exchange of that provider session for seven days, clears cookie; frontend then calls provider logout. Server does not revalidate provider token/revocation on each MUNK request: seven-day local sessions remain until local expiry/revocation/suspension even if an upstream session changes. Expired session/revocation row cleanup has no scheduled implementation. No absolute cross-device account-revocation UI or device/session list. Tests verify local expiry/logout replay, not live upstream events.

### Admission and introduction

House metadata must be nonblank; expected version must match. Owner declares visible face and public-information consent (not automated proof). Intro must belong to same House, be ready, purpose introduction, checksum present, duration **120–240 seconds** after real probe/transcode. Immutable snapshot + intro SHA prevent later evidence substitution. Status: draft → pending_review → admitted only when both creator_control/introduction approve; any rejection wins, otherwise changes_requested, otherwise pending. Repeated identical decision is idempotent; different alteration conflicts. New revision needed after change/request/rejection; material House edit resets to draft/increments revision; old submission becomes superseded. Decisions/submissions have SQL triggers prohibiting update/delete. Real face suitability/creator control remain human tasks. Public introduction placement exists in local previews, but public delivery is missing.

### Upload/media/worker behavior and operational gaps

Allocation accepts intro/video + positive byte size; intro max 512 MiB, video max 2 GiB, summed allocated asset quota 10 GiB per House. Quota counts cancelled/failed assets too; no reclamation exists. HTTP streaming is octet-stream (no filename path use), API JSON default 64 KiB, upload route body cap 2 GiB and request timeout 30 minutes. Claimed MIME/file extension is not trusted as valid content; exact byte count and SHA are enforced, then actual FFprobe validation. Arbitrary bytes can occupy private storage before worker rejects them; antivirus scanning/content moderation/global abuse limits are absent.

MediaStore generates opaque keys, rejects traversal, mode-700 directories/600 source files, exclusive partial writes, fsync+rename/directory sync. Originals and processed media are outside frontend/public. No private files were opened for this audit. Receive lease 30 seconds with 10-second heartbeat prevents concurrent ownership; interrupted transfer can restart **from zero**, within 24-hour session expiry. No chunk offsets, multipart-resume protocol, server-side byte progress updates during PUT, or frontend reconnection to allocation ID exists. Completed sources preserve review evidence. Cancel aborts lease before completed source; manual processing retry retains source. Browser “Release local selection / stop request” aborts fetch/releases File, not DELETE cancellation. Orphan `.part`/token directories after hard process death and completed/cancelled quota retention have no sweeper.

Worker claims one job at a time using `FOR UPDATE SKIP LOCKED`, generation/lease token, 30-second lease and five-second heartbeat; progress_seconds stored, not exposed in upload DTO. Three attempts bound lease recovery; exhausted crashed final attempt becomes failed. Shutdown abort requeues if attempts remain. Normal decode/process failure becomes failed and requires explicit retry, not exponential automatic retry. Worker polls every second; multiple processes can claim independently but all must share the same storage path/filesystem. DB fencing prevents stale completion; output keys unique per token. Tests inject an expired lease and lost COMMIT acknowledgement while exercising real processing; they do not kill/restart a production worker under load.

FFprobe accepts mov/matroska/webm containers with file/pipe protocols, video <=8192 per dimension, positive duration <=2 hours; intro duration stricter. FFmpeg strips metadata/chapters, maps first video/optional audio, scales <=1280×720 even dimensions, H.264/AAC MP4 faststart + JPEG poster, two threads, 30-minute timeout, output size cap ~3 GiB, then reprobes codec/duration/size. No adaptive bitrate/HLS/CDN/object-store adapter, media sandbox/resource cgroup, hardware acceleration or malware scan. Probe timeout 30 seconds. Tool output/path errors are sanitized. Source and processed disk can substantially exceed 10 GiB allocation quota; no host disk watermarks.

Private playback/review endpoints simply send a read stream as video/mp4. **No Range parsing, Content-Range, Accept-Ranges, partial 206/416, explicit content length or seek test exists.** Native output validity does not establish efficient seeking. No poster delivery endpoint despite generated poster. Every API response has no-store/nosniff. Authentication occurs at request start; an already-open stream is not continuously revoked. Public anonymous delivery is absent.

### Persistence, operations and limitations

House drafts, memberships, admissions, uploads/jobs/auth sessions live in PostgreSQL; private media filesystem must persist alongside it. Local content metadata/House designs never enter the `works`/`houses.design` columns through existing endpoints. Viewer follows/comments/saves/Board/messages/personalization are not implemented as backend services, even though follows/comments tables exist.

API logs only method/status/request IDs and sanitized errors, not headers/query/body/raw exception detail. This reduces leakage but limits diagnostics; no metrics, audit-event sink, tracing, alerting, worker heartbeat readiness or structured job-error dashboard. Pool uses TLS verification if DATABASE_SSL=true, max5 default per API/worker, three-second connection and ten-second statement timeouts. No query pagination beyond fixed 100-item queues/lists. No upload-specific account/IP rate limits, disk deletion lifecycle, backup job, restore drill, quotas by account, load test or disaster recovery runbook has been verified. Health is too narrow for full-stack availability. No readiness guarantees for tools/write access/Privy. See hosting companion.

## 4. Frontend–backend integration inventory

| UI entry/route | Frontend service/controller | Endpoint | Persistence / actual boundary |
|---|---|---|---|
| Signup/sign-in | `privy-auth.tsx`, `auth-flow.ts`, `api.ts` | GET challenge → POST sessions; GET me | Real provider SDK + account/identity/wallet/session tables; provider journey unverified. |
| Sign out / private settings | `privy-auth.tsx`, `Onboarding.tsx` | DELETE session; email/export call Privy client directly | Revocation DB + provider logout; email/wallet controls not MUNK DB CRUD. |
| My Houses / workspace selection | `MyHouses`, `creator-state`, `serverCreator.houses` | GET me/houses | Actual membership SQL; query-selected House, no fixture fallback. |
| Save new/edit House | `HouseSetup` → saveHouse → serverCreator.create/update | POST houses / PATCH House draft | Actual PostgreSQL; UUID idempotency/version; local design separately. |
| Reload selected House | `creator-state.reloadServer` | GET me/houses + GET House uploads; draft GET used on submit | House list currently supplies metadata; no global public lookup. |
| Intro/admission | `HouseSetup.submit` → submitHouse | Save House; allocate+PUT; poll GET upload; GET draft; POST admission | Real private media/jobs + immutable submission; always uploads anew. |
| Reviewer UI | `ReviewerPanel` → apiClient | GET reviews; GET intro stream; POST decisions | Real capability checks/submission decisions. Synthetic checks only. |
| Video upload/editor | `ContentEditor.transfer` → transferVideo → serverCreator.upload | POST allocation + PUT content | Media/jobs durable; draft's uploadId/assetId metadata binding only browser-local. |
| Queue / retry / playback | `RemoteUploadQueue`, `creator-state` polling | GET House uploads / POST retry / GET playback | Current account uploader assets only; private MP4 no Range. |
| Release local selection | File map/object URL + AbortController | Aborts current fetch; no DELETE adapter | Completed upload stays; server cancellation exists disconnected from UI. |
| Publish / unpublish | `creatorServices.publish/unpublish` | **None: unavailable** | No work saved/published; schema alone. |
| Guest discovery/search/House/video/article/series | Imported fixture catalog + filter functions | **None** | Static public assets; bundled sample video, never creator upload. |
| Follow/comment/reply/save/repost/like | `useApp` → setState | **None** | Account-scoped localStorage, synthetic defaults; no other user sees updates. |
| Home customization | `Designer` → commitDesign | **None** | Local saved versions/undo per account; no server synchronization. |
| House design/content/article/series drafts | `creator-state.save`/creator model | **None** | Account+House browser storage; selected File bytes tab-only. |
| Messages/live local room | `Dialogs`, App rooms | **None** | Local message drafts; room notes in memory; no delivery. |
| Exchange settings/watchlist | exchange-model | **None** | Global browser settings; all metrics static sample values. |

Frontend can be built as static assets and API/worker can run separately, but **independent arbitrary origins are not currently supported end to end**. Client supports public `VITE_API_BASE_URL` and credentials include; Vite dev `/api` proxy uses server-only `API_PROXY_TARGET`. Production Vite build does not include that proxy. Backend has no CORS/preflight handling, exact one APP_ORIGIN mutation check, SameSite=Strict cookies and trustProxy=false. Smallest hosted topology: same public HTTPS origin, static frontend + reverse-proxied `/api`; API/worker separate private processes sharing DB/media. Cross-site hosting requires deliberate CORS/cookie/CSRF/security changes, not only an env URL change. Private `<video src>` relies on cookies and lacks a cross-origin integration contract.

`contracts/` is portable ES-only source, foundation/auth/creator JSON schemas + guards. No Node/server dependencies. Inputs consumed by Fastify; responses often inline frontend guards rather than one fully shared response schema. Legacy UploadReceipt (`assetId`, optional resumeToken) is distinct from real UploadStatus (`uploadId`, purpose, duration), and unused legacy adapter advertises resume/publish unavailable. No current type check failure, but duplication and permissive response state/number validation are maintenance risks. Error codes and schema/frontend max lengths differ (House name UI80/API120, description UI2000/API4000); stricter frontend isn't a breaking server mismatch, but should be documented/centralized.

## 5. Complete user journeys

| Journey step | Actual behavior, permissions and persistence | Evidence / remaining blocker |
|---|---|---|
| Guest discovers/searches | Freely browses fictional catalog, query/category filters; no auth required. | Current real guest browser search/navigation PASS; source filters/render tests. |
| Guest watches/reads | Article fixture text; sample WebM native player and captions; local progress. | Source/render + relevant screenshots; no current actual playback/seek assertion. Actual uploaded creator footage inaccessible publicly. |
| Create embedded-wallet account | Passkey signup then automatic createWallet if missing; user-controlled, no developer signer; no automatic House. | SDK ready idle in real browser; full state machine verified only with SDK/API fixtures. File secret missing; live provider creation unverified. |
| Signup failure/retry/original destination | Pending provider UID retained in sessionStorage; refresh before wallet retry; MUNK session only after backend verify; intent/draft restored without submission replay. | Current onboarding fixture PASS. Closing tab/device/provider loss and real recovery unverified. |
| Reload/sign-out/sign-in | `/me` restores DB session; refresh/focus checks; DELETE revokes provider-session scope; provider logout then real sign-in. | Native HTTP synthetic identities pass; real reload/relogin cookie/provider journey unverified. |
| Link recovery / restore access | Private settings Link backup email invokes provider; linked email sign-in disables signup; export secondary. | UI/source/fixture only. No human OTP, lost-device recovery, wallet recovery or export tested. Backup sign-in is not a guaranteed wallet recovery plan. |
| Viewer follows/comments/saves/customizes | Real sign-in gates local writes; comments confirmed; Home draft save/history. Viewer still browses normally. | Local/browser-only, account-scoped except identified progress/Exchange/draft keys; no cross-device/shared persistence. |
| Creator creates/selects House | My Houses server memberships, explicit `?house=UUID`; new draft vs edit separate. | Native create/idempotency/ownership/version tests + current journey fixture; no actual account House UI submission in this audit. |
| Intro + review | Owner uploads private 2–4 minute introduction, worker ready, immutable submission, separate capable noninvolved reviewer approves both checks. | Native actual generated121sec media + synthetic reviewer PASS; human creator/control check and real reviewer navigation blocked/unverified. |
| Creator uploads video/metadata | Transfer durable; title/description/series/thumbnail/captions draft browser-local, file references lost on reload. | Native upload/process PASS; current editor UI fixture. No server work linkage/metadata CRUD. |
| Creator publishes | Button truthfully unavailable; no work/public state changes. | Missing or blocked; no endpoint to complete it. Admission does not publish. |
| Separate guest opens actual published video | Cannot complete; public route parser accepts fixture IDs only, no public resolver/delivery. | Missing or blocked; no test pretends fixture video is published footage. |
| Different authenticated user interacts | UI changes affect that user's local browser data only; cannot reach creator via shared comments/follows/messages. | Missing or blocked as shared service; local controls exist. Trading eligibility does not gate ordinary local participation. |
| Restart services and retain shared data/media | DB/media designed durable; worker leases recover; stateless API can reopen sessions. | Native PostgreSQL process restart probe, session-service reconstruction, storage reopen and expired-lease tests PASS. Full live API+worker+frontend restart with real accounts/media NOT performed; persistent user's DB left untouched. |

No account/financial role split is necessary: authenticated accounts have optional House memberships/reviewer capabilities. Trading onboarding and blockchain stay outside this milestone.

## 6. Root/tooling/documentation cleanup

One root Git repository/npm workspace and lockfile exist; boundary check disallows frontend importing backend, keeps fetch centralized in api.ts and contracts portable, and rejects nested repos. Current `git status --short` shows top-level source mostly untracked; no stable committed baseline can be assumed. No commit/staging was performed. Ignore rules cover env, runtime, dependencies, build output, `.qa`, review/artifacts and macOS metadata; templates are exceptions. No CI definition or hosted deployment manifest was found.

Root README has current startup commands but still contains historical statements that all preview services make no remote requests; the real `server-creator` adapter does. `docs/PROJECT-STRUCTURE.md` contains explicitly historical reserved-backend/no Git/preview-account instructions below its update header. `docs/frontend-status.md` still describes session-only wallet preview/no real auth. Earlier frontend handoffs and vertical-slice plans are useful history but conflicting onboarding/ownership claims must be clearly archived or superseded before engineer onboarding. `backend/src/domain/access.ts` retains a stale comment claiming HTTP auth always denies until Privy is connected; actual runtime has Sessions. Report finding, not code change.

Scripts live in frontend/scripts despite test purposes; direct imports/hoisted dependencies need workspace context. Existing old browser/capture commands vary in scope; root `test:browser` delegates to an older Discovery capture, not all current auth/House checks. The repaired complete screenshot workflow is separate. macOS Chrome paths/CDP ports and development .qa fixtures are test-only; never host `.qa`, source trees, review packages or Vite dev server. Existing successful screenshot evidence was not rebuilt en masse.

## 7. Verification and evidence limits

See timestamped `verification-results.json`, sanitized logs and source hashes in the package for final command results. Audit runs:

| Command / check | Scope |
|---|---|
| `npm run check` | PASS (exit0): boundaries, ES-only contracts TypeScript, backend TypeScript, frontend TypeScript/Vite build, seven frontend script suites, backend node:test (8 pass,3 skipped,0 fail). Default backend intentionally skips three native cases without TEST_DATABASE_URL; separate native run covers them. |
| `npm run test:native --workspace backend` | PASS: 8 tests, 0 failed/skipped; native PostgreSQL18.4 process stop/start persistence; actual FFmpeg/probe/JPEG; synthetic identity/review data only. |
| `node frontend/scripts/navigation-browser-check.mjs` | PASS: 8 groups; real guest header/search/mobile navigation then isolated AuthContext/API fixture for signed-in header/designer. |
| `node frontend/scripts/onboarding-browser-check.mjs` | PASS: 10 groups; real guest provider ready/idle; production SessionBridge with substituted SDK/API for signup/setup retry/cancel/error/draft/keyboard. No real account or secret sent. |
| `node frontend/scripts/journey-browser-check.mjs` | PASS (18 groups): real guest entry plus fixture membership/selection/permissions/new draft/draft restoration; not real backend account data. |
| Credential-free live probes | Frontend200, APIhealth200, ready200, protected my/houses401. No cookies/bodies/user records captured. |
| `npm audit --json` | Current registry advisories; initial restricted DNS failure then successful authorized retry. Nonzero exit indicates advisories, not install failure. No upgrade run. |

No screenshot is a real authenticated signup proof. Fresh selected real guest onboarding/navigation screenshots are included; authenticated fixture results are labeled as such in JSON and prose. No old screenshot is silently reused. Source hashes cover implementation/assets/config/scripts/docs; sensitive configuration values and personal media/data were excluded. Source references are repository-relative so the reports remain useful outside this machine. Test logs contain synthetic fixture identifiers only, never real JWTs/cookies/provider records. A final source-preservation result distinguishes permitted documentation additions from application changes.

Build warnings were nonfatal: several installed SDK modules contain Rollup annotation/directive warnings; the largest emitted index chunk is about1,946.81kB (553.53kB gzip), and Vite warns about chunks over500kB. Build time on this machine was1m33s. This is a measurable payload/performance concern, not a failed build or a measured mobile loading result. No unchanged test suite was rerun after passing.

**Unverified:** real Privy signup/wallet creation/login/OTP/link recovery/export/provider revocation; actual private browser upload/play/seek; public publication and cross-user journey (missing); screen reader/device compatibility; load/security penetration testing; production deployment, monitoring and backup restoration. No production readiness claim is supported.

### Dependency advisories

Current registry result: **34 affected package entries: 22 high, 12 moderate, 0 critical**. These are dependency graph entries, often propagated from a small number of leaf advisories, not 34 demonstrated exploits. Earlier advisory counts were not reused. `dependency-findings.json` contains each package, installed versions, production/dev classification from the lockfile, advisory URLs/ranges, inherited via chains and proposed fix metadata; raw registry response included without package installs.

Most production-graph entries are frontend Privy/wallet connector dependencies: Privy React/core/api-base, Base/Coinbase, Reown, MetaMask, WalletConnect/wagmi/viem/abitype, query-string/decode-uri-component, ws, uuid and zod. A production dependency graph label does not prove that vulnerable Node-only code enters the browser bundle or a reachable API path. MUNK has no application WebSocket server/trading/payment route. Backend application uses Fastify schemas rather than Zod directly; Privy user/auth SDK transitive reachability still needs targeted review. Not every installed copy matches an advisory range; the inventory deliberately lists copies rather than calling every version vulnerable.

Priority leaf findings: malformed URI decoding resource consumption in decode-uri-component, websocket fragment/memory issues in affected ws copies, and oversized-collection validation in older Zod. Installed newer copies coexist with older transitive copies. Review exact connector/SDK call paths before choosing an approved upgrade strategy. MUNK's own frontend query uses native URLSearchParams, not a direct application import of the vulnerable decoder. No exploit attempt or proof of safe transitive execution was performed. References: [decoder advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [ws advisory](https://github.com/advisories/GHSA-58qx-3vcg-4xpx), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), retrieved2026-10-29.

Development-only direct Vite5.4.21 and esbuild0.21.5 advisories concern dev-server exposure/path handling; several Vite findings are Windows-specific and do not establish exploitation on this Mac. They do reinforce that a public demo must serve the static build, not expose Vite/esbuild/.qa. No backend direct Fastify/pg/cookie/Privy Node entry is flagged in this aggregate result; absence of a registry finding is not a security assessment. `tsx` runtime dependency classification and vulnerable transitive SDK copies require attention before deployment. No forced fixes or dependency changes were made.

## 8. Combined prioritized cleanup plan

Effort estimates are engineering days for one engineer familiar with this stack, excluding external approval/provider support, production assurance and optional redesign. P0 means blocks a truthful complete functional demo; P1 blocks public hosting or reliable shared use; P2 polish/maintainability. Estimates assume no financial/blockchain scope and a small invited audience.

| Class / priority | Problem/evidence and user impact | Proposed fix / dependencies | Acceptance criteria | Rough effort |
|---|---|---|---|---|
| Core P0 | Secret absent in file; real signup/recovery unverified (§1/§5) | Validate local read-only provider config without disclosure; run two real accounts on exact development origin, retain failure evidence; fix only demonstrated auth blockers after approval. | Signup auto wallet; reload/logout/relogin same account; retry setup same UID; backup email login tested; no House auto-created/no signer. | 1–3d, provider/device availability assumed |
| Core P0 | Works/publication and public resolvers missing (F01) | Add shared work DTOs/CRUD; bind ready same-House assets; version/idempotency; admitted House publication eligibility; unpublish; public House/work/catalog lookup. | Owner/publisher create draft; approved House publishes; independent guest resolves actual URL; unpublish removes visibility; unauthorized calls denied. | 4–7d after auth acceptance |
| Core P0 | Private streams no Range; no public actual media/poster path | Add authorized/range-capable private delivery and deliberate published-only public delivery; deny intro/private originals. | 206/416/HEAD/Content-Length tests; seek actual processed video in fresh guest; revoked/unpublished access semantics tested. | 2–4d, storage choice fixed |
| Core P0 | Shared follows/comments absent; creator can't receive interaction | Implement minimum follows/comments/replies with work/publication permissions, moderation limits and UI adapters. Keep messages explicitly unavailable. | Account B interacts with actual work; A sees it after reload; guests read allowed content; no spoofed author/cross-work parent; DB persists. | 3–5d after publication |
| Core P1 | Intro always retransfers; wrong failed-upload retry; reviewer queue/reasons gaps (F02/F07–09) | Persist usable intro reference/status, reuse ready asset; separate retry-transfer vs processing; connect DELETE if desired; dedicated capability-gated review route and creator reasons. | Timeout/reload resumes admission using existing ready intro; failed-transfer recovery actionable; reviewer with no House can review another account; self-review denied. | 2–4d |
| Core P1 | Content/design/save data browser-only; cross-account browser keys (F03/F10) | Define minimum server metadata/preferences ownership; scope optional progress/watchlist/draft keys and deliberate guest→account preservation policy. | Metadata reloads on another browser; account switch exposes no other's private drafts/progress; unsent signup draft retained; House designs independent. | 2–5d; social persistence separate above |
| Public P1 | TS runtime dependency, no portable startup/supervision (§3) | Choose TS runtime packaging or compile build; provision Node/tools, persistent media, API+worker supervision and migration step. | Clean target-OS install starts without dev-only runtime assumptions; restart preserves DB/media/sessions/jobs; no `.qa` served. | 1–3d |
| Public P1 | Proxy/origin/cookies/rate limits incomplete (§4/hosting) | Same-origin HTTPS reverse proxy, secure cookie verification, precise upload/time limits; trusted proxy policy with spoof tests; global/upload concurrency/rate bounds. | Real browser same-origin login/upload works over HTTPS; forwarded spoofing denied; large valid upload accepted; quotas/429 behavior tested. | 1–3d plus infra setup |
| Public P1 | No backup/restore/sweeper/disk alarms (§3) | Coordinated PostgreSQL/media backups, encrypted retention, off-host copy, restore drill; lifecycle quotas/orphan cleanup without deleting review evidence. | Restore into empty isolated environment and play referenced media; bounded disk use; tested rollback of cleanup; alerts on disk/job/DB failure. | 2–4d |
| Public P1 | SDK transitive and dev-server advisories (§7) | Review reachable affected paths/versions and compatible targeted updates in separately approved work; pin/test lockfile; never publish dev server. | Document applicable risks and fixes/accepted exceptions; auth/browser/native regression checks pass after approved changes. | 1–3d initially; dependency constraints may expand |
| Public P1 | No production Privy/domain/passkey/recovery acceptance | Configure separate intended hosted app/origin using current provider rules, least-privilege secret locally/secret manager, preserve user-owned custody. No setup executed here. | Hosted HTTPS real signup/relogin/recovery with no developer signing authority; documented development vs hosted identities/RP implications. | 1–2d plus provider process |
| Maintenance P2 | Stale docs/comments, mostly untracked repo, overlapping contracts/scripts (§6/F06) | Establish reviewed commit baseline; mark historical reports; consolidate current runbook, response guards/enums and test commands. | New engineer can start/check without preview auth or historical paths; one clear API contract inventory; source-only reviewed repo. | 1–2d |
| Optional P2 | Accessibility/device/performance assurance incomplete | Test screen readers, zoom, contrast, real mobile and media controls; measure bundle and split SDK where safe. | Findings recorded with reproductions; keyboard flows preserved; no visual redesign required. | 1–3d |
| Deferred | Trading/financial onboarding, tokens/chain actions, paid infrastructure changes | Keep out of centralized demo; separate future requirements/approval. | No signing authority, transactions, market claims or role signup creep. | Not estimated |

**Smallest complete next milestone:** first establish real two-account Privy acceptance locally, then one admitted House → one server-backed video draft → publication → independent guest playback/seek → second account follow/comment → creator sees response → API/worker restart retains records/media. Keep existing visual design, local advanced designers explicitly labeled until their persistence is included, fictional Exchange clearly sample-only, and messaging delivery unavailable. Only after this local vertical slice passes should the same-origin HTTPS invited demo and backup/restore gate be completed. No part of this plan was implemented during the audit.
