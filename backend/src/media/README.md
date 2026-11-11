# Private media storage and processing

`store.ts` streams bytes to opaque private keys, enforces exact length, computes SHA-256 and syncs/renames completed files. `process.ts` invokes ffprobe/FFmpeg without a shell, restricts input protocols/formats, bounds duration/size/subprocess execution, produces H.264/AAC MP4 and a poster, probes output and reports actual timestamps. Server-private runtime files belong under ignored backend/.data/media, never frontend/public. FFmpeg/ffprobe paths are configured on the backend. Image/caption ingestion and public Range playback remain pending.
