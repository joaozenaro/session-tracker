mod commands;
mod db;
mod error;
mod models;
mod schema;

use db::setup_db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir)?;
            }
            let db_path = app_data_dir.join("app.db");
            let db_path_str = db_path.to_str().expect("Database path should be valid UTF-8");

            let pool = setup_db(db_path_str)
                .map_err(|e| e.to_string())?;

            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clients::get_clients,
            commands::clients::create_client,
            commands::clients::update_client,
            commands::clients::delete_client,
            commands::clients::get_session_counts,
            commands::sessions::get_sessions,
            commands::sessions::get_sessions_by_client,
            commands::sessions::create_session,
            commands::sessions::update_session,
            commands::sessions::delete_session,
            commands::sessions::create_session_series,
            commands::sessions::extend_session_series,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
