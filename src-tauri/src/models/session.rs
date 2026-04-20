use crate::models::client::Client;
use crate::schema::{session_series, sessions};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

// ── RecurrenceType ────────────────────────────────────────────────────────────

/// Typed recurrence — replaces bare strings and eliminates runtime panics.
/// Serde mapping matches the frontend union: 'weekly' | 'biweekly' | 'monthly'.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecurrenceType {
    Weekly,
    Biweekly,
    Monthly,
}

impl RecurrenceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Weekly => "weekly",
            Self::Biweekly => "biweekly",
            Self::Monthly => "monthly",
        }
    }
}

// ── Session ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = sessions)]
pub struct Session {
    pub id: String,
    pub client_id: String,
    pub session_date: String,
    pub session_time: String,
    pub notes: String,
    pub series_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = sessions)]
pub struct NewSession {
    pub id: String,
    pub client_id: String,
    pub session_date: String,
    pub session_time: String,
    pub notes: String,
    pub series_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Payload received from JS for `create_session`
#[derive(Debug, Deserialize)]
pub struct SessionInsert {
    pub client_id: String,
    pub session_date: String,
    pub session_time: String,
    pub notes: String,
    pub series_id: Option<String>,
}

/// Payload received from JS for `update_session`.
/// `updated_at` is injected by the backend before the UPDATE is issued.
/// `series_id` uses `Option<Option<String>>` so `Some(None)` explicitly sets NULL.
#[derive(Debug, Deserialize, AsChangeset)]
#[diesel(table_name = sessions)]
pub struct SessionUpdate {
    pub client_id: Option<String>,
    pub session_date: Option<String>,
    pub session_time: Option<String>,
    pub notes: Option<String>,
    #[diesel(column_name = series_id)]
    pub series_id: Option<Option<String>>,
    pub updated_at: Option<String>,
}

/// Joined type returned by `get_sessions` — flat session fields + nested Client
#[derive(Debug, Serialize)]
pub struct SessionWithClient {
    pub id: String,
    pub client_id: String,
    pub session_date: String,
    pub session_time: String,
    pub notes: String,
    pub series_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub client: Client,
}

// ── SessionSeries ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable, Identifiable, Insertable)]
#[diesel(table_name = session_series)]
pub struct SessionSeries {
    pub id: String,
    pub client_id: String,
    pub recurrence_type: String,
    pub created_at: String,
}

// ── Series payloads ───────────────────────────────────────────────────────────

/// Payload received from JS for `create_session_series`
#[derive(Debug, Deserialize)]
pub struct CreateSeriesPayload {
    pub client_id: String,
    pub recurrence_type: RecurrenceType,
    pub start_date: String,
    pub start_time: String,
    pub num_sessions: u32,
    pub notes: Option<String>,
}

/// Payload received from JS for `extend_session_series`
#[derive(Debug, Deserialize)]
pub struct ExtendSeriesPayload {
    pub series_id: String,
    pub from_date: String,
    pub recurrence_type: RecurrenceType,
    pub num_sessions: u32,
    pub session_time: String,
}

/// Payload received from JS for `get_sessions_by_client`
#[derive(Debug, Deserialize)]
pub struct SessionsByClientPayload {
    pub client_id: String,
    pub before_date: String,
    pub exclude_id: Option<String>,
    pub limit: i64,
}

/// Response returned to JS for `get_sessions_by_client`
#[derive(Debug, Serialize)]
pub struct SessionsByClientResponse {
    pub sessions: Vec<Session>,
    pub is_last_in_series: bool,
}
