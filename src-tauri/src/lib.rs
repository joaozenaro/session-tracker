mod commands;
mod db;
mod error;
mod models;
mod schema;
mod stt;

use commands::stt::{SttInner, SttState};
use db::setup_db;
use stt::engine::init_engine;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // On Linux/WSL, ALSA routes audio through PulseAudio.
    // Set PULSE_SERVER only if not already set so a user-provided value wins.
    #[cfg(target_os = "linux")]
    if std::env::var("PULSE_SERVER").is_err() {
        let wslg_socket = "/mnt/wslg/runtime-dir/pulse/native";
        if std::path::Path::new(wslg_socket).exists() {
            std::env::set_var("PULSE_SERVER", format!("unix:{wslg_socket}"));
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir)?;
            }
            let db_path = app_data_dir.join("app.db");
            let db_path_str = db_path
                .to_str()
                .expect("Database path should be valid UTF-8");

            let pool = setup_db(db_path_str).map_err(|e| e.to_string())?;
            app.manage(pool);

            // Initialise Whisper model (once, at startup).
            let model_path = if cfg!(debug_assertions) {
                // In dev mode, CARGO_MANIFEST_DIR is the src-tauri folder.
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("resources")
                    .join("ggml-small.bin")
            } else {
                // In production, the file is in the bundle's resource dir.
                // Since tauri.conf.json uses "resources/ggml-small.bin", the 
                // subdirectory is preserved inside the resource root.
                app.path().resource_dir()?
                    .join("resources")
                    .join("ggml-small.bin")
            };

            if !model_path.exists() {
                let err = format!("Whisper model not found at: {:?}", model_path);
                eprintln!("{}", err);
                return Err(err.into());
            }

            init_engine(&model_path).map_err(|e| e.to_string())?;

            // Manage shared STT state
            let stt_state: SttState = std::sync::Arc::new(
                std::sync::Mutex::new(SttInner::default()),
            );
            app.manage(stt_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clients::get_clients,
            commands::clients::get_client,
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
            commands::forms::get_templates,
            commands::forms::get_client_forms,
            commands::forms::create_template,
            commands::forms::create_client_form,
            commands::forms::copy_template_to_client,
            commands::forms::update_form,
            commands::forms::delete_form,
            commands::forms::get_form_questions,
            commands::forms::create_question,
            commands::forms::update_question,
            commands::forms::delete_question,
            commands::files::get_client_folder_path,
            commands::files::open_client_folder,
            commands::files::list_client_files,
            commands::files::rename_client_file,
            commands::files::delete_client_file,
            commands::files::read_client_file,
            commands::files::save_client_file,
            commands::files::copy_file_to_client,
            commands::stt::start_recording,
            commands::stt::stop_recording,
            commands::stt::list_microphones,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
