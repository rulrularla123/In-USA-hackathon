-- Travel Planner — Initial Schema
-- Supabase Dashboard → SQL Editor 에서 실행하세요

-- ── trips ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_name        TEXT        NOT NULL,
  country_of_stay  TEXT        NOT NULL,
  total_days       INTEGER     NOT NULL DEFAULT 3 CHECK (total_days BETWEEN 1 AND 14),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── place_cart ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS place_cart (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id       TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  address        TEXT        NOT NULL DEFAULT '',
  lat            FLOAT       NOT NULL,
  lng            FLOAT       NOT NULL,
  stay_duration  INTEGER     NOT NULL DEFAULT 60 CHECK (stay_duration BETWEEN 15 AND 720),
  priority       TEXT        NOT NULL DEFAULT 'Normal'
                             CHECK (priority IN ('Meal', 'Favorite', 'Normal')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, place_id)
);

-- ── itineraries ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day                   INTEGER     NOT NULL DEFAULT 1 CHECK (day >= 1),
  start_time            TEXT        NOT NULL,
  end_time              TEXT        NOT NULL,
  is_optimized          BOOLEAN     NOT NULL DEFAULT FALSE,
  over_schedule_minutes INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, day)
);

-- ── itinerary_items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_items (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id       UUID        NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  place_id           TEXT        NOT NULL,
  name               TEXT        NOT NULL,
  address            TEXT        NOT NULL DEFAULT '',
  lat                FLOAT       NOT NULL,
  lng                FLOAT       NOT NULL,
  arrival_time       INTEGER     NOT NULL,
  departure_time     INTEGER     NOT NULL,
  stay_duration      INTEGER     NOT NULL,
  driving_time       INTEGER     NOT NULL DEFAULT 0,
  order_index        INTEGER     NOT NULL,
  priority           TEXT        NOT NULL DEFAULT 'Normal'
                                 CHECK (priority IN ('Meal', 'Favorite', 'Normal')),
  notes              TEXT,
  is_manual_override BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
