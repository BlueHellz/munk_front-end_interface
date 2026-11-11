# Server-only configuration

`env.ts` validates database, origin, listener and logging settings. Relative media paths resolve from backend/. Commands load ignored backend/.env; see backend/.env.example. Never export secrets to frontend, contracts or VITE_ variables. Provider configuration awaits embedded-wallet setup.
