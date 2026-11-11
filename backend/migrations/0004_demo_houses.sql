-- Separate from strict admission/publication; existing rows are unchanged.
ALTER TABLE houses ADD COLUMN demo_ready boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION protect_house_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.founder_account_id <> OLD.founder_account_id OR
    (NEW.address <> OLD.address AND NOT (OLD.demo_ready AND NEW.demo_ready))) THEN
    RAISE EXCEPTION 'House founder and address are immutable';
  END IF;
  IF EXISTS (SELECT 1 FROM reserved_house_addresses WHERE address = NEW.address) THEN
    RAISE EXCEPTION 'House address is reserved' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;
