-- Fud AI Web — Neon Postgres schema
-- Run once in Neon SQL Editor or: npm run db:migrate (from web/)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  picture TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('email', 'google')),
  password_hash TEXT,
  password_salt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_states (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS state_mutations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutation_id UUID NOT NULL,
  request_hash CHAR(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  resulting_version BIGINT NOT NULL CHECK (resulting_version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, mutation_id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

-- Token-bucket keys are HMACs. Raw IP addresses and account identifiers are
-- never persisted in the limiter table.
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_hash CHAR(64) PRIMARY KEY CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
  tokens DOUBLE PRECISION NOT NULL CHECK (tokens >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_states ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- BYOK credentials are device-local. Remove any keys written by releases that
-- embedded them in AppState before cloud sync enforced the secret boundary.
UPDATE user_states
SET state = state #- '{aiSettings,apiKey}'::text[],
    version = version + 1,
    updated_at = NOW()
WHERE state #> '{aiSettings,apiKey}'::text[] IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
  ON auth_sessions (user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_state_mutations_created_at ON state_mutations (created_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_updated ON rate_limit_buckets (updated_at);

-- Serialize writes for one user, then either replay the recorded result or
-- atomically advance state and record the mutation. A mutation UUID may never
-- be reused with a different base version or payload hash.
CREATE OR REPLACE FUNCTION save_user_state_idempotent(
  p_user_id UUID,
  p_state JSONB,
  p_base_version BIGINT,
  p_mutation_id UUID,
  p_request_hash TEXT
)
RETURNS TABLE (outcome TEXT, resulting_version BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  existing_hash TEXT;
  existing_version BIGINT;
  next_version BIGINT;
BEGIN
  IF p_base_version < 0 OR p_request_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN QUERY SELECT 'version_conflict'::TEXT, NULL::BIGINT;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

  SELECT request_hash, state_mutations.resulting_version
  INTO existing_hash, existing_version
  FROM state_mutations
  WHERE user_id = p_user_id AND mutation_id = p_mutation_id;

  IF FOUND THEN
    IF existing_hash = p_request_hash THEN
      RETURN QUERY SELECT 'replayed'::TEXT, existing_version;
    ELSE
      RETURN QUERY SELECT 'mutation_conflict'::TEXT, existing_version;
    END IF;
    RETURN;
  END IF;

  UPDATE user_states
  SET state = p_state,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND version = p_base_version
  RETURNING version INTO next_version;

  IF next_version IS NULL AND p_base_version = 0 THEN
    INSERT INTO user_states (user_id, state, version, updated_at)
    VALUES (p_user_id, p_state, 1, NOW())
    ON CONFLICT (user_id) DO NOTHING
    RETURNING version INTO next_version;
  END IF;

  IF next_version IS NULL THEN
    RETURN QUERY SELECT 'version_conflict'::TEXT, NULL::BIGINT;
    RETURN;
  END IF;

  INSERT INTO state_mutations (
    user_id,
    mutation_id,
    request_hash,
    resulting_version
  ) VALUES (
    p_user_id,
    p_mutation_id,
    p_request_hash,
    next_version
  );

  RETURN QUERY SELECT 'saved'::TEXT, next_version;
END;
$$;
