pub mod clients;
pub mod sessions;
pub mod forms;
pub mod files;
pub mod stt;


/// Run a Diesel closure on a blocking thread-pool thread.
///
/// Required because `SqliteConnection` is not `Send`. Every Tauri command that
/// touches the DB must wrap its work in this macro (or `tokio::task::spawn_blocking`
/// directly). Defined here once so both `clients.rs` and `sessions.rs` share it.
macro_rules! blocking {
    ($pool:expr, $closure:expr) => {{
        let pool = $pool.clone();
        tokio::task::spawn_blocking(move || {
            let mut conn = pool.get().map_err(crate::error::AppError::from)?;
            $closure(&mut conn)
        })
        .await
        .map_err(|e| crate::error::AppError::Database(e.to_string()))?
    }};
}

pub(crate) use blocking;
