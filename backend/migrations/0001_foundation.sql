-- Forward-only foundation. No seed accounts, credentials, reviewers or admissions.
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Provider subject is mapped only after actual server-side verification in the later auth slice.
-- No private keys, key shares, passkeys, recovery secrets or provider tokens belong here.
CREATE TABLE account_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  provider text NOT NULL CHECK (provider IN ('privy', 'siwe')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 255),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, subject)
);
CREATE INDEX account_identities_account_idx ON account_identities(account_id);

CREATE TABLE wallet_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  namespace text NOT NULL DEFAULT 'eip155' CHECK (namespace = 'eip155'),
  address text NOT NULL CHECK (address ~ '^0x[0-9a-f]{40}$'),
  kind text NOT NULL CHECK (kind IN ('embedded', 'external')),
  provider_wallet_id text,
  authenticated_at timestamptz NOT NULL,
  UNIQUE (namespace, address),
  CHECK (kind <> 'embedded' OR provider_wallet_id IS NOT NULL)
);
CREATE INDEX wallet_credentials_account_idx ON wallet_credentials(account_id);

CREATE TABLE houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL UNIQUE CHECK (address ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  public_name text NOT NULL DEFAULT '' CHECK (char_length(public_name) <= 80),
  focus text NOT NULL DEFAULT '' CHECK (char_length(focus) <= 120),
  founder_account_id uuid NOT NULL REFERENCES accounts(id),
  operator_account_id uuid NOT NULL REFERENCES accounts(id),
  design jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(design) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  admission_revision integer NOT NULL DEFAULT 1 CHECK (admission_revision > 0),
  admission_status text NOT NULL DEFAULT 'draft' CHECK (admission_status IN ('draft', 'pending_review', 'admitted', 'changes_requested', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE house_memberships (
  house_id uuid NOT NULL REFERENCES houses(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  role text NOT NULL CHECK (role IN ('owner', 'publisher')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (house_id, account_id)
);
CREATE INDEX house_memberships_account_idx ON house_memberships(account_id);

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES houses(id),
  created_by uuid NOT NULL REFERENCES accounts(id),
  purpose text NOT NULL CHECK (purpose IN ('introduction', 'video', 'thumbnail', 'captions')),
  state text NOT NULL DEFAULT 'created' CHECK (state IN ('created', 'receiving', 'received', 'queued', 'processing', 'ready', 'failed', 'cancelled', 'expired')),
  generation integer NOT NULL DEFAULT 1 CHECK (generation > 0),
  expected_bytes bigint NOT NULL CHECK (expected_bytes > 0 AND expected_bytes <= 2147483648),
  received_bytes bigint NOT NULL DEFAULT 0 CHECK (received_bytes >= 0 AND received_bytes <= expected_bytes),
  sha256 text CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  source_key text,
  playback_key text,
  poster_key text,
  duration_ms bigint CHECK (duration_ms > 0),
  probe jsonb CHECK (jsonb_typeof(probe) = 'object'),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, house_id),
  UNIQUE (id, generation),
  CHECK (purpose <> 'introduction' OR expected_bytes <= 536870912),
  CHECK (state NOT IN ('received', 'queued', 'processing', 'ready') OR (received_bytes = expected_bytes AND sha256 IS NOT NULL AND source_key IS NOT NULL)),
  CHECK (state <> 'ready' OR playback_key IS NOT NULL),
  CHECK (state <> 'ready' OR purpose NOT IN ('video', 'introduction') OR (duration_ms IS NOT NULL AND poster_key IS NOT NULL))
);
CREATE INDEX assets_house_idx ON assets(house_id);

CREATE TABLE upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL UNIQUE REFERENCES assets(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at),
  CHECK (completed_at IS NULL OR cancelled_at IS NULL)
);

CREATE TABLE processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  generation integer NOT NULL,
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  progress_seconds double precision CHECK (progress_seconds >= 0 AND progress_seconds < 'Infinity'::float8),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, generation),
  FOREIGN KEY (asset_id, generation) REFERENCES assets(id, generation),
  CHECK ((state = 'processing' AND lease_token IS NOT NULL AND lease_until IS NOT NULL) OR (state <> 'processing' AND lease_token IS NULL AND lease_until IS NULL))
);
CREATE INDEX processing_jobs_claim_idx ON processing_jobs(available_at, created_at) WHERE state IN ('queued', 'processing');

-- Manual creator review is neither verified legal identity nor KYC.
CREATE TABLE reviewer_capabilities (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES houses(id),
  revision integer NOT NULL CHECK (revision > 0),
  submitted_by uuid NOT NULL REFERENCES accounts(id),
  introduction_asset_id uuid NOT NULL,
  introduction_sha256 text NOT NULL CHECK (introduction_sha256 ~ '^[0-9a-f]{64}$'),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  face_visible_declared boolean NOT NULL CHECK (face_visible_declared),
  public_information_consent boolean NOT NULL CHECK (public_information_consent),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (house_id, revision),
  FOREIGN KEY (introduction_asset_id, house_id) REFERENCES assets(id, house_id)
);
CREATE TABLE review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES admission_submissions(id),
  reviewer_account_id uuid NOT NULL REFERENCES accounts(id),
  kind text NOT NULL CHECK (kind IN ('creator_control', 'introduction')),
  outcome text NOT NULL CHECK (outcome IN ('approved', 'changes_requested', 'rejected')),
  method text NOT NULL CHECK (char_length(method) BETWEEN 1 AND 500),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, kind)
);

CREATE FUNCTION preserve_review_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Review evidence is append-only; submit a new revision';
END;
$$;
CREATE TRIGGER admission_evidence_immutable BEFORE UPDATE OR DELETE ON admission_submissions
  FOR EACH ROW EXECUTE FUNCTION preserve_review_evidence();
CREATE TRIGGER decisions_immutable BEFORE UPDATE OR DELETE ON review_decisions
  FOR EACH ROW EXECUTE FUNCTION preserve_review_evidence();

CREATE TABLE works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES houses(id),
  created_by uuid NOT NULL REFERENCES accounts(id),
  kind text NOT NULL DEFAULT 'video' CHECK (kind = 'video'),
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  video_asset_id uuid,
  thumbnail_asset_id uuid,
  captions_asset_id uuid,
  series_name text NOT NULL DEFAULT '' CHECK (char_length(series_name) <= 80),
  episode integer CHECK (episode BETWEEN 1 AND 999),
  publication text NOT NULL DEFAULT 'draft' CHECK (publication IN ('draft', 'published', 'unpublished')),
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (video_asset_id, house_id) REFERENCES assets(id, house_id),
  FOREIGN KEY (thumbnail_asset_id, house_id) REFERENCES assets(id, house_id),
  FOREIGN KEY (captions_asset_id, house_id) REFERENCES assets(id, house_id),
  CHECK (publication <> 'published' OR (char_length(trim(title)) > 0 AND video_asset_id IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX works_house_idx ON works(house_id, created_at);
CREATE TABLE follows (
  account_id uuid NOT NULL REFERENCES accounts(id),
  house_id uuid NOT NULL REFERENCES houses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, house_id)
);
CREATE INDEX follows_house_idx ON follows(house_id);
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES works(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  parent_id uuid,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, work_id),
  FOREIGN KEY (parent_id, work_id) REFERENCES comments(id, work_id),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX comments_work_idx ON comments(work_id, created_at, id);
