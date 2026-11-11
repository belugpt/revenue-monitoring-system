CREATE TABLE IF NOT EXISTS businesses (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 name TEXT NOT NULL,
 data TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS businesses_owner_idx ON businesses(owner_id);
