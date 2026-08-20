-- Phase 4 additive entity store. Snapshot writes remain authoritative until
-- staging parity evidence exists. These tables are empty in the first cloud
-- beta unless entity projection is explicitly enabled.
CREATE TABLE IF NOT EXISTS account_entities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'profile', 'food_entry', 'weight_entry', 'exercise_entry',
    'favorite_meal', 'chat_message'
  )),
  entity_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  local_date CHAR(10) CHECK (local_date IS NULL OR local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  time_zone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  record_version BIGINT NOT NULL DEFAULT 1 CHECK (record_version > 0),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, entity_type, entity_id),
  CONSTRAINT account_entities_calendar_required CHECK (
    entity_type IN ('profile', 'favorite_meal') OR local_date IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS entity_tombstones (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL,
  record_version BIGINT NOT NULL CHECK (record_version > 0),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS device_cursors (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  cursor BIGINT NOT NULL DEFAULT 0 CHECK (cursor >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS entity_mutations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutation_id UUID NOT NULL,
  request_hash CHAR(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  resulting_cursor BIGINT NOT NULL CHECK (resulting_cursor > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, mutation_id)
);

CREATE TABLE IF NOT EXISTS migration_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('web-state-v0', 'mobile-sqlite-0000')),
  source_version TEXT NOT NULL,
  device_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'detected', 'previewed', 'uploading', 'reconciling',
    'complete', 'confirmed', 'rolled_back', 'failed'
  )),
  discovered_count INTEGER NOT NULL DEFAULT 0 CHECK (discovered_count >= 0),
  accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  reconciled_count INTEGER NOT NULL DEFAULT 0 CHECK (reconciled_count >= 0),
  source_checksum CHAR(64) CHECK (source_checksum IS NULL OR source_checksum ~ '^[0-9a-f]{64}$'),
  accepted_checksum CHAR(64) CHECK (accepted_checksum IS NULL OR accepted_checksum ~ '^[0-9a-f]{64}$'),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  rollback_expires_at TIMESTAMPTZ,
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_account_entities_user_date
  ON account_entities (user_id, local_date)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entity_mutations_created
  ON entity_mutations (created_at);
CREATE INDEX IF NOT EXISTS idx_migration_attempts_user
  ON migration_attempts (user_id, last_attempt_at);

CREATE OR REPLACE FUNCTION apply_entity_mutation(
  p_user_id UUID,
  p_mutation_id UUID,
  p_request_hash TEXT,
  p_kind TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_device_id TEXT,
  p_local_date CHAR(10),
  p_time_zone TEXT,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ,
  p_deleted_at TIMESTAMPTZ,
  p_record_version BIGINT,
  p_payload JSONB
)
RETURNS TABLE (outcome TEXT, resulting_cursor BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  existing_hash TEXT;
  existing_cursor BIGINT;
  next_cursor BIGINT;
BEGIN
  IF p_request_hash !~ '^[0-9a-f]{64}$' OR p_kind NOT IN ('upsert', 'delete') THEN
    RETURN QUERY SELECT 'version_conflict'::TEXT, NULL::BIGINT;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT || ':entity', 0));

  SELECT request_hash, entity_mutations.resulting_cursor
  INTO existing_hash, existing_cursor
  FROM entity_mutations
  WHERE user_id = p_user_id AND mutation_id = p_mutation_id;

  IF FOUND THEN
    IF existing_hash = p_request_hash THEN
      RETURN QUERY SELECT 'replayed'::TEXT, existing_cursor;
    ELSE
      RETURN QUERY SELECT 'mutation_conflict'::TEXT, existing_cursor;
    END IF;
    RETURN;
  END IF;

  INSERT INTO device_cursors (user_id, device_id, cursor, updated_at)
  VALUES (p_user_id, p_device_id, 1, NOW())
  ON CONFLICT (user_id, device_id) DO UPDATE
  SET cursor = device_cursors.cursor + 1,
      updated_at = NOW()
  RETURNING cursor INTO next_cursor;

  IF p_kind = 'delete' THEN
    UPDATE account_entities
    SET deleted_at = COALESCE(p_deleted_at, NOW()),
        updated_at = COALESCE(p_updated_at, NOW()),
        record_version = GREATEST(account_entities.record_version, p_record_version),
        payload = '{}'::jsonb
    WHERE user_id = p_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;

    INSERT INTO entity_tombstones (
      user_id, entity_type, entity_id, device_id, deleted_at, record_version
    ) VALUES (
      p_user_id, p_entity_type, p_entity_id, p_device_id,
      COALESCE(p_deleted_at, NOW()), p_record_version
    )
    ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE
    SET deleted_at = EXCLUDED.deleted_at,
        device_id = EXCLUDED.device_id,
        record_version = GREATEST(entity_tombstones.record_version, EXCLUDED.record_version);
  ELSE
    INSERT INTO account_entities (
      user_id, entity_type, entity_id, device_id, local_date, time_zone,
      created_at, updated_at, deleted_at, record_version, payload
    ) VALUES (
      p_user_id, p_entity_type, p_entity_id, p_device_id, p_local_date, p_time_zone,
      p_created_at, p_updated_at, p_deleted_at, p_record_version, p_payload
    )
    ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE
    SET device_id = EXCLUDED.device_id,
        local_date = EXCLUDED.local_date,
        time_zone = EXCLUDED.time_zone,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at,
        record_version = EXCLUDED.record_version,
        payload = EXCLUDED.payload;
  END IF;

  INSERT INTO entity_mutations (
    user_id, mutation_id, request_hash, resulting_cursor
  ) VALUES (
    p_user_id, p_mutation_id, p_request_hash, next_cursor
  );

  RETURN QUERY SELECT 'saved'::TEXT, next_cursor;
END;
$$;
