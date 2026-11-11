# Current pass

See [discovery-pass.md](discovery-pass.md) for the new Discovery preset, default Exchange canvas, preserved Classic mode, local progress and current verification results. Frontend remains pending visual approval. The earlier status below documents retained features; its capture paths are historical.

# Frontend status — corrections, pending visual approval

## Implemented in code

- Unique reloadable House, film, article and Board-thread routes; exact link destinations; explicit missing-ID page.
- Matching fixture creator names, biographies, introductions, recipients and independent House theme configuration. Three new creators use clearly labeled monogram portrait placeholders.
- Reserved creator-introduction area outside every House tab. No supplied introduction videos or admission verification.
- Personal Home configuration isolated from House themes. Add/remove/reorder six section types; three font presets, four surface palettes, spacing, density, columns, component-based desktop/mobile preview, undo, save and version restoration.
- Stable top-level React components, recursively rendered parent-specific replies, accurate record counts, separate bookmarks/reposts, My mix reposts and current-like sorting.
- Runtime configuration/state validation, corruption fallback and caught storage failures with visible warnings.
- Explicit session-only wallet-access preview; no real authentication/crypto. Guest media/reading/search remain available.
- Native HTML media controls with a bundled original CC0 silent 8-second WebM, captions, poster and clear sample disclosure. Unsupported/loading errors are reported; no synthetic playback state.
- Plaintext local message drafts addressed to the selected creator; local-room notes/reactions/minimize/resume, explicitly no delivery/broadcast/audience.

## Evidence

Production build and pure/model/server-render checks pass. FFmpeg identifies and decodes the bundled VP8/WebM file; that is not evidence of browser playback. The browser suite includes desktop/tablet/mobile screenshots, keyboard, history, media progression, long-text and no-overflow checks but is blocked at server startup in this execution environment. Its results are recorded under `review/frontend-corrections/`.

## Still missing or unverified

- Rendered screenshot comparison and user visual approval; real-browser interaction, layout, touch and media checks have not passed here.
- Full-resolution original images and exact fonts; three original creator portraits; real creator introduction videos.
- All creator films are fixture metadata sharing one explicitly labeled sample clip. No adaptive/full-film playback or actual live media exists.
- A complete House design editor is absent. Each fixture House has its own predefined validated-type configuration; only personal Home is editable here.
- Native video-control appearance varies by browser and differs from the drawn reference controls.
- Wallet authentication, replay protection, server authorization, delivery, encryption, shared persistence, upload/processing, content authoring, e-books, decentralized publishing/storage and governance are not implemented.
- Preview account access is a UI boundary, not a security mechanism. Data remains unencrypted in localStorage and is not synchronized across users/tabs.

Backend work remains paused. No deployment or hosted prototype/access change was made.

## Focused visual correction pass

A separate `src/visual-fixes.css` preserves the existing shell while correcting selected Home-tab contrast, auto-sized mobile room rows, bounded video overlay grids (three/two/one bubbles), a reserved native-control area, lightweight shared handwritten titles, mobile supporting type and touch sizes, and the default orange/ivory article surface. The article's alternate House theme is an explicit toggle.

Latest browser capture and actual playback-progress attempt are recorded under `review/visual-corrections/`. Server startup remains blocked. No corrected screenshots or browser playback timings were obtained. Higher-resolution originals were unavailable; no photo replacement is claimed. Existing model/render tests and the production build remain the non-browser validation boundary.
