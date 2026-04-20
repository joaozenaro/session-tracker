use chrono::{Months, NaiveDate, Utc};
use diesel::prelude::*;
use tauri::State;
use uuid::Uuid;

use super::blocking;
use crate::db::DbPool;
use crate::error::{AppError, CmdResult};
use crate::models::{
    Client, CreateSeriesPayload, ExtendSeriesPayload, NewSession, RecurrenceType, Session,
    SessionInsert, SessionSeries, SessionUpdate, SessionWithClient, SessionsByClientPayload,
    SessionsByClientResponse,
};
use crate::schema::{clients, session_series, sessions};

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

/// Helper to generate a sequence of sessions for a series.
fn generate_series_sessions(
    client_id: String,
    series_id: String,
    first_date: String,
    time: String,
    recurrence: &RecurrenceType,
    num_sessions: u32,
    initial_notes: Option<String>,
) -> CmdResult<Vec<NewSession>> {
    let mut sessions = Vec::with_capacity(num_sessions as usize);
    let mut current_date = first_date;
    let ts = now();

    for i in 0..num_sessions {
        sessions.push(NewSession {
            id: Uuid::new_v4().to_string(),
            client_id: client_id.clone(),
            session_date: current_date.clone(),
            session_time: time.clone(),
            notes: if i == 0 {
                initial_notes.clone().unwrap_or_default()
            } else {
                String::new()
            },
            series_id: Some(series_id.clone()),
            created_at: ts.clone(),
            updated_at: ts.clone(),
        });
        if i < num_sessions - 1 {
            current_date = advance_date(&current_date, recurrence)?;
        }
    }
    Ok(sessions)
}

// ── Queries ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_sessions(pool: State<'_, DbPool>) -> CmdResult<Vec<SessionWithClient>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let rows: Vec<(Session, Client)> = sessions::table
            .inner_join(clients::table)
            .order((sessions::session_date.desc(), sessions::session_time.asc()))
            .select((Session::as_select(), Client::as_select()))
            .load(conn)
            .map_err(AppError::from)?;

        Ok(rows
            .into_iter()
            .map(|(s, c)| SessionWithClient {
                id: s.id,
                client_id: s.client_id,
                session_date: s.session_date,
                session_time: s.session_time,
                notes: s.notes,
                series_id: s.series_id,
                created_at: s.created_at,
                updated_at: s.updated_at,
                client: c,
            })
            .collect())
    })
}

#[tauri::command]
pub async fn get_sessions_by_client(
    pool: State<'_, DbPool>,
    payload: SessionsByClientPayload,
) -> CmdResult<SessionsByClientResponse> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let mut query = sessions::table
            .filter(sessions::client_id.eq(&payload.client_id))
            .filter(sessions::session_date.lt(&payload.before_date))
            .order(sessions::session_date.desc())
            .limit(payload.limit)
            .select(Session::as_select())
            .into_boxed();

        if let Some(ref eid) = payload.exclude_id {
            query = query.filter(sessions::id.ne(eid));
        }

        let loaded_sessions = query.load(conn).map_err(AppError::from)?;

        let mut is_last_in_series = false;
        if let Some(ref eid) = payload.exclude_id {
            // Find the current session being edited
            if let Ok(current_session) = sessions::table.find(eid).first::<Session>(conn) {
                if let Some(ref sid) = current_session.series_id {
                    // Check if any other session in the same series is later
                    let count = sessions::table
                        .filter(sessions::series_id.eq(sid))
                        .filter(
                            sessions::session_date.gt(&current_session.session_date).or(
                                sessions::session_date
                                    .eq(&current_session.session_date)
                                    .and(sessions::session_time.gt(&current_session.session_time)),
                            ),
                        )
                        .count()
                        .get_result::<i64>(conn)
                        .unwrap_or(0);

                    is_last_in_series = count == 0;
                }
            }
        }

        Ok(SessionsByClientResponse {
            sessions: loaded_sessions,
            is_last_in_series,
        })
    })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn create_session(pool: State<'_, DbPool>, payload: SessionInsert) -> CmdResult<Session> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        let ts = now();
        let new = NewSession {
            id: Uuid::new_v4().to_string(),
            client_id: payload.client_id,
            session_date: payload.session_date,
            session_time: payload.session_time,
            notes: payload.notes,
            series_id: payload.series_id,
            created_at: ts.clone(),
            updated_at: ts,
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
            id: Uuid::new_v4().to_string(),
            client_id: payload.client_id.clone(),
            recurrence_type: payload.recurrence_type.as_str().to_owned(),
            created_at: now(),
        };

        let new_sessions = generate_series_sessions(
            payload.client_id,
            series.id.clone(),
            payload.start_date,
            payload.start_time,
            &payload.recurrence_type,
            payload.num_sessions,
            payload.notes,
        )?;

        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            diesel::insert_into(session_series::table)
                .values(&series)
                .execute(conn)?;

            diesel::insert_into(sessions::table)
                .values(&new_sessions)
                .execute(conn)?;

            Ok(series)
        })
        .map_err(AppError::from)
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

        let first_new_date = advance_date(&payload.from_date, &payload.recurrence_type)?;
        let new_sessions = generate_series_sessions(
            series.client_id,
            payload.series_id,
            first_new_date,
            payload.session_time,
            &payload.recurrence_type,
            payload.num_sessions,
            None,
        )?;

        diesel::insert_into(sessions::table)
            .values(&new_sessions)
            .execute(conn)
            .map(|_| ())
            .map_err(AppError::from)
    })
}
