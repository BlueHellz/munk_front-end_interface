# HTTP foundation

`app.ts` implements health/readiness, request IDs, bounded JSON and sanitized errors. `auth.ts` exposes browser-bound login challenges, Privy token exchange, persistent session restore and logout. `protected.ts` authorizes creator/upload/reviewer routes using a real database session and CSRF proof for writes. Domain services then recheck active account/current House membership or reviewer capability. No preview/test account or header bypass exists. See [development setup](../../PRIVY-DEVELOPMENT.md).
