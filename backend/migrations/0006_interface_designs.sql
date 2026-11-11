-- Independent design revision numbers never mutate House admission/publication versions.
CREATE TABLE interface_designs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid REFERENCES accounts(id),
 house_id uuid REFERENCES houses(id),
 revision integer NOT NULL CHECK (revision>0),
 design jsonb NOT NULL CHECK (jsonb_typeof(design)='object'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((account_id IS NULL) <> (house_id IS NULL)),
 UNIQUE(account_id), UNIQUE(house_id)
);
CREATE TABLE interface_design_versions (
 design_id uuid NOT NULL REFERENCES interface_designs(id),
 revision integer NOT NULL CHECK (revision>0),
 design jsonb NOT NULL CHECK (jsonb_typeof(design)='object'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(design_id,revision)
);
