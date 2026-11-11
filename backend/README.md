# MUNK backend

Current interface customization: [shared rendering, server storage, permissions and walkthrough](INTERFACE-CUSTOMIZATION.md). Personal and House designs now save to PostgreSQL with independent revision history. The real published catalog feeds Home and actual House presentations. Older browser design records remain untouched.

Current local MVP uses explicit local-only **Demo mode**: see [LOCAL-DEMO.md](LOCAL-DEMO.md). Strict admission/reviewer flows below remain separate; demo readiness never grants identity verification or strict admission. Explicit local video publication is now supported: see [VIDEO-PUBLISHING.md](VIDEO-PUBLISHING.md).

Privy development authentication is integrated with the existing UI: passkey signup and user-owned wallet creation, existing-wallet sign-in, backend signature verification and linked-wallet lookup, persistent PostgreSQL sessions, CSRF protection and logout revocation. The local preview account cannot authenticate or authorize a request. Development stays at **http://localhost:5173**; no production switch, paid service, deployment or blockchain transaction.

Start with [PRIVY-DEVELOPMENT.md](PRIVY-DEVELOPMENT.md): it contains the exact local-secret setup, startup commands, first real account/House walkthrough and authentication configuration. Current publication instructions are in [VIDEO-PUBLISHING.md](VIDEO-PUBLISHING.md). [POSTGRESQL-SETUP.md](POSTGRESQL-SETUP.md) covers persistent PostgreSQL 18 and FFmpeg installation. The API requires a read-only development PRIVY_APP_SECRET in ignored backend/.env for provider user lookup; never send it in chat or place it in frontend configuration. The public development app ID is already configured.

## Implemented

- Strict configuration; sanitized errors/logging; health/readiness; bounded JSON and exact-origin mutation checks.
- Privy SDK verification of issuer/application/signature/expiry, followed by authenticated user lookup. Browser-supplied account IDs, wallet addresses and roles grant no permission. No developer/server signers or MUNK wallet authority.
- One-time, browser-bound login challenges; random HttpOnly session cookies; session hashes persisted in PostgreSQL; session-bound CSRF checks; expiry, account suspension and logout revocation. Logout also blocks reuse of that provider login to recreate a MUNK session; fresh provider sign-in is needed.
- House creation/address reservation with idempotency, owner/publisher authorization, optimistic version checks, immutable founder/address and review revision invalidation. My Houses lists actual memberships and preserves explicit House selection.
- Actual private streamed video/introduction uploads with size limits/checksums/receive leases; durable FFmpeg jobs with claims, heartbeat, generation/token fencing and expired-lease recovery; processed H.264/AAC MP4 and poster output.
- Manual creator review submission and two independent decisions, append-only evidence, reviewer capability and self-review rejection. Reviewer controls live in Creator Settings. No legal-identity/KYC claim.
- Signed-in House saves, admission submission, server queue/status/retry and private processed playback in the existing frontend. Completed uploads/jobs survive reloads. Video metadata and publication persist on the server; unuploaded selections, article metadata and House designs remain account-local drafts.

## Local commands

Install dependencies once at the root using Node 22/npm 10, then configure ignored backend/.env. In separate terminals from the repository root:

```sh
npm run db:migrate
npm run dev:backend
npm run worker --workspace backend
npm run dev -- --port 5173 --strictPort
```

Run the API/worker/frontend lines in separate terminals. Startup never runs migrations implicitly. GET /api/health reports liveness; GET /api/ready returns 200 only when PostgreSQL is reachable and all migration history matches. This does not establish provider/worker readiness. Private bytes live under ignored backend/.data/media, never frontend/public or unrestricted static routes.

## Ownership and limits

Server implementation is under backend/src: api/, auth/, config/, db/, domain/, media/ and jobs/. SQL stays in migrations/, tests in tests/, and portable definitions in ../contracts/src/. Add migrations rather than editing applied files. One root repository and one workspace lockfile remain.

Video metadata/publish/unpublish, actual public House/video pages and processed media Range delivery are implemented. See [VIDEO-PUBLISHING.md](VIDEO-PUBLISHING.md) for endpoint permissions and current verification. Global catalog discovery remains separate. Existing public fixture films use the bundled sample and never stand in for an uploaded public work. Optional thumbnail/caption ingestion, cleanup/retention tooling and public follows/comments also remain pending.

Uploads currently accept introduction/video only. Partial transfers restart from zero; allocated bytes, including retained failed/cancelled allocations, count against a 10 GiB per-House limit. Crashes/ambiguous database failures can leave inaccessible private orphan files rather than risk deleting a committed source. Media tools have argument/time/output/thread limits but no OS container isolation. Independent MUNK sessions last up to seven days; provider-side revocation is not continuously synchronized, while MUNK logout/expiry/suspension are enforced.

## Validation

```sh
npm run check
npm run test:native --workspace backend
node frontend/scripts/auth-browser-check.mjs
```

Native PostgreSQL 18.4 validation passed **8 tests with no skips**, plus a real database process stop/start persistence probe. It includes actual ES256 signatures checked by the Privy SDK, HTTP session/CSRF/logout/House isolation checks, SQL constraints/rollback, concurrent migration startup, actual FFmpeg output and admission revision/lease recovery tests. Default backend tests pass 8 cases and explicitly skip 3 native cases unless TEST_DATABASE_URL is supplied. Test provider-user lookup uses fixtures; production has no test key or login bypass.

Frontend build and retained model/render checks pass. The account/House cleanup has real-app guest browser checks and isolated fixture-harness checks for signed-in navigation, House selection, confirmations, and errors. These are not a real Privy signup or authenticated provider-backed House-save claim. See [ACCOUNT-JOURNEY.md](ACCOUNT-JOURNEY.md) for the walkthrough and precise verification scope. After compatible dependency updates, the audit still reports 34 advisories (19 high, 15 moderate) in SDK transitives/retained tooling; see artifacts/privy-audit.json and PRIVY-DEVELOPMENT.md. No forced breaking downgrade/major upgrade was applied.
