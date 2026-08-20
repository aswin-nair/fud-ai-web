-- Rotating refresh records for short-lived access tokens.
-- Legacy rows keep family_id = id and no refresh hash, so they cannot refresh
-- and the browser must sign in again.

ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS family_id UUID;
UPDATE auth_sessions SET family_id = id WHERE family_id IS NULL;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS previous_refresh_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_family
  ON auth_sessions (family_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_hash
  ON auth_sessions (refresh_token_hash)
  WHERE refresh_token_hash IS NOT NULL AND revoked_at IS NULL;
