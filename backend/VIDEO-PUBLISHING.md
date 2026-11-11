# Local video publication

Video upload, server metadata, publication and guest playback are connected. This remains a local demo, with real authentication and House/uploader permissions. It does not add hosting, blockchain, trading, messaging, or identity verification.

## Publish the existing draft

The live status check found one video queued with its bytes received. No media worker was running. The existing worker was started with the configured FFmpeg/FFprobe tools; a subsequent aggregate check confirmed **ready** and **succeeded**. The upload was not replaced or uploaded again.

1. At `http://localhost:5173`, sign in using the existing account if needed. Open **My Houses → Open workspace** for the existing House.
2. Open **Library → Continue draft** (or **Open video** for a server-saved video). Existing account/House browser draft keys are preserved.
3. If its upload reference is intact, the editor checks the real server upload and shows **Ready to publish**. Do not select the file again. If no reference is linked, open **Use an existing upload** and choose the ready video. This links the existing owned asset; it does not resend bytes.
4. Edit title/description as desired. A selected file supplies a title automatically; description is optional. Metadata is saved to the server once an upload is linked. The upload and draft remain private until publication.
5. If Publish is disabled, read its adjacent explanation: upload/processing must finish, the server must be reachable, and the selected House must be demo-ready (or strictly admitted in strict mode). For an older House, use **House details → Continue this House as demo House**; that preserves its ID, membership and uploads.
6. Click **Publish** and confirm that the video and House profile may be viewed by anyone with the link. The backend freshly verifies membership, work ownership, asset purpose/House, actual ready state and processed files before committing publication.
7. Click **Watch video**, or copy **Viewer URL** and paste it into a separate private/incognito guest browser. No sign-in is required to watch. **Visit House** lists actual published videos on the actual server House page.

The viewer URL is `http://localhost:5173/#/videos/<server-work-UUID>`. The House URL is `http://localhost:5173/#/houses/<actual-house-address>`. These resolve through the API; fictional catalog routes remain separate. No personal viewer URL is copied into this documentation or test evidence.

Use **Unpublish** to stop new public metadata/media requests; the private video and its draft remain stored. Unpublish before changing already-published metadata. A browser draft that differs from server metadata stays retained; **Save video** explicitly stores those edits. **Reload server details** refreshes the version after a conflict without deleting the browser draft.

## Persistence and startup

The existing persistent PostgreSQL database stores `works` metadata, House/asset linkage, client-draft ID, publication state, timestamp and version. Migration `0005_video_publication.sql` only adds stable draft/upload references and a uniqueness index; no existing account, House, asset, draft or media is reset. Uploaded originals and processed MP4/poster files remain under the configured persistent backend media root, never the frontend public directory. Repeated saves/publication requests do not create duplicate work records for the same account/House/client draft.

Use the existing local commands when restarting:

```sh
cd /Users/azayel/monk
npm run db:local --workspace backend -- start
```

Leave that database terminal open. In a second terminal:

```sh
cd /Users/azayel/monk
npm run db:migrate
npm run dev:backend
```

In separate terminals:

```sh
cd /Users/azayel/monk
npm run worker --workspace backend
```

```sh
cd /Users/azayel/monk/frontend
npm run dev -- --port 5173 --strictPort
```

Keep the configured database and media directory when restarting. Do not use the disposable native-test cluster as application storage. A queued video needs the worker; publication does not simulate completion. Existing private environment configuration remains local and unchanged by publication implementation.

## API boundaries

| Endpoint | Permission / behavior |
|---|---|
| GET `/api/houses/:id/videos` | Active member; own server videos in that House, with actual asset state. |
| POST `/api/houses/:id/videos` | Session + origin/CSRF + fresh membership; upsert metadata using `clientDraftId`, verified owned upload, expected version on changes. Draft metadata can save while processing. |
| GET `/api/videos/:id` | Active member/work author; private server metadata. |
| POST `/api/videos/:id/publish` | Same permissions + version, actual ready video/files, eligible House. Demo readiness grants eligibility only in explicit local demo mode; strict mode still requires admission. |
| POST `/api/videos/:id/unpublish` | Same author/member checks + version. Keeps media and draft. |
| GET `/api/public/videos/:id` | Published, eligible House, active operator/author, ready video; public whitelist only. |
| GET `/api/public/houses/:address` | Actual House profile and published eligible videos; no private empty-House exposure. |
| GET/HEAD `/api/public/videos/:id/media` | Fresh public eligibility; processed MP4 only. Full200, single-range206, invalid/unsatisfiable416 and HEAD Content-Length. |
| GET/HEAD `/api/public/videos/:id/poster` | Same publication checks, generated JPEG only. |

Private upload/reviewer playback also uses the same range helper behind its existing authentication guards. Originals, introductions, account/wallet data and private media keys are not exposed by public DTOs. Unpublished/private work IDs return404 publicly. Strict-mode servers do not expose demo-only publications. Local demo startup still rejects production/non-local origins.

## Verification scope

Completed checks: `npm run check` passed (boundary, contracts/backend types, frontend build/model checks and default backend tests: 10 passed, 5 native-only skips). The final frontend build and frontend tests passed after the viewer-link fix. `npm run test:native --workspace backend` passed all 12 tests, with no skips, including the creator/guest browser journey and the PostgreSQL process persistence probe. The build retains the existing large-chunk warning. Running local `/api/ready` returned 200 and `/api/config` reported demo mode with public publishing enabled.

See `artifacts/publication/` for sanitized results. Native tests use generated media and disposable PostgreSQL, actual production frontend adapters/HTTP handlers and actual FFmpeg output. The creator browser restores a real test MUNK session through `/api/me` but uses a test identity context instead of real Privy signup; no API, publication or processing responses are mocked. The separate guest browser uses the production frontend and no authenticated cookie, actually plays/seeks the processed video and visits its actual House listing.

Tests also check Range byte equality, HEAD/416, metadata persistence, repeated publication, unpublishing public access, authorization/CSRF, strict-vs-demo policy and API/pool/media reopening. PostgreSQL process stop/start persistence is also covered by the native runner's separate probe. These tests do not claim a human Privy signup or that the user's private video was published during testing. No screenshots or screenshot packages were generated.
