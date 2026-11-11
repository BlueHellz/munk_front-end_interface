-- Add stable browser-draft linkage to the existing works table; no old data reset.
ALTER TABLE works ADD COLUMN client_draft_id text CHECK (client_draft_id ~ '^[a-z0-9-]{1,80}$');
ALTER TABLE works ADD COLUMN upload_session_id uuid REFERENCES upload_sessions(id);
CREATE UNIQUE INDEX works_client_draft_idx ON works(house_id,created_by,client_draft_id) WHERE client_draft_id IS NOT NULL;
