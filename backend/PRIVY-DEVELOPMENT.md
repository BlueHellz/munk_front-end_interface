# Privy development integration and first-account walkthrough

Use **MUNK Development**, app ID `cmvrdnznc00we0glcf33db0xh`, and **http://localhost:5173**. Keep the free development plan. Allowed-domain restrictions/app clients are unnecessary for this local React integration. No production switch, wallet funding, chain transaction, server/delegated signer or MUNK wallet authority is involved.

## Enter the required secret locally

The backend verifies access-token signatures using Privy's SDK/JWKS, then uses a **read-only** app secret to fetch the verified subject's current linked wallets. This avoids trusting a browser-supplied address or depending on an identity-token dashboard toggle. The token must have the expected issuer/application, valid signature/expiry and provider session ID. Wallets must be Ethereum-compatible; explicitly delegated or non-user-signable wallets are rejected.

In the Privy dashboard for MUNK Development, find **App settings / Basics → App secrets** (label placement can vary). Create a **read-only** development secret. Do not create authorization keys, signers, quorums or organization-controlled wallets. No paid plan is needed. Enter the secret yourself in ignored `/Users/azayel/monk/backend/.env`:

```dotenv
PRIVY_APP_ID=cmvrdnznc00we0glcf33db0xh
PRIVY_APP_SECRET=YOUR_READ_ONLY_DEVELOPMENT_SECRET
APP_ORIGIN=http://localhost:5173
```

Never paste the secret into chat, commit it, put it in frontend/.env.local, or prefix it with VITE_. The frontend uses the public app ID only. Missing configuration or provider lookup failure produces an explicit unavailable/error response; there is no local preview authentication fallback.

Privy references: [app setup and secret access levels](https://docs.privy.io/basics/get-started/dashboard/create-new-app), [access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens), [user-owned client wallet creation](https://docs.privy.io/wallets/wallets/create/create-a-wallet).

## Exact startup

On Intel macOS 12, use the verified downloaded binaries and persistent database launcher in [POSTGRESQL-SETUP.md](POSTGRESQL-SETUP.md), not a Homebrew source build. Keep its database terminal open, copy the generated connection settings locally into backend/.env, and configure the worker media-tool paths separately. Do not use the disposable native test cluster as the application's persistent database.

From the repository root, install once and copy templates **only if the local files do not already exist**:

```sh
cd /Users/azayel/monk
npm ci
test -f backend/.env || cp backend/.env.example backend/.env
test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
```

Edit backend/.env locally to set DATABASE_URL and PRIVY_APP_SECRET, then:

```sh
cd /Users/azayel/monk
npm run db:migrate
npm run dev:backend
```

In a second terminal:

```sh
cd /Users/azayel/monk
npm run worker --workspace backend
```

In a third terminal:

```sh
cd /Users/azayel/monk
npm run dev -- --port 5173 --strictPort
```

Open **http://localhost:5173/#/home**. If 5173 is already occupied, stop the prior frontend in the terminal that started it and rerun the command; do not silently change the development port/origin. `/api` is proxied to 127.0.0.1:3001. Backend `/api/ready` must report ready after all three migrations.

## Create the first real account and House

1. Choose **Sign in → Create account** in the existing network navigation. Complete the real browser/OS passkey signup prompt. Privy creates a wallet owned by that user through the client SDK, without additional signers. MUNK then verifies the access token, fetches its linked wallet and creates an account/session. Device cancellation leaves you signed out. If Privy signup succeeds but setup fails, choose **Retry setup** to finish the same account without another signup.
2. An existing wallet user instead chooses **Sign in → More ways to sign in → Connect existing wallet** and completes Privy's actual connection/sign-in signature flow. Connecting alone never grants a MUNK session. Returning passkey users choose **Sign in**; linked-email login is under **More ways to sign in → Use linked email**. Email signup is disabled on that alternative. No transaction or funds prompt is part of login.
3. After sign-in, open **Account → Account settings → Sign-in & recovery → Link backup email**. Verify and link the email to this same account. The linked-email alternative refuses new email signup; link the email to this account first. Keep a synced/backed-up passkey. **Wallet · advanced → Export wallet** uses the provider's user export UI directly; keys never pass through MUNK's backend. Test recovery before relying on the wallet.
4. Choose **Create a House**. Fill its name, lowercase address, description, focus and public creator name; press **Save House draft**. Success means the details and address reservation were confirmed by PostgreSQL, not just browser storage. The address/founder become immutable. Reloading the page restores the same authenticated account and its saved House.
5. Select a face-visible **2–4 minute** introduction, confirm the self-declaration/public-information consent, then **Submit for Manual creator review**. This streams actual bytes, waits for real worker output, then submits the revision. The queue shows real states/errors; a stopped worker leaves processing pending. Upload is not approval. This is neither verified legal identity nor KYC.
6. In **Creator → Uploads**, monitor received/queued/processing/ready/failed states. Ready assets offer private processed playback. **Create → Video** uploads a work video after a server House exists. Completed bytes/jobs persist across reloads; partial transfers restart from zero. Metadata drafts, selected unuploaded files, optional cover/captions and House design remain account-local in this increment.
7. Open **Account → Sign out**. The API revokes persistent MUNK sessions for that provider login and clears the HttpOnly cookie before the SDK logs out. The UI reports failures rather than silently claiming success. Reload as a guest to confirm creator routes are gated; signing in again returns the same account/House. Use a separate browser profile and different wallet/passkey account to check House isolation.

The old preview storage keys are retained, never imported as authentication or automatically assigned to a real account. New creator draft storage is scoped by the verified MUNK account ID. Session tokens are random HttpOnly SameSite=Strict cookies (Secure under HTTPS), stored only as SHA-256 hashes in PostgreSQL; CSRF tokens are bound to each session. Sessions last up to seven days and survive API/database restart while valid. Provider revocation is not continuously synchronized into MUNK's independent session; MUNK logout, expiry and account suspension enforce its own revocation boundary.

## Manual reviewer demonstration

Have a different real account sign in. Its MUNK account UUID appears under **Account → Account settings → Wallet · advanced**. An operator grants only that existing Privy-linked account the review capability:

```sh
cd /Users/azayel/monk
npm run reviewer:grant --workspace backend -- REVIEWER_MUNK_ACCOUNT_UUID
```

The reviewer refreshes the page, opens **Creator → Settings → Manual creator review**, loads the queue, watches the introduction and performs a real live creator-control check. Record separate creator-control and introduction decisions with method/reason. Two approvals admit the current revision. Self-review and stale revisions are rejected. Automated fixtures are not evidence that any real person has been reviewed.

## What still prevents public creator-to-viewer publication

Authentication, House drafts, private upload/processing, submission and manual review are connected. These endpoints still need implementation and frontend adapters before a creator's video has a guest-visible public URL:

- `POST /api/houses/:id/works`, `GET/PATCH /api/works/:id/draft`: durable video metadata, series/episode and same-House asset associations.
- `POST /api/works/:id/publish`, `POST /api/works/:id/unpublish`: atomic membership/current-admission/ready-asset checks and idempotency. Recheck admission and publication for every public media request.
- `GET /api/works/:id`, `GET /api/houses/:id` and a public catalog endpoint: sanitized public records, server-backed route/entity lookup and Discovery/House navigation.
- `GET /api/works/:id/media`: public processed media with HTTP Range/206, length/type and immediate denial after unpublish/loss of admission. No static exposure of source/draft/introduction files.
- Optional thumbnail/caption ingestion, public follows/comments and relevant browser/restart acceptance remain separate work.

Current publish/unpublish controls return explicitly unavailable; the fixture public catalog and bundled sample are not substitutes for an uploaded public work.

## Checks and honest limits

Backend tests include actual ES256 signatures verified by the installed Privy SDK, invalid signature/app/issuer/expiry rejection, hashed sessions, CSRF, logout replay prevention, re-login identity persistence and HTTP cross-account permissions. Provider user lookup is an explicit fixture in automated tests; no test-key override or login bypass is installed in server.ts. Native PostgreSQL tests also exercise the real SQL/media/review services. Real passkey creation/recovery and human review require the browser walkthrough above and are not claimed from fixtures.

```sh
npm run check
npm run test:native --workspace backend
node frontend/scripts/auth-browser-check.mjs
```

The browser script uses an isolated Chrome profile against the existing development frontend on port 5173. It captures real guest/Privy initialization screens, then uses a separate SDK/API fixture to exercise the production SessionBridge's signed-in states without creating real accounts or touching the database. Results and screenshots are under ignored artifacts/onboarding/. This is not a real passkey signup, wallet recovery, or authenticated provider-backed House-save claim. See [ACCOUNT-JOURNEY.md](ACCOUNT-JOURNEY.md).

Dependency audit after compatible updates still reports **34 advisories (19 high, 15 moderate)** across SDK transitive packages and the retained toolchain. The report is recorded in ignored artifacts/privy-audit.json; the compatible-fix log is artifacts/privy-audit-fix.log. Forced SDK downgrades or toolchain major upgrades were not applied. A successful build/test run is not a clean dependency audit or production-readiness claim. Use unfunded development wallets as planned; dependency remediation/compatibility review remains outstanding.
