CREATE TABLE IF NOT EXISTS tools (
  tool_id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  category_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  anon_hash TEXT NOT NULL,
  vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tool_id, anon_hash)
);

CREATE TABLE IF NOT EXISTS vote_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  anon_hash TEXT NOT NULL,
  requested_vote INTEGER NOT NULL CHECK (requested_vote IN (1, -1)),
  created_at INTEGER NOT NULL
);
