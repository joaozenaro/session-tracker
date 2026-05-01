use std::fs;
use tauri::{AppHandle, Manager};
use crate::error::{AppError, CmdResult};
use chrono::Local;

#[tauri::command]
pub fn get_client_folder_path(app: AppHandle, folder_name: String) -> CmdResult<String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    if !client_folder.exists() {
        fs::create_dir_all(&client_folder)?;
    }
    
    Ok(client_folder.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn open_client_folder(app: AppHandle, folder_name: String) -> CmdResult<()> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    if !client_folder.exists() {
        fs::create_dir_all(&client_folder)?;
    }
    
    let path = client_folder.to_string_lossy().into_owned();
    
    if std::env::var("WSL_DISTRO_NAME").is_ok() {
        let win_path = std::process::Command::new("wslpath")
            .arg("-w")
            .arg(&path)
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or(path.clone());

        std::process::Command::new("explorer.exe")
            .arg(win_path)
            .spawn()
            .map_err(|e| AppError::Io(e.to_string()))?;
    } else {
        tauri_plugin_opener::open_path(path, None::<String>)
            .map_err(|e| AppError::Io(e.to_string()))?;
    }
    
    Ok(())
}

#[tauri::command]
pub fn list_client_files(app: AppHandle, folder_name: String) -> CmdResult<Vec<String>> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    if !client_folder.exists() {
        return Ok(Vec::new());
    }
    
    let mut files = Vec::new();
    for entry in fs::read_dir(client_folder)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                files.push(name.to_string());
            }
        }
    }
    
    Ok(files)
}

#[tauri::command]
pub fn rename_client_file(app: AppHandle, folder_name: String, old_name: String, new_name: String) -> CmdResult<()> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    let old_path = client_folder.join(old_name);
    let new_path = client_folder.join(new_name);
    
    fs::rename(old_path, new_path)?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_client_file(app: AppHandle, folder_name: String, name: String) -> CmdResult<()> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    let path = client_folder.join(name);
    if path.exists() {
        fs::remove_file(path)?;
    }
    
    Ok(())
}

#[tauri::command]
pub fn read_client_file(app: AppHandle, folder_name: String, name: String) -> CmdResult<Vec<u8>> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    let path = client_folder.join(name);
    
    let bytes = fs::read(path)?;
    Ok(bytes)
}

#[tauri::command]
pub fn copy_file_to_client(app: AppHandle, folder_name: String, path: String, locale: String) -> CmdResult<()> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    if !client_folder.exists() {
        fs::create_dir_all(&client_folder)?;
    }
    
    let source_path = std::path::Path::new(&path);
    let stem = source_path.file_stem().unwrap_or_default().to_string_lossy();
    let extension = source_path.extension().unwrap_or_default().to_string_lossy();
    
    let now = Local::now();
    let date_suffix = if locale == "pt" {
        now.format("%d-%m-%Y").to_string()
    } else {
        now.format("%m-%d-%Y").to_string()
    };
    
    let new_file_name = format!("{}-{}.{}", stem, date_suffix, extension);
    let dest_path = client_folder.join(new_file_name);
    
    fs::copy(source_path, dest_path)?;
    
    Ok(())
}

#[tauri::command]
pub fn save_client_file(app: AppHandle, folder_name: String, name: String, data: Vec<u8>, locale: String) -> CmdResult<()> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Io(e.to_string()))?;
    let client_folder = app_data_dir.join("client_files").join(&folder_name);
    
    if !client_folder.exists() {
        fs::create_dir_all(&client_folder)?;
    }
    
    let source_path = std::path::Path::new(&name);
    let stem = source_path.file_stem().unwrap_or_default().to_string_lossy();
    let extension = source_path.extension().unwrap_or_default().to_string_lossy();
    
    let now = Local::now();
    let date_suffix = if locale == "pt" {
        now.format("%d-%m-%Y").to_string()
    } else {
        now.format("%m-%d-%Y").to_string()
    };
    
    let new_file_name = format!("{}-{}.{}", stem, date_suffix, extension);
    let path = client_folder.join(new_file_name);
    fs::write(path, data)?;
    
    Ok(())
}
