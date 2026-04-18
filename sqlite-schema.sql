-- SQLite schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_series (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sessions ADD COLUMN series_id TEXT REFERENCES session_series(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sessions_client_date_idx ON sessions(client_id, session_date DESC);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions(session_date);
CREATE INDEX IF NOT EXISTS sessions_series_id_idx ON sessions(series_id);
CREATE INDEX IF NOT EXISTS session_series_client_idx ON session_series(client_id);

INSERT INTO clients (name, telephone) VALUES
  ('Sarah Johnson', '+1 (555) 234-5678'),
  ('Michael Chen', '+1 (555) 345-6789'),
  ('Emily Rodriguez', '+1 (555) 456-7890');
