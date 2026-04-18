-- Initial schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT NOT NULL PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  telephone  TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS session_series (
  id               TEXT NOT NULL PRIMARY KEY,
  client_id        TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recurrence_type  TEXT NOT NULL CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT NOT NULL PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  series_id    TEXT REFERENCES session_series(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS sessions_client_date_idx ON sessions(client_id, session_date DESC);
CREATE INDEX IF NOT EXISTS sessions_date_idx         ON sessions(session_date);
CREATE INDEX IF NOT EXISTS sessions_series_id_idx    ON sessions(series_id);
CREATE INDEX IF NOT EXISTS session_series_client_idx ON session_series(client_id);
