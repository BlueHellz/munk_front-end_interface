# Persistent local PostgreSQL on Intel macOS 12

The project's downloaded **PostgreSQL 18.4 darwin-x64 binaries** were verified on this machine: **macOS 12.7.6, x86_64**. They can run the persistent development database. **Do not retry the interrupted Homebrew/CMake source build.** No new installation or paid service is required.

## Start only the database

From ordinary Mac Terminal:

```sh
cd /Users/azayel/monk
npm run db:local --workspace backend -- start
```

Keep that terminal open. This is a dedicated development launcher in src/db/local-postgres.ts; it does **not** use the disposable test runner or embedded-postgres's auto-cleanup lifecycle hooks.

- Stable cluster: `/Users/azayel/monk/backend/.data/postgresql/data`
- Listener: **127.0.0.1:55432 only**; Unix sockets are disabled. It does not listen on external interfaces and does not change MUNK's frontend origin http://localhost:5173.
- First start initializes a new cluster only when no managed data exists. Later starts reopen the same PostgreSQL 18 data. Unknown/nonempty incomplete directories and different major versions are refused rather than replaced.
- App role `munk` has login but no superuser, role-creation or database-creation privileges. Missing development databases `munk` and `munk_test` are created once; existing role passwords/database ownership are never reset or reassigned.
- Passwords are generated locally, stored in private ignored files, and never printed. The data directory has mode 0700 and credential files mode 0600. Authentication uses SCRAM, not trust.
- The launcher never edits `backend/.env`, runs application migrations, starts the API/frontend, or deletes a database directory. The only file it removes is its own transient launcher lock during normal shutdown.
- No system service, launch agent or system PostgreSQL user is installed. Existing installations/listeners are not stopped. A port conflict fails without killing another process.

## Clean shutdown and status

Press **Ctrl+C** in the database terminal. It waits for a clean PostgreSQL fast shutdown, retaining the cluster and credentials. Fast shutdown rolls back unfinished transactions; it does not erase committed data.

Alternatively, from another terminal:

```sh
cd /Users/azayel/monk
npm run db:local --workspace backend -- status
npm run db:local --workspace backend -- stop
```

The stop command addresses only this managed data directory and uses pg_ctl fast shutdown. There is deliberately no reset/delete command. If a launcher lock remains after an abnormal interruption, the launcher refuses another startup rather than automatically deleting it or a postmaster PID file; inspect the stopped/running state before any manual recovery.

## Local configuration: next step after startup

The private file below contains the generated application and dedicated test connection URLs:

`/Users/azayel/monk/backend/.data/postgresql/connection.env`

Open it locally in an editor. **Do not paste its contents into chat.** Copy its DATABASE_URL, TEST_DATABASE_URL and DATABASE_SSL entries into `backend/.env` yourself, preserving other settings. If backend/.env does not exist, first copy backend/.env.example without overwriting an existing file. No secret values are shown in this document or in launcher output. Keep APP_ORIGIN=http://localhost:5173 and the approved public Privy app ID. The Privy read-only app secret is a separate local entry, described in [PRIVY-DEVELOPMENT.md](PRIVY-DEVELOPMENT.md).

Do not restart the Homebrew tool build for FFmpeg either. The project already has prebuilt media tools for native tests; selecting/checking the worker's local tool paths is a later setup step, separate from starting PostgreSQL. Never put database credentials or a Privy secret in frontend configuration.

Keep the database terminal running while the API is in use. Data lives outside node_modules and survives npm ci; the launcher requires the pinned downloaded binaries to remain available, checks the cluster's major version and performs no automatic upgrades.

## Verification performed

- PostgreSQL 18.4 initialized and accepted authenticated TCP connections on this exact Intel macOS 12 host.
- App role privilege checks confirmed no superuser/createdb/createrole privileges.
- A single compatibility marker was saved in `munk_test.munk_local_persistence_check`, the server was stopped cleanly with pg_ctl, and the **same directory** was reopened. The marker survived. This table was left intact; the application database was not populated or migrated.
- Ctrl+C clean shutdown also passed. The server was left **stopped**, with its data and credentials retained.
- Git ignores the whole backend/.data tree. Credential modes are 0600 and cluster mode is 0700. backend/.env remained absent and unchanged during this verification.
- Backend TypeScript check passed. No Homebrew installation was retried, no disposable test runner used and no existing cluster/configuration overwritten.

PostgreSQL references: [foreground server/listener configuration](https://www.postgresql.org/docs/18/app-postgres.html), [initialization](https://www.postgresql.org/docs/18/app-initdb.html), [clean pg_ctl shutdown](https://www.postgresql.org/docs/18/app-pg-ctl.html).

Public publishing remains unfinished. Application startup and the real Privy account/House walkthrough follow only after persistent database and local secret configuration are confirmed.
