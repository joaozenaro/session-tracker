// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn sum(nums: Vec<i32>) -> i32 {
    nums.iter().sum()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sum])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
