use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager, CustomizeConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub type DbPool = r2d2::Pool<ConnectionManager<SqliteConnection>>;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

/// Applied to every connection the pool creates — ensures FK enforcement and
/// WAL mode are always active, not just on the initial migration connection.
#[derive(Debug)]
struct SqliteCustomizer;

impl CustomizeConnection<SqliteConnection, diesel::r2d2::Error> for SqliteCustomizer {
    fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), diesel::r2d2::Error> {
        diesel::sql_query("PRAGMA foreign_keys = ON;")
            .execute(conn)
            .ok();
        diesel::sql_query("PRAGMA journal_mode = WAL;")
            .execute(conn)
            .ok();
        Ok(())
    }
}

pub fn setup_db(db_path: &str) -> Result<DbPool, Box<dyn std::error::Error>> {
    let manager = ConnectionManager::<SqliteConnection>::new(db_path);
    let pool = r2d2::Pool::builder()
        .max_size(5)
        .connection_customizer(Box::new(SqliteCustomizer))
        .build(manager)?;

    // Run pending migrations at startup (embedded at compile time)
    let mut conn = pool.get()?;
    conn.run_pending_migrations(MIGRATIONS)
        .map_err(|e| format!("Migration error: {}", e))?;

    Ok(pool)
}
