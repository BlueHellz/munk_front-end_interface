CREATE TABLE viewer_appearance (
 account_id uuid PRIMARY KEY REFERENCES accounts(id),
 theme text NOT NULL CHECK(theme IN('dark','light')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Preserve explicit saved appearance choices independently of the selected skin.
INSERT INTO viewer_appearance(account_id,theme,updated_at)
 SELECT DISTINCT ON(d.account_id) d.account_id,v.design->>'defaultMode',v.updated_at
 FROM interface_designs d JOIN interface_design_versions v ON v.design_id=d.id
 WHERE d.account_id IS NOT NULL AND v.design->>'defaultMode' IN('dark','light')
 ORDER BY d.account_id,v.updated_at DESC;
