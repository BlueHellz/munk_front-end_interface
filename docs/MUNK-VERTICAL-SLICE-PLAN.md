# Proposed MUNK milestone: one real creator-to-viewer video journey

Current approval update (2026-10-27): folder boundaries and this milestone are approved, with **real wallet creation within MUNK required**, alongside existing-wallet access. The existing-wallet-only recommendation below is superseded by [embedded-wallet setup](../backend/EMBEDDED-WALLET-SETUP.md); provider choice/configuration precedes authentication implementation. The first backend increment implements configuration/API/database foundation and shared contracts; see [backend status](../backend/README.md). Admission must be labeled **Manual creator review**, never verified legal identity or KYC. Historical pending-approval and reserved-backend descriptions below predate this update. Blockchain transactions, trading, purchases and deployment remain deferred.

Workspace note: the app moved to `frontend/`; future API/config/jobs/media code belongs under `backend/src/`, migrations under `backend/migrations/`, and shared contracts under `contracts/src/`. References to `server/` in this proposal mean `backend/` in the actual workspace. No backend implementation has begun. See [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md).

Status: **FOR APPROVAL — backend implementation has not started.** Prepared 2026-10-27 by inspecting the current source and `docs/MUNK-CURRENT-STATE.md`. This proposal supersedes the older recommendation to begin with article publication. Preserve the existing MUNK interface, mosaic, wordmark, themes, routes and interactions; connect the journey rather than redesign it.

## 1. What the source actually does now

| Journey | Current entry point | Actual behavior / dead end |
| --- | --- | --- |
| Account | Participation buttons, Create a House/Creator workspace in `App.tsx`; permission page on direct creator URLs | `WalletGate` in `Dialogs.tsx` has disabled Create/Connect buttons. `continuePreview()` in `state.tsx` sets an in-memory boolean, not a verified identity. No standalone working signup/login/session service. |
| House | Network Create a House → `#/create/house`; workspace → Resume House setup | Wizard and local save work. `creator-state.tsx` stores one browser-local draft under `munk-creator-preview-v1`. No account ownership, durable server ID or global address reservation. |
| Introduction/admission | Wizard introduction/design/preview/admission steps | File/object URL in memory, metadata/duration/self-declaration in localStorage. Identity and introduction states are hardcoded unreviewed; `submitAdmission` always returns unavailable. Choosing a file cannot admit a House. |
| Upload/publish | `#/creator/overview` or library → Create → Video → `#/creator/videos/new`, then saved draft URL | Local selection/playback/metadata/queue work. All remote methods in `creator-services.ts` return unavailable. Reload loses File bytes. Publish cannot create a public record. The synchronous draft repository cannot perform a real async server load/save. |
| Another viewer | Fixture House/video links or a private `#/creator/videos/:id/preview` URL | Private routes read the current browser's drafts behind its gate. `parseRoute` in `model.ts` accepts public House/work IDs only if present in fixture arrays; `App.tsx`, `House.tsx`, `Video.tsx` dereference fixtures directly. Every fixture film plays `/media/munk-sample.webm`. A second session cannot read A's work. |
| Follow/comment | House Follow button and existing `Thread` | Local arrays/localStorage. Comments attribute writes to fixed Viewer 7F2A, not a real account. No other user sees them. |

There is no API, database, upload receiver, worker, real authentication or public media lookup to connect today. This is source inspection, not a new browser-observed claim. No application code is changed by this planning task.

## 2. Decision proposed for this slice

Use **an existing injected EVM wallet + Sign-In with Ethereum (SIWE)**, then a centralized TypeScript API, PostgreSQL, private local media files and an FFmpeg worker. Support externally owned accounts (EOAs) for this first slice. No blockchain transactions, funds, balances, gas, custom L1, trading, contract deployment, WalletConnect relay or application RPC service is needed. Contract-account/EIP-1271 wallets and QR/mobile relay connectors are explicitly deferred rather than failing silently.

First valid sign-in creates the MUNK account. A new user without a wallet chooses Create a wallet, follows an explicit external-wallet setup guide, returns to MUNK, connects and signs. This is an honest handoff to the wallet's creation/recovery UI, not an embedded wallet falsely shown as available inside MUNK. The existing modal keeps its appearance. Add one obvious Account/Connect entry so onboarding does not require attempting a write first. After authentication, resume the original requested action; logout/session-expiry/account-switch states are explicit.

SIWE is off-chain session authentication. The server generates and checks a single-use challenge and verifies its signature and message fields; connection alone is insufficient. See [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361) and the [official backend guide](https://docs.login.xyz/sign-in-with-ethereum/quickstart-guide/implement-the-backend).

### Wallet comparison

| Concern | Recommended: existing injected wallet | Alternative: sandbox embedded user wallet (Privy) |
| --- | --- | --- |
| Onboarding | Existing user selects wallet, approves connection, signs a readable MUNK login challenge. New user first creates a wallet in its own extension/app. More friction, fewer service dependencies. | Create wallet inside MUNK using provider passkey signup, then create a user-owned embedded wallet. No MUNK email/password account required. Real provider authentication and wallet creation must complete; do not use test-login bypasses as acceptance. |
| Key custody | Wallet software/hardware holds keys. MUNK receives public address and signatures, never a recovery phrase/private key. | Choose a user-owned configuration without MUNK backend signing/delegation authority. Provider infrastructure protects key material; exact custody depends on configuration and must be reviewed, not assumed from the word embedded. |
| Recovery | Wallet's backup/recovery flow restores the same address. MUNK cannot restore a lost wallet from a public name or intro video. Account key-linking/rotation is outside this slice. | Recovery depends on the configured credentials, passkey sync/backups, provider availability and supported recovery/export mechanisms. Demonstrate new-device recovery and provider-mediated export with a disposable wallet before choosing this path. Losing every credential without a usable recovery/export path can still lock the user out. |
| Application dependencies | EIP-1193/EIP-6963 connection/discovery, SIWE parser/signature verification and our sessions. Browser wallet installation is required. | Provider developer account/app ID, dashboard config/allowed origin, frontend SDK and backend token verification, internet access to provider services; store provider account/wallet IDs and public addresses only. Separate development app and disposable wallets; no funds. |
| External runtime service | None controlled by MUNK for EOA signature verification. Wallet products can have their own dependencies; the app itself does not need a chain RPC or hosted wallet relay. | Privy authentication/signing services are required even with a local API. A sandbox is not a fully offline wallet system. |
| Cost | No wallet-provider subscription or signing gas for this proposed connection/sign-in path. Local CPU/disk/network still have costs. | Published Privy pricing currently lists a free tier up to 500 MAU/50,000 monthly signatures, then $299/month Core and $499/month Scale tiers; higher usage can incur additional charges. These are provider terms checked 2026-10-27, not a purchase or permanent guarantee. |

Provider references: [passkey signup/login](https://docs.privy.io/authentication/user-authentication/login-methods/passkey), [user-owned wallet creation](https://docs.privy.io/wallets/wallets/create/create-a-wallet), [custody options](https://docs.privy.io/wallets/overview/flexible-custody), [wallet export](https://docs.privy.io/wallets/wallets/export), [current pricing](https://www.privy.io/pricing).

**Never store private keys, seed phrases, key shares or exported wallet backups in the application database, localStorage, application logs or MUNK forms.** Server session tokens are separate secrets, stored only as hashes in PostgreSQL. Test signing keys live outside the application in a test signer or real wallet. Embedded wallet creation is an alternative decision, not a second implementation track in this milestone. If in-MUNK wallet creation is mandatory now, approve that alternative and its provider dependency instead of building both.

## 3. One account, separate House responsibilities and permissions

An account is a person’s authenticated application identity, not a viewer/creator account type. The same account watches, follows, comments, creates and operates Houses as authorized.

- `accounts`: ID, public display name, status, timestamps.
- `wallet_credentials`: account ID, normalized public address/namespace, verified-at; unique credential. First slice exposes one EOA credential per account. Never use an address as the primary key of a House or public-profile permission.
- `auth_challenges`, `sessions`: challenge binding/expiry/consumption; hashed session token, account, expiry/revocation, CSRF token binding.
- `houses`: ID, unique normalized address, descriptive fields, immutable founder account ID, accountable operator account ID, config/version, current admission revision/status. Founder attribution, operation and authorization are distinct. No fractional/economic ownership ledger.
- `house_memberships`: account/House/role; `owner` can edit/submit/manage that House, `publisher` may manage its works after admission. Every request checks current membership; future role sharing does not follow automatically from wallet connection. Ownership transfer/invitation UI is deferred. Creation transaction assigns founder/operator/owner to A explicitly.
- `admission_submissions`, `review_decisions`: submission snapshot/revision, introduction asset, separate review outcomes, reviewer ID/time/checklist/reason. Reviews are append-only evidence, not writable status flags supplied by creators.
- `works`, `assets`, `upload_sessions`, `processing_jobs`: House relationship, draft/publication state, asset generation/paths/checksum/probe results/job lease/error/progress.
- `follows` with unique account/House pair; `comments` with work/account/parent IDs and timestamps. Parent must reference the same work. Author comes from session, never request body.

A separate reviewer capability is assigned by an operator bootstrap command to a real authenticated reviewer account R. Neither A nor B gets it by logging in. Reviewer cannot approve their own House. Public responses exclude credential addresses, sessions, private asset paths, review notes and recovery information; a wallet address being publicly visible on a chain is not permission to expose it in a profile.

## 4. Exact user journey and enforceable admission

1. **A authenticates.** Account/Connect → choose existing wallet → server challenge → real signature → server verification → persisted session/account. Cancelled signing, absent wallet or wrong signature remains unauthenticated.
2. **A creates/saves a House.** Existing Create a House wizard posts to API, receives a server House ID and atomically reserved address, and PATCHes a server draft. Reload restores it from PostgreSQL. Current personal Home design remains separate.
3. **A uploads a real introduction.** Stream bytes to the private upload endpoint, inspect/process them, show actual status, collect existing face-visible self-declaration/public-information consent. Server checks decoded duration 120–240 seconds and playable video; those checks do not verify identity or face visibility.
4. **A submits a revision for admission.** Missing requirements return field errors. The application enters pending review, not approved. R reviews the actual introduction and performs a manual creator-control/face-consistency check, e.g. an in-person or live call in which the person matches the introduction and proves control of the submitting account with a fresh signed challenge. Store method/outcome/time/reason, not identity documents or a call recording. R separately approves introduction suitability and the manual creator-control check.
5. **House becomes admitted only after both decisions pass.** A sees the actual result/reason and can correct/resubmit if requested. This is manual review, not automated identity verification, government-ID verification or KYC. Public wording: “Manual creator review completed.” Civil/legal identity verification is outside the proposed policy and would require a separate decision/provider.
6. **A uploads a real work video.** Existing Create → Video receives server work/upload IDs. Upload/processing states follow actual bytes and worker results. Add metadata, thumbnail/captions if provided, private preview of processed output; Publish becomes effective only after API confirms admission, ownership and ready assets.
7. **Guest opens `#/videos/:serverWorkId`.** Publish returns a working public URL and an Open published video action. A separate browser profile with no authentication/localStorage reads the public work/House, requests its processed media and watches/seeks. Public House/Discovery/Exchange navigation reaches the same record. Real Houses have no invented sample coin price; the existing tile shows financial data unavailable when no fixture market exists.
8. **B authenticates in another isolated profile.** Same account flow as A. B follows A's House and comments on the video; A/guest see actual records after refresh/refetch. B can create their own House using the same account but cannot edit/publish to A's House without membership.
9. **Restart API, worker and database process without deleting data.** A/B accounts, drafts, admission decisions, published media, follow and comment remain. Cookies continue only if unexpired/unrevoked; re-authentication recovers the same account when needed.

Workflow transitions, all server-enforced:

- House: `draft → pending_review → admitted | changes_requested | rejected`; `changes_requested → draft → pending_review`. A creator cannot write admitted directly.
- Independent manual identity/control and introduction-review outcomes: `pending → approved | changes_requested | rejected`, pinned to submission revision and asset checksum. Admission requires both approved and the referenced introduction asset ready.
- Reviewed fields/introduction/operator changes require a new revision and review. Previous decisions cannot approve a replacement asset. Until re-admission, public delivery/new publication is blocked by current-House checks. Routine work metadata edits do not trigger identity review.
- Upload: `created → receiving → received → queued → processing → ready | failed`; cancellation/expiry handled explicitly. `received` requires completed durable server write, not browser progress reaching 100%.
- Work: `draft → published → unpublished`; publish requires membership, current admission, required metadata and a ready video asset in the same House. Failed/pending uploads cannot publish. Public media requests recheck published/admitted state, including after unpublish or a suspended review.

Admin/reviewer routes are authorization-protected even if someone guesses them. A minimal review page in the existing shell is the only new workflow surface; it is required to avoid a hidden admission dead end.

## 5. Backend, database, storage and processing

Proposed implementation: **Node 22 + TypeScript + Fastify 5**, PostgreSQL 18 through `pg` and explicit SQL migrations, shared JSON/TypeScript contracts, and a separate FFmpeg/ffprobe worker. Use the same repo (`server/`, `shared/`, migrations, local runtime data outside source). Fastify supports the API layer; PostgreSQL row locks support durable job claiming. [Fastify docs](https://fastify.dev/docs/latest/), [PostgreSQL locks](https://www.postgresql.org/docs/current/explicit-locking.html).

- Stream input bytes to private `.data/media/incoming/<opaque-id>.part`, enforce limits (existing 2 GB work/512 MB intro), content ownership and expected length; do not buffer whole files or trust names/MIME headers. Checksum and atomically finalize originals before queueing processing.
- Store originals and output in a durable local filesystem root outside `public/`. Use a `MediaStore` interface (`write/read/stat/commit/delete`) so object storage can replace the filesystem later. No S3, MinIO, CDN, managed media service or subscription is required for this slice.
- Worker claims PostgreSQL jobs using a lease/heartbeat and row locking; durable attempts/retry errors survive restart. Do not add Redis/Kubernetes. A crash leaves a reclaimable job; stale generations cannot mark a replaced asset ready.
- ffprobe inspects actual streams/duration. FFmpeg really decodes/transcodes to one browser-compatible H.264/AAC progressive MP4, maximum 720p, plus poster image. Native video remains the player; adaptive/HLS renditions are deferred to keep the slice narrow. ffmpeg must exit successfully, output must pass probe, and final files must exist before database `ready` is committed. Use restricted subprocess arguments, paths, duration/resource limits and local-file protocols. [FFmpeg format documentation](https://ffmpeg.org/ffmpeg-formats.html).
- Processing progress derives from FFmpeg output timestamps versus probed duration; unavailable progress is indeterminate. Transferred byte counts derive from actual transport/server state. Never advance through fabricated timers.
- Upload is a streamed single-request transfer initially. Cancel aborts and clears partial data; retry restarts from byte zero. True chunked resumability is deferred and its current resume control must say so. A completed upload/job persists and can be monitored after reconnect; that is not resuming a partial transfer.
- Serve processed files through API authorization/publication lookup with proper content type, length and HTTP Range/206 support. Guest access is free only for published/admitted content; source files, intro review previews and draft playback remain private. Do not place unpublished files on an unrestricted static route.
- Database/file output are authoritative. Commit publish transaction with current revision/permission/asset checks and idempotency; store stable paths. Disk-full/invalid media/worker crash returns real failed status. Session signing/config secrets remain stable across restarts.

## 6. API contracts and existing frontend connections

All `/api` routes go through the same origin via Vite's development proxy to API port 3001. Use strict input schemas; opaque server IDs; resource versions for edits; idempotency keys for create/publish/comment/upload-finalize operations. Errors have `{code,message,fieldErrors?,retryable,requestId}` with HTTP 401/403/404/409/413/422/5xx as appropriate. Do not trust author, role, admission or publication flags in a request.

| Contract | Purpose/result |
| --- | --- |
| `POST /api/auth/challenges` `{address,chainId}` | Returns challenge ID, canonical domain/URI-bound SIWE message and five-minute expiry; bind to browser pre-session |
| `POST /api/auth/sessions` `{challengeId,message,signature}` | Atomically consumes nonce, verifies exact message/domain/URI/address/chain/expiry/signature, creates/finds account, sets HttpOnly session cookie |
| `GET /api/me`, `DELETE /api/auth/session` | Account/House memberships and actual session state; logout revokes server session |
| `POST /api/houses`, `GET /api/me/houses`, `GET/PATCH /api/houses/:id/draft` | Create/reserve address, select owned/operated House, restore/save draft with version checks |
| `GET /api/house-addresses/:address/availability` | Availability hint; unique DB constraint remains authoritative |
| `POST /api/houses/:id/uploads` `{purpose,filename,size,contentType}` | Allocates owner-bound upload with purpose intro/video/thumbnail/captions, upload URL and limits |
| `PUT /api/uploads/:id/content`, `GET /api/uploads/:id`, `DELETE /api/uploads/:id` | Stream bytes; inspect actual persisted status/errors; cancel authorized upload |
| `POST /api/houses/:id/admissions` `{introAssetId,revision,publicConsent,faceDeclaration}` | Validate complete ready introduction/draft and freeze submitted snapshot; return pending statuses |
| `GET /api/houses/:id/admission` | Current separate decisions, missing requirements/reasons; creator-scoped private detail |
| `GET /api/review/submissions`, `POST /api/review/submissions/:id/decisions` | Reviewer-only reads and separate outcome/checklist/reason; audited and revision-bound |
| `POST /api/houses/:id/videos`, `GET/PATCH /api/works/:id/draft` | Persistent work metadata, ready asset references, title/description/series/captions/thumbnail and version |
| `GET /api/assets/:id/preview` | Authorized private processed playback/poster; same streaming protections |
| `POST /api/works/:id/publish`, `POST /api/works/:id/unpublish` | Enforced transition; publish returns `{id,status:'published',publicUrl}` only on committed success |
| `GET /api/catalog`, `GET /api/houses/:address`, `GET /api/videos/:id` | Public server records; draft/unadmitted/nonexistent records not leaked; explicit published media URLs |
| `GET /api/videos/:id/media`, `/poster`, `/captions` | Publication-aware delivery, media Range support; never hardcoded sample substitution |
| `PUT/DELETE /api/houses/:id/follow`, `GET /api/me/follows` | Authenticated idempotent real follow, durable counts/state |
| `GET/POST /api/videos/:id/comments` `{text,parentId?}` | Paginated reads, authenticated author, same-work parent, real returned ID/timestamp; retry idempotency |

Sessions: random opaque token, hash in PostgreSQL, HttpOnly/SameSite cookie, expiry/revocation; Secure in HTTPS and explicit localhost-only HTTP exception. Verify Origin/CSRF on writes; rate-limit challenges/uploads/comments; never use localStorage as proof of login. EOA verification can be local cryptography with no chain RPC. Wallet/account switch clears private frontend queries and requires a fresh session; guest mode cannot reuse cached creator data.

Connect the current components, not replacements:

- `state.tsx`, `Dialogs.tsx`, `App.tsx`: session bootstrap/loading/error, wallet modal, persistent Account entry, return-to-intended-action, logout. Local preview gate remains only in explicitly selected demo mode and cannot authorize server endpoints.
- `creator-services.ts`: implement fetch/stream adapters and replace per-browser/file-only signatures with House/work/asset IDs, upload/status responses and server error contracts. `creator-state.tsx` gets an **async** repository; remove its global one-House-per-browser ownership assumption. `Creator.tsx` receives current account/active House and actual pending/decision/job status; no client-generated “published” state.
- `model.ts`/`App.tsx`: parse valid remote entity URLs without requiring existence in fixture arrays. Route loaders resolve data and distinguish loading, 404 and network error; remove synchronous fixture non-null assertions for server records.
- `House.tsx`, `Video.tsx`, Discovery/Exchange/cards: consume normalized server House/Work data. Preserve layout and protected introduction. Video source/poster/captions come from the API, never default to sample media for a remote record. Server catalog entries with no market record show no monetary fiction.
- `components.tsx` Thread and House follow action: persist/fetch actual comment/follow records with authenticated author, failure feedback and rollback or acknowledgement. Refresh/refetch provides cross-user visibility; websockets, live services and messaging delivery are outside this slice.
- Keep fixtures in an explicit demo mode with current routes. Do not silently fall back to a fixture when a real API request fails. Keep existing Home/House design configs/renderers; persist House draft config server-side, retain old personal Home storage untouched. Offer deliberate import of local text/design drafts after sign-in, never auto-import identity/review/publication flags; re-upload source media.

## 7. Local setup, no paid infrastructure

Use the Mac's local PostgreSQL service, filesystem and FFmpeg; no hosted account is required for the recommended wallet approach. Installation/package downloads and a browser wallet are prerequisites. Native local PostgreSQL avoids a paid container-desktop dependency. Current restricted agent environment cannot bind localhost; final browser acceptance must run in ordinary Terminal on a machine that can serve the app.

Planned prerequisites (not executed by this task): Node 22/npm, Homebrew, `brew install postgresql@18 ffmpeg`, `brew services start postgresql@18`, then `$(brew --prefix postgresql@18)/bin/createdb munk_dev`. Use an explicit local DB user as required by the installation. Persist media under `.data/media`, database under the PostgreSQL data directory; ignore `.data`/secrets in Git. Keep separate test DB/media root.

The implementation will provide `.env.example`, migrations and these scripts; **they do not exist yet and cannot be run as current setup commands**:

```sh
npm ci
cp .env.example .env.local
# Configure DATABASE_URL, APP_ORIGIN=http://localhost:5173,
# API_PORT=3001, MEDIA_ROOT=.data/media and persistent session settings.
npm run db:migrate
npm run reviewer:grant -- <reviewer-public-wallet-address>
npm run dev:all              # Vite + API + FFmpeg worker
npm run test:integration
npm run test:journey
```

Open `http://localhost:5173` consistently, not a mix of localhost/127.0.0.1. Use separate Chrome profiles A/B/guest and reviewer R, with disposable empty wallets; do not send funds. Reviewer grant is a local operator action, not an unauthenticated API. `dev:all` will preserve data on stop/start. A separate explicit reset command may delete test data; ordinary restart must not.

If the embedded alternative is selected, add a real Privy development app ID/origin/passkey config, provider SDK and backend token verification. That path needs internet/provider services and validation of free-tier limits, recovery and export; it is not part of the recommended provider-independent runtime.

## 8. Delivery sequence and acceptance

Build only these connected steps, in order, as one milestone: (1) shared contracts/database/session auth; (2) account/House permissions and durable drafts; (3) introduction upload/worker/manual review; (4) video processing/publish/public routes; (5) follows/comments; (6) restart/error/browser acceptance. No more mosaic changes, article publishing, messaging/broadcast, financial records, wallet transfers or L1 work in scope.

Required evidence before calling the slice complete:

1. **Real sign-in:** approve/reject a challenge in a real installed wallet. Server rejects wrong signature, reused/expired nonce, altered domain/address/chain/URI and unbound challenge. First valid login creates exactly one account; repeat login restores it. No wallet prompt requests a transaction or funds.
2. **Identity versus permissions:** A and B both watch and can operate their own Houses. B cannot mutate A's draft, upload/preview its private assets, review it or publish it. Client-forged roles/statuses are rejected. Only R can review; self-review is rejected.
3. **Durable House:** create/save/reload in A; restore from server after API/database restart and in a clean A-authenticated profile. Duplicate addresses conflict atomically. Missing fields/introduction/consent and wrong decoded duration prevent submission.
4. **Real human admission:** R actually watches the consented face-visible introduction and performs the stated manual check, records independent decisions, and admits/rejects/requests changes. No seed script, timer, file-selection handler or automation asserts that a real person was identity-verified. Automated transition tests use test records, not claims of real-world verification. Resubmission invalidates stale decisions.
5. **Real media:** upload an original test video distinct from the bundled eight-second sample; inspect received size/checksum and actual processed output. Invalid/truncated video, oversized input, cancellation, disk failure and FFmpeg failure surface honest states and block publishing. Restart worker mid-job and demonstrate recovery without premature ready.
6. **Cross-session playback:** A publishes, receives the public URL, and guest profile with empty storage opens it without auth, watches and seeks the processed video. Assert media source is the uploaded asset, not sample URL; time and decoded frames advance. Draft source/preview endpoints remain inaccessible. Unpublish or loss of admission blocks new public media requests.
7. **Real B participation:** B signs in, follows once (duplicate retry is idempotent) and posts a comment. A and guest see it after refetch. Author is B's account; cross-work parent and spoofed author IDs are rejected. No localStorage mutation or mocked network response constitutes this test.
8. **Restart:** stop/start Vite, API, worker and PostgreSQL without deleting files; accounts, House/config/draft/reviews, processed asset/publication, follow and comment persist. Unexpired sessions remain valid, expired/revoked sessions do not. A fresh guest still watches.
9. **Preserved frontend:** desktop/tablet/mobile render existing interface, reachable controls/dialog actions, protected introduction, stable mosaic, personal/House design separation and guest reading/viewing. Exercise wallet loading/cancel/failure, processing retry and API outage without false success or fixture fallback. Mobile-wallet in-app-browser coverage is separate from deferred WalletConnect/QR support.

Automated protocol/E2E tests may use disposable test signer keys kept in the test process to produce **real signatures verified by the real API**; they must not stub authentication/upload/processing/publication success. Full acceptance additionally requires the real-wallet UI and actual human-review run above. Existing model/server-render assertions and screenshot counts alone are insufficient. Record exact commands, raw results, server/worker job evidence, browser contexts/routes and fresh captures; report any blocked checks as blocked.

## Approval requested

Approve this one video-publication slice using injected EOA wallet sign-in, PostgreSQL/private local filesystem/FFmpeg, and the explicitly manual creator-control/introduction review policy with a designated reviewer. If creating a wallet inside MUNK itself is required for this first slice, choose the sandbox embedded-wallet alternative instead and approve its external provider dependency. No backend implementation, installs, provider signup, provisioning or deployment begins until approval.
