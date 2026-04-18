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
            let db_path = app.path().app_data_dir()?.join("app.db");
            let pool = setup_db(db_path.to_str().unwrap());
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
