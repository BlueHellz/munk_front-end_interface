CREATE TABLE auth_login_challenges (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE TABLE account_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  account_id uuid NOT NULL REFERENCES accounts(id),
  provider_subject text NOT NULL,
  provider_session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX account_sessions_account_idx ON account_sessions(account_id);
CREATE TABLE revoked_provider_sessions (
  subject text NOT NULL,
  session_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (subject, session_id)
);
CREATE TABLE auth_rate_windows (
  actor_hash text NOT NULL,
  window_start bigint NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  PRIMARY KEY (actor_hash, window_start)
);
