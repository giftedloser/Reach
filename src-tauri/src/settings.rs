use rusqlite::{params, Connection as DbConnection, Result};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn get_setting(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT value_json FROM settings WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).unwrap_or_default();
        // Return raw JSON string (frontend decodes)
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn save_setting(app: AppHandle, key: String, value_json: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO settings (key, value_json) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value_json = ?2",
        params![key, value_json],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
