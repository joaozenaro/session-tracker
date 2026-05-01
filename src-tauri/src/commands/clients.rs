use diesel::prelude::*;
use std::collections::HashMap;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::db::DbPool;
use crate::error::{AppError, CmdResult};
use crate::models::{Client, ClientInsert, ClientUpdate, NewClient};
use crate::schema::clients;
use super::blocking;

// ── Queries ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_clients(pool: State<'_, DbPool>) -> CmdResult<Vec<Client>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        clients::table
            .order(clients::name.asc())
            .select(Client::as_select())
            .load(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn get_client(pool: State<'_, DbPool>, id: String) -> CmdResult<Client> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        clients::table
            .find(id)
            .select(Client::as_select())
            .first(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn get_session_counts(pool: State<'_, DbPool>) -> CmdResult<HashMap<String, u32>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        #[derive(QueryableByName)]
        struct Row {
            #[diesel(sql_type = diesel::sql_types::Text)]
            client_id: String,
            #[diesel(sql_type = diesel::sql_types::BigInt)]
            count: i64,
        }

        let rows = diesel::sql_query(
            "SELECT client_id, COUNT(*) as count FROM sessions GROUP BY client_id",
        )
        .load::<Row>(conn)
        .map_err(AppError::from)?;

        Ok(rows
            .into_iter()
            .map(|r| (r.client_id, r.count as u32))
            .collect())
    })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn create_client(pool: State<'_, DbPool>, payload: ClientInsert) -> CmdResult<Client> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let id = Uuid::new_v4();
        // Generate a random hue (0-359)
        let hue = (id.as_bytes()[0] as u32 * 360) / 256;
        let color = format!("hsl({}, 80%, 70%)", hue);
        
        let mut folder_name = payload.name.to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace())
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join("_");
            
        if folder_name.is_empty() {
            folder_name = "client".into();
        }
        
        let base_folder_name = folder_name.clone();
        let mut counter = 1;
        
        loop {
            let exists: bool = clients::table
                .filter(clients::folder_name.eq(&folder_name))
                .count()
                .get_result::<i64>(conn)
                .map(|count| count > 0)
                .unwrap_or(false);
                
            if !exists {
                break;
            }
            
            folder_name = format!("{}_{}", base_folder_name, counter);
            counter += 1;
        }

        let new = NewClient {
            id:          id.to_string(),
            name:        payload.name,
            telephone:   payload.telephone,
            created_at:  Utc::now().to_rfc3339(),
            plan:        String::new(),
            medications: String::new(),
            color,
            folder_name,
        };
        diesel::insert_into(clients::table)
            .values(&new)
            .execute(conn)
            .map_err(AppError::from)?;
        clients::table
            .find(&new.id)
            .select(Client::as_select())
            .first(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn update_client(
    pool: State<'_, DbPool>,
    id: String,
    payload: ClientUpdate,
) -> CmdResult<Client> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        diesel::update(clients::table.find(&id))
            .set(&payload)
            .execute(conn)
            .map_err(AppError::from)?;
        clients::table
            .find(&id)
            .select(Client::as_select())
            .first(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn delete_client(pool: State<'_, DbPool>, id: String) -> CmdResult<()> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        diesel::delete(clients::table.find(&id))
            .execute(conn)
            .map(|_| ())
            .map_err(AppError::from)
    })
}
