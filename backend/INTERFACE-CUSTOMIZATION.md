# Shared interface customization

The viewer Home and actual public House pages now share `frontend/src/InterfaceRenderer.tsx`, with the same renderer inside `InterfaceEditor.tsx`. There is one application, one database and the existing publication/media/security boundary. The existing network header, account/security menu and peach/ivory palette remain. Guests use MUNK Estuary. Existing saved viewer designs remain unchanged. Saved personal designs load only for their authenticated account. A House loads its own independently saved design; Home reloads the viewer design.

## Browser walkthrough

Keep the existing database, API, worker and frontend running. The additive migration `0006_interface_designs.sql` is applied locally. Reload `http://localhost:5173`.

1. Open `http://localhost:5173/#/home` and browse immediately. Guests get the complete MUNK Estuary default; returning users keep their saved skin. No chooser or setup step opens automatically.
2. Open **Menu → Appearance & add-ons → Browse skins**. Choose **Preview** on MUNK Estuary (the default media center), MUNK Discovery, Cinema or Compact grid. These are built-in choices, not downloadable packages.
3. Preview desktop/mobile, then **Apply → Return to browsing**. Preview alone does not save. **Installed** shows the current saved skin and the available built-ins.
4. Optional: choose the secondary **Customize** action under Installed/current skin or after Apply to open the existing advanced editor. Save there to commit detailed edits; Cancel keeps the saved appearance.
5. Restore through **Installed → Restore default → Apply → Return to browsing**. This is explicit and preserves revision history.
6. For a House: **My Houses → selected House → Appearance → Preview → Apply**. Alternatively **Menu → Appearance & add-ons → House builds → selected House → Appearance**. The same two built-in House presentations and existing operator permissions apply.
7. Enter the published House to see its saved build. Return Home to restore your personal skin. Sign in to the same account in another browser or restart the normal services to verify saved choices load from the server.
8. **Add-ons** is marked unavailable. No marketplace, downloads, payments or executable add-ons are implemented.

Existing browser-local draft/design records are left intact. They do not override the new server-saved interfaces. My mix saves/reposts and unrelated fixture/social routes retain their existing honest local/fixture behavior; the **Discover** catalog itself now uses real publication data.

## Content and permissions

`GET /api/public/catalog` reads the existing `works`/`assets`/`houses` relations using the same eligibility predicate as actual public videos: published work, ready video, active operator/author, eligible House. No ownership or access decision is accepted from a design. All content sources and collections are intersections of already-authorized public results. Removed/unpublished work disappears even if a saved package lists its ID. No database/content copy is created for any theme.

Writing publication is still unavailable, so writing-led sections show a truthful empty state. Video sections remain available in Editorial House. Series groups derive from real server video series metadata. Curated collections are presentation-level selections of published work IDs, not another publishing service.

A ready introduction reserves a position before customizable sections. Public playback requires the existing current admitted submission’s public-information consent and matching ready introduction; private introductions are not exposed by theme selection. Operator previews may use the existing authorized private introduction playback. No introduction is required in demo mode; no verification/admission claim is added.

Actual House links include `?source=server` to avoid collisions with retained fictional House slugs. Old fictional routes remain separate. Search matches the same title/description/series/House/creator fields in every viewer presentation, over the same real published catalog; it does not fall back to fixtures when the API fails.

## Storage/API

| Endpoint | Access |
|---|---|
| GET `/api/public/catalog` | Guest-readable, published eligible videos only |
| GET `/api/me/interface` | Active authenticated account; current design + latest 30 revisions |
| PUT `/api/me/interface` | Same account + exact origin/CSRF; optimistic expected revision |
| GET/PUT `/api/houses/:id/interface` | Fresh owner membership **and** operator account; PUT also origin/CSRF/revision |
| GET `/api/houses/:id/interface-content` | Same operator checks; actual published House works for preview |
| GET `/api/public/houses/:address/interface` | Public House eligibility, no account details or private revision history |
| GET/HEAD `/api/public/houses/:address/introduction` | Published House + consented current admitted introduction, same media Range delivery |

`interface_designs` has exactly one account or House target and an independent revision. `interface_design_versions` records saved snapshots in the same transaction. Account/House locks serialize saves and stale writes return 409. Changing a presentation does not mutate House versions/admission, membership, media, metadata or publication. No old migration was edited.

The closed v1 contract (`contracts/src/interface.ts`) contains package ID/version, explicit scope/template, enumerated appearance/navigation and at most 12 bounded sections. Only registered application primitives can render. No HTML, executable code, scripts, arbitrary CSS, remote asset URLs or permission overrides are accepted. Package identity and semantic version support later packaging/sharing/licensing; import/export, marketplace, licensing enforcement and payments are not implemented.

Accessibility: network security controls remain recognizable; native labelled inputs/buttons, keyboard reorder/remove controls, 44px category targets and overflow-contained shelves. Container queries apply desktop/tablet/mobile arrangements equally in preview and live pages. Reduced-motion OS preferences override subtle motion. Zero optional sections still leaves the searchable catalog.

## Targeted verification

See `artifacts/interface-foundation/` for exact results/scopes. The small read-only live comparison uses the existing local public API and real published House/video, with no saved-design changes and no fixture content. The focused native browser test uses generated uploaded/transcoded/published media, real HTTP/session/CSRF handlers and isolated PostgreSQL. Its creator identity/provider context is synthetic; it is not a real Privy signup. Guest browser playback uses the production frontend with no authenticated cookie. There is no production auth bypass.

The targeted flow checks all three viewer layouts and both House presentations against identical actual work IDs, collection editing/reordering, save/cancel/default/history, separate browser persistence, Home/House isolation, guest defaults, tablet/mobile page bounds/touch targets, owner isolation, publisher denial, CSRF, invalid executable package fields, stale revisions and API/pool reopening. The targeted native runner also stops/starts its disposable PostgreSQL after actual interface saves and compares account/House designs/history exactly. It never restarts or resets the user’s database. No screenshot system or package is rebuilt.

Completed results: local additive migration applied; contract/backend/frontend types and workspace boundaries passed; frontend build passed with existing SDK annotation/large-chunk warnings; API boundary test passed. The read-only comparison confirmed the existing local catalog (1 published video, 1 House) across all five templates. Focused native HTTP/media/browser verification passed, followed by actual test PostgreSQL stop/start comparison of saved personal and House designs and revision history. No human Privy signup/recovery flow was tested during this change. Introduction placement/consent is source-inspected; the current real-content comparison did not contain an introduction.

MUNK Estuary uses the stock Kodi Estuary Home only as a layout/navigation reference: persistent text/icon destinations and a content panel, compact utilities and a mobile drawer. MUNK assets, warm colors and typography remain. Official references: https://kodi.wiki/view/Basic_controls and https://github.com/xbmc/xbmc/blob/master/addons/skin.estuary/xml/Home.xml . Only the default returned for an account without a design and the permitted viewer-template enum changed server-side; no saved record or migration was rewritten. Focused guest captures and live checks are in `artifacts/estuary-home/`. Writing publication and network-video saving remain unconnected; their destinations expose honest empty states. Exchange retains its existing fictional, explicitly labeled mosaic; real trading remains unavailable.
