use diesel::prelude::*;
use tauri::State;
use uuid::Uuid;
use chrono::{Months, NaiveDate, Utc};

use crate::db::DbPool;
use crate::error::{AppError, CmdResult};
use crate::models::{
    Client, CreateSeriesPayload, ExtendSeriesPayload, NewSession, RecurrenceType, Session,
    SessionInsert, SessionSeries, SessionUpdate, SessionWithClient,
};
use crate::schema::{clients, session_series, sessions};
use super::blocking;

// ── Helpers ───────────────────────────────────────────────────────────────────

fn now() -> String {
    Utc::now().to_rfc3339()
}

/// Advance a YYYY-MM-DD date string by one recurrence period.
/// Returns `Err(Validation)` instead of panicking on bad input.
fn advance_date(date_str: &str, rec: &RecurrenceType) -> CmdResult<String> {
    let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .map_err(|e| AppError::Validation(format!("invalid date '{date_str}': {e}")))?;
    let next = match rec {
        RecurrenceType::Weekly => date + chrono::Duration::days(7),
        RecurrenceType::Biweekly => date + chrono::Duration::days(14),
        RecurrenceType::Monthly => date
            .checked_add_months(Months::new(1))
            .ok_or_else(|| AppError::Validation("date overflow adding one month".into()))?,
    };
    Ok(next.format("%Y-%m-%d").to_string())
}

// ── Queries ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_sessions(pool: State<'_, DbPool>) -> CmdResult<Vec<SessionWithClient>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let rows: Vec<(Session, Client)> = sessions::table
            .inner_join(clients::table)
            .order((
                sessions::session_date.desc(),
                sessions::session_time.asc(),
            ))
            .select((Session::as_select(), Client::as_select()))
            .load(conn)
            .map_err(AppError::from)?;

        Ok(rows
            .into_iter()
            .map(|(s, c)| SessionWithClient {
                id:           s.id,
                client_id:    s.client_id,
                session_date: s.session_date,
                session_time: s.session_time,
                notes:        s.notes,
                series_id:    s.series_id,
                created_at:   s.created_at,
                updated_at:   s.updated_at,
                client:       c,
            })
            .collect())
    })
}

#[tauri::command]
pub async fn get_sessions_by_client(
    pool: State<'_, DbPool>,
    client_id: String,
    before_date: String,
    exclude_id: Option<String>,
    limit: i64,
) -> CmdResult<Vec<Session>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let mut query = sessions::table
            .filter(sessions::client_id.eq(&client_id))
            .filter(sessions::session_date.lt(&before_date))
            .order(sessions::session_date.desc())
            .limit(limit)
            .select(Session::as_select())
            .into_boxed();

        if let Some(ref eid) = exclude_id {
            query = query.filter(sessions::id.ne(eid));
        }

        query.load(conn).map_err(AppError::from)
    })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn create_session(
    pool: State<'_, DbPool>,
    payload: SessionInsert,
) -> CmdResult<Session> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let ts = now();
        let new = NewSession {
            id:           Uuid::new_v4().to_string(),
            client_id:    payload.client_id,
            session_date: payload.session_date,
            session_time: payload.session_time,
            notes:        payload.notes,
            series_id:    payload.series_id,
            created_at:   ts.clone(),
            updated_at:   ts,
        };
        diesel::insert_into(sessions::table)
            .values(&new)
            .execute(conn)
            .map_err(AppError::from)?;
        sessions::table
            .find(&new.id)
            .select(Session::as_select())
            .first(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn update_session(
    pool: State<'_, DbPool>,
    id: String,
    payload: SessionUpdate,
) -> CmdResult<Session> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        // Inject server-side timestamp before applying the changeset
        let mut changeset = payload;
        changeset.updated_at = Some(now());

        diesel::update(sessions::table.find(&id))
            .set(&changeset)
            .execute(conn)
            .map_err(AppError::from)?;
        sessions::table
            .find(&id)
            .select(Session::as_select())
            .first(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn delete_session(pool: State<'_, DbPool>, id: String) -> CmdResult<()> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        diesel::delete(sessions::table.find(&id))
            .execute(conn)
            .map(|_| ())
            .map_err(AppError::from)
    })
}

// ── Series ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn create_session_series(
    pool: State<'_, DbPool>,
    payload: CreateSeriesPayload,
) -> CmdResult<SessionSeries> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let series = SessionSeries {
            id:              Uuid::new_v4().to_string(),
            client_id:       payload.client_id.clone(),
            recurrence_type: payload.recurrence_type.as_str().to_owned(),
            created_at:      now(),
        };
        diesel::insert_into(session_series::table)
            .values(&series)
            .execute(conn)
            .map_err(AppError::from)?;

        let mut current_date = payload.start_date.clone();
        for i in 0..payload.num_sessions {
            let ts = now();
            let new = NewSession {
                id:           Uuid::new_v4().to_string(),
                client_id:    payload.client_id.clone(),
                session_date: current_date.clone(),
                session_time: payload.start_time.clone(),
                notes: if i == 0 {
                    payload.notes.clone().unwrap_or_default()
                } else {
                    String::new()
                },
                series_id:  Some(series.id.clone()),
                created_at: ts.clone(),
                updated_at: ts,
            };
            diesel::insert_into(sessions::table)
                .values(&new)
                .execute(conn)
                .map_err(AppError::from)?;
            current_date = advance_date(&current_date, &payload.recurrence_type)?;
        }

        Ok(series)
    })
}

#[tauri::command]
pub async fn extend_session_series(
    pool: State<'_, DbPool>,
    payload: ExtendSeriesPayload,
) -> CmdResult<()> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let series: SessionSeries = session_series::table
            .find(&payload.series_id)
            .select(SessionSeries::as_select())
            .first(conn)
            .map_err(AppError::from)?;

        let mut current_date = advance_date(&payload.from_date, &payload.recurrence_type)?;
        for _ in 0..payload.num_sessions {
            let ts = now();
            let new = NewSession {
                id:           Uuid::new_v4().to_string(),
                client_id:    series.client_id.clone(),
                session_date: current_date.clone(),
                session_time: payload.session_time.clone(),
                notes:        String::new(),
                series_id:    Some(payload.series_id.clone()),
                created_at:   ts.clone(),
                updated_at:   ts,
            };
            diesel::insert_into(sessions::table)
                .values(&new)
                .execute(conn)
                .map_err(AppError::from)?;
            current_date = advance_date(&current_date, &payload.recurrence_type)?;
        }
        Ok(())
    })
}
