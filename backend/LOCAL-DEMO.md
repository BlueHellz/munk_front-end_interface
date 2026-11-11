# Local demonstration mode

The current local MVP is explicitly configured with `MUNK_PRODUCT_MODE=demo` in the ignored backend environment file. The default in code is `strict`. Demo mode refuses startup with `NODE_ENV=production`, a non-loopback API listener, or a non-local frontend origin. Never deploy this mode. Demo readiness is not strict admission; it permits explicit local demo video publication only.

`GET /api/config` exposes only mode and `publicPublishing:true` when the video service is installed. The frontend follows this server response; it has no admission-bypass flag. Real Privy verification, sessions, CSRF/origin checks, active-account/House permissions and private upload validation/processing remain unchanged.

## Use the demo

1. Sign in with the real account. Open **Create a House**.
2. Choose **Create House** with no entered fields. The backend generates a unique address, House name and creator name, grants the authenticated account owner membership, and opens that selected workspace with **Upload video**.
3. To retain the existing draft's details, choose **Continue current draft as demo House** instead. Its original browser draft stays saved; a source snapshot and frozen retry request are preserved. Invalid/omitted proposed addresses get generated addresses. A saved owner House matching the draft address is continued in place.
4. Choose **Upload video**, select a supported file, and upload starts automatically. An omitted title is derived from the filename; no entered description is needed. Video metadata and asset references save to the server once an upload is linked; uploads/media/jobs also persist.
5. Introduction, description and customization are **Complete later** items. Owner-only **Edit House details → Optional details** can update names, description and the demo address. Empty names use sensible defaults. Address syntax/uniqueness errors stay beside the address input.

The screen has a small **Demo mode** indicator. **House ready for demo use** permits workspace/uploads and explicit local video publication. It does not automatically publish anything or imply identity verification, network admission or financial eligibility. See [video publishing](VIDEO-PUBLISHING.md) for Publish, guest links, House listings and seeking. The demo does not run manual review or require a reviewer account; review routes reject requests in demo mode. Existing strict review code/evidence is retained for explicit strict mode.

## Endpoints and storage

`POST /api/demo/houses` accepts an empty JSON object. It still requires a real active session, exact Origin, CSRF and a UUID Idempotency-Key. Optional metadata can populate defaults; `existingHouseId` plus its current `version` continues an owner House in place. Replaying the same account/key/body returns the same House, including after a lost response; changing the body with the same key conflicts. Browser retry intents are persisted before sending. **Create another demo House** is an explicit new request, not an automatic retry.

Migration `0004_demo_houses.sql` adds `houses.demo_ready=false` to existing records. Demo creation sets it true; strict `admission_status` stays separate and is never automatically changed to admitted. Strict admission prerequisites and immutable review evidence are retained. Demo-only owner address editing uses the mode-specific PATCH schema; strict HTTP requests still reject address changes. Founder/ownership guards remain enforced.

Original draft keys (`munk-creator-account-v2`, `munk-house-edit-v1`) are retained. Continuation snapshots use account/scope-specific `munk-demo-source-v1` keys, and idempotent requests use `munk-demo-create-v1`. If a creation result is uncertain, retry the same action; do not choose **Create another**. Completed intents reopen the created House. No browser/private media or user records are included in test artifacts.

## Verification

Evidence: `artifacts/demo-mode/`. Native tests invoke the production frontend adapter against actual HTTP/session/CSRF handlers, native PostgreSQL and real generated FFmpeg media. They cover blank/default creation, concurrent retry, browser-draft metadata continuation, existing saved-House continuation, demo address editing, upload without admission, strict/demo separation and production/local guards. Provider user lookup is synthetic; no real Privy signup or personal House creation is claimed.

`frontend/scripts/demo-browser-check.mjs` checks the real guest Demo indicator/auth gate, then clearly labeled authenticated UI/API fixtures for draft preservation, reload/lost-response retries, optional inline errors, filename title generation and mobile layout. It does not grant a real backend session. Existing strict-mode browser fixtures explicitly request strict configuration; they do not enable production authentication shortcuts.

The local migration has been applied. The running local API reports Demo mode and readiness. PostgreSQL/user media was not reset; no reviewer, paid service, deployment, trading or blockchain infrastructure was created.
