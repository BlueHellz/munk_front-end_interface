# Media worker

`worker.ts` runs the configured FFmpeg processor. `processor.ts` claims PostgreSQL jobs with row locks, leases and heartbeat, reclaims expired leases and fences stale completions by token/generation. Output is only ready after successful processing, probe validation and durable files. Start from the repository root with `npm run worker --workspace backend`. See backend/README.md for setup, native test evidence and limits.
