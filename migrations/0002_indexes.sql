CREATE INDEX IF NOT EXISTS idx_votes_category_tool ON votes(category_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_votes_category_anon ON votes(category_id, anon_hash);
CREATE INDEX IF NOT EXISTS idx_vote_events_anon_tool_created ON vote_events(anon_hash, tool_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vote_events_tool_created ON vote_events(tool_id, created_at);
