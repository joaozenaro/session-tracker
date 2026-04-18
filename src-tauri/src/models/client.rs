use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use crate::schema::clients;

// ── Queryable row ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = clients)]
pub struct Client {
    pub id:         String,
    pub name:       String,
    pub telephone:  String,
    pub created_at: String,
}

// ── Insertable row ────────────────────────────────────────────────────────────

#[derive(Debug, Insertable)]
#[diesel(table_name = clients)]
pub struct NewClient {
    pub id:         String,
    pub name:       String,
    pub telephone:  String,
    pub created_at: String,
}

// ── JS payloads ───────────────────────────────────────────────────────────────

/// Payload received from JS for `create_client`
#[derive(Debug, Deserialize)]
pub struct ClientInsert {
    pub name:      String,
    pub telephone: String,
}

/// Payload received from JS for `update_client`.
/// Uses `AsChangeset` so all optional fields are applied in a single atomic UPDATE.
#[derive(Debug, Deserialize, AsChangeset)]
#[diesel(table_name = clients)]
pub struct ClientUpdate {
    pub name:      Option<String>,
    pub telephone: Option<String>,
}
