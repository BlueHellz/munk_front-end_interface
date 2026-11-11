# Frontend architecture decisions

The existing React/TypeScript/Vite application and approved shell/CSS are retained. The correction pass separates record identity, state and stable top-level components rather than introducing a new application or a new visual design.

- **Entity routing:** explicit House/work/post IDs in hash URLs. Record kind and existence are checked before rendering; unknown URLs show a missing-item page. House/content references resolve through typed fixtures.
- **Independent design scopes:** each House owns a predefined Theme. Viewer Home owns a separate HomeDesign with an ordered section list. Shared cards receive a theme explicitly; they do not read viewer grid preferences implicitly.
- **State:** one versioned browser-only store. Runtime guards validate enum values, bounded collections, valid entity references and acyclic same-target reply parents. Storage access/serialization failures are caught and visible. Legacy ambiguous records are not silently attached to new entities.
- **Stable components:** screens, threads, forms and dialogs are top-level functions. App renders them with entity keys only when identity changes, preserving in-progress inputs across unrelated state updates.
- **Threads:** parent IDs define recursive DOM placement. Reply controls carry the exact parent. Displayed totals come from stored records; likes merge explicit fixture actor IDs with the local preview actor. Reposts are separate IDs rendered in My mix.
- **Media:** native HTML video controls operate the included original silent sample. No play/mute/seek/streaming success is simulated. Introduction media and live broadcast remain explicitly unavailable.
- **Access preview:** guests browse/read/search/play media. Write/account actions open an explicit wallet-flow preview and can be enabled locally for the current tab. This provides no authentication or authorization security.
- **Privacy:** no wallet is connected. Message drafts are plaintext local records. Local rooms have no network transport. No encrypted or decentralized property is claimed.
- **Backend boundary:** no APIs, servers, databases, wallet/chain integrations or deployment services were added. Vite only serves the frontend.

Browser layout, keyboard behavior, actual HTML media playback and screenshot comparison still need execution outside the restricted agent environment and visual approval before backend work.
