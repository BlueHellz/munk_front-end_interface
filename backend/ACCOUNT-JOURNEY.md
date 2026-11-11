# Local account and House journey

Development remains at http://localhost:5173. One real Privy wallet account supplies a signed-in viewer session. House memberships add creator capabilities; they do not replace the viewing experience. Signup neither creates a House nor enables trading. User-owned wallets, recovery, backend session verification, and server permissions remain in place.

| Destination | Purpose |
| --- | --- |
| `#/home` | Personal viewing Home; guests can browse fictional discovery content. |
| `#/home?tab=mix` | Signed-in viewer's browser-local saves/reposts. |
| `#/sign-in` | Focused Sign in / Create account screen; real Privy passkeys, secondary methods, and setup retry. |
| `#/account/settings` | Private sign-in/recovery settings and collapsed advanced wallet controls. |
| `#/my-houses` | Current server memberships, roles, and Manual creator review status. No fictional ownership or fallback on errors. |
| `#/create/house` | A separate new House draft, scoped to this account in this browser. Confirming Save reserves its address and creates the House. |
| `#/create/house?house=UUID` | Edit an existing House; owner permission required. |
| `#/creator/overview?house=UUID` | Selected creator workspace; other creator panels, editors, and private previews retain the same query parameter. Reload rechecks membership. |
| `#/home?tab=exchange` | Exchange browsing only. Trading is unavailable in this MVP. |

The network header has one compact **Sign in** entry for guests and an account/avatar menu for signed-in users. The sidebar has no competing account control. **Account → Customize Home** opens the existing browser-local designer; **Account → Account settings** opens private recovery and advanced wallet controls. The header search uses the existing discovery filter, and the Home secondary navigation is **Discover / My mix**. Messaging, publishing, and trading notices remain beside their affected features.

The guest navigation has one prominent **Sign in** entry. The focused screen offers **Sign in**, **Create account**, secondary **More ways to sign in**, and **Continue browsing**. Account creation registers a passkey and creates the user-owned wallet as one journey. Loading, device confirmation, setup, verification, cancellation, and failure have separate states. If account creation succeeds but setup fails, **Retry setup** refreshes that same Privy account and checks for an existing wallet before retrying; it never repeats signup. A private session-storage marker allows setup recovery after a reload when the same Privy account remains authenticated.

Ordinary signup returns to viewing Home. Authentication prompted by an action retains its destination in session storage. Return restores the route and draft only; the original action is never replayed or submitted. A failed/cancelled attempt keeps the destination so the user can retry. **Continue browsing** returns to the originating page and clears the authentication intent. Unuploaded file bytes cannot survive a reload; reselect files when requested.

House creation, saving changes, uploads, and admission submission require an explicit confirmation. Save a new House before submitting for Manual creator review. Review is not legal identity verification or KYC. Publishing remains unfinished, so saving a House does not add it to public discovery.

Viewer saves, reactions, comments, messages, and Home customization are browser-local, with viewer state scoped by account. New local comments use “You · browser-local,” never a wallet address or invented account identity. Legacy shared preview preferences are preserved; shared preview participation is not attributed to a newly signed-in account. Existing creator browser drafts migrate only when their House address matches an authorized server House. Creator drafts are now scoped by account and selected House.

## Browser walkthrough

1. Open http://localhost:5173/#/home and browse stories, House discovery, search, and the Board as a guest.
2. Open **Sign in → Create account**, complete Privy, and wait for backend verification. Ordinary signup returns to viewing Home; no House is created.
3. Open **My Houses**. A new account shows **No Houses yet**. Server failures show an error and Retry, never fictional memberships.
4. Choose **Create a House**, enter House details and your intended public creator name, then **Save House draft**. Confirm the address reservation. This saves a draft, not a publication.
5. Open **My Houses → Open workspace**. Check the selected House and membership role. Change creator tabs or reload: the `house` parameter remains. **Edit House details** edits that House; the sidebar **Create a House** starts another draft.
6. Choose **Viewing Home** to return to normal viewing. Exchange browsing remains available, with real trading explicitly unavailable.

For action return, draft a comment while signed out and choose **Save local comment**. Sign in, then explicitly choose **Save local comment** again and confirm whether to save it locally. Reload during the sign-in flow to check draft recovery; the restored draft is not automatically submitted.

## Verification scope

`npm run check` covers workspace boundaries, shared types, backend type checks, the production frontend build, frontend model/render/API checks, and default backend tests. `npm run test:native --workspace backend` uses a separate disposable PostgreSQL cluster; it does not reuse the persistent development database. Role DTOs, owner/publisher permissions, and membership revocation have native SQL coverage.

`node frontend/scripts/journey-browser-check.mjs` requires the existing frontend on port 5173 and local Chrome. It checks the real app's guest discovery and account controls, then an isolated, temporary `.qa` browser harness for signed-in UI scenarios. The harness uses test-only responses and never authenticates against MUNK or writes to its database; it is removed afterward. A real human Privy passkey signup, wallet recovery, and authenticated production-provider House save are not claimed by those tests. See `artifacts/journey/result.json` for the latest browser results.

No messaging delivery, public publishing, financial onboarding, trading, blockchain transactions, paid infrastructure, or deployment was added.

## Focused onboarding verification

`node frontend/scripts/onboarding-browser-check.mjs` captures the real guest screen with the configured Privy SDK and separately runs the production SessionBridge against an isolated SDK/API fixture. Those simulated cases cover signup followed by setup failure, same-account retry, original draft return without submission, cancellation/error states, linked-email signup prevention, private settings, mobile layout, and keyboard focus. Screenshots and scope are recorded in `artifacts/onboarding/`. No real Privy account or wallet is created by this script. The old auth-browser entry forwards to this check.

## Network navigation verification

`node frontend/scripts/navigation-browser-check.mjs` verifies real guest search and responsive navigation, and checks signed-in account controls and Customize Home in a separate AuthContext/API fixture. Guest screenshots use the real application; signed-in screenshots are simulated UI states, not provider authentication verification. Desktop/mobile sidebar open/closed captures and test results are under `artifacts/navigation/`. Authentication, database, upload, and worker implementation were not changed by this navigation cleanup.
