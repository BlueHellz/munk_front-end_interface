-- A new migration preserves 0001's existing history/checksum.
CREATE TABLE reserved_house_addresses (address text PRIMARY KEY);
INSERT INTO reserved_house_addresses (address) VALUES
  ('home'), ('board'), ('creator'), ('create'), ('admin'), ('api'),
  ('off-grid'), ('the-margin'), ('field-notes'), ('signal-hill'),
  ('kiln-and-clay'), ('night-observatory'), ('glasshouse'), ('thread-and-tide'),
  ('blue-note-room'), ('paper-orbit'), ('supper-club'), ('tiny-machines'),
  ('wild-atlas'), ('brick-by-brick'), ('salt-and-sail'), ('small-stage'),
  ('afterimage'), ('moss-and-myth'), ('slow-mile'), ('letterpress');

CREATE FUNCTION protect_house_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.founder_account_id <> OLD.founder_account_id OR NEW.address <> OLD.address) THEN
    RAISE EXCEPTION 'House founder and address are immutable';
  END IF;
  IF EXISTS (SELECT 1 FROM reserved_house_addresses WHERE address = NEW.address) THEN
    RAISE EXCEPTION 'House address is reserved' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER houses_identity_guard BEFORE INSERT OR UPDATE ON houses
  FOR EACH ROW EXECUTE FUNCTION protect_house_identity();

-- A receive lease prevents an interrupted request from owning an upload forever.
ALTER TABLE upload_sessions ADD COLUMN receive_token uuid;
ALTER TABLE upload_sessions ADD COLUMN receive_until timestamptz;
ALTER TABLE upload_sessions ADD CONSTRAINT receive_lease_pair CHECK ((receive_token IS NULL) = (receive_until IS NULL));

-- Idempotency is scoped to the authenticated actor and operation, never to a supplied author.
CREATE TABLE creation_requests (
  account_id uuid NOT NULL REFERENCES accounts(id),
  request_key uuid NOT NULL,
  operation text NOT NULL,
  fingerprint text NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, operation, request_key)
);
