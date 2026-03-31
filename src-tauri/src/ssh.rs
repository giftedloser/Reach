use chrono::Local;
use rusqlite::{params, Connection as DbConnection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct SshConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: i64,
    pub username: Option<String>,
    pub tags_json: String,
    pub favorite: bool,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub last_used_at: Option<String>,
    pub credential_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSshPayload {
    pub name: String,
    pub host: String,
    pub port: i64,
    pub username: Option<String>,
    pub tags_json: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

#[tauri::command]
pub fn get_ssh_connections(app: AppHandle) -> Result<Vec<SshConnection>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, host, port, username, tags_json, favorite, icon, color, last_used_at, credential_id FROM ssh_connections ORDER BY last_used_at DESC, name ASC")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut connections = Vec::new();

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        connections.push(SshConnection {
            id: row.get(0).unwrap_or_default(),
            name: row.get(1).unwrap_or_default(),
            host: row.get(2).unwrap_or_default(),
            port: row.get(3).unwrap_or_default(),
            username: row.get(4).unwrap_or_default(),
            tags_json: row.get(5).unwrap_or_default(),
            favorite: row.get(6).unwrap_or_default(),
            icon: row.get(7).unwrap_or_default(),
            color: row.get(8).unwrap_or_default(),
            last_used_at: row.get(9).unwrap_or_default(),
            credential_id: row.get(10).unwrap_or_default(),
        });
    }

    Ok(connections)
}

#[tauri::command]
pub fn save_ssh_connection(app: AppHandle, payload: CreateSshPayload) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO ssh_connections (id, name, host, port, username, tags_json, icon, color, credential_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, payload.name, payload.host, payload.port, payload.username, payload.tags_json, payload.icon, payload.color, payload.credential_id],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn delete_ssh_connection(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM tab_assignments WHERE resource_id = ?1 AND resource_type = 'ssh'",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM ssh_connections WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSshPayload {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: i64,
    pub username: Option<String>,
    pub tags_json: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

#[tauri::command]
pub fn update_ssh_connection(app: AppHandle, payload: UpdateSshPayload) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE ssh_connections SET name=?1, host=?2, port=?3, username=?4, tags_json=?5, icon=?6, color=?7, credential_id=?8 WHERE id=?9",
        params![
            payload.name,
            payload.host,
            payload.port,
            payload.username,
            payload.tags_json,
            payload.icon,
            payload.color,
            payload.credential_id,
            payload.id
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn launch_ssh(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    // 1. Get Connection Details
    let mut stmt = conn
        .prepare("SELECT host, port, username, credential_id FROM ssh_connections WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;

    let (host, port, username, credential_id) =
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            (
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, i64>(1).unwrap_or(22),
                row.get::<_, Option<String>>(2).unwrap_or_default(),
                row.get::<_, Option<String>>(3).unwrap_or_default(),
            )
        } else {
            return Err("SSH Connection not found".to_string());
        };

    // 2. Resolve credential if assigned
    let resolved_cred = if let Some(ref cred_id) = credential_id {
        match crate::credentials::resolve_credential(&app, cred_id) {
            Ok(cred) => Some(cred),
            Err(e) => {
                eprintln!("Warning: Failed to resolve SSH credential: {}", e);
                None
            }
        }
    } else {
        None
    };

    // 3. Get PuTTY Path from Settings
    let mut stmt_settings = conn
        .prepare("SELECT value_json FROM settings WHERE key = 'putty_path'")
        .map_err(|e| e.to_string())?;
    let mut rows_settings = stmt_settings.query([]).map_err(|e| e.to_string())?;

    let putty_path = if let Some(row) = rows_settings.next().map_err(|e| e.to_string())? {
        let json_val: String = row.get(0).unwrap_or_default();
        serde_json::from_str::<String>(&json_val).unwrap_or_else(|_| "putty.exe".to_string())
    } else {
        "putty.exe".to_string()
    };

    // 4. Construct Command
    let mut cmd = std::process::Command::new(&putty_path);

    // Use credential username if resolved, otherwise connection username
    if let Some((ref cred_user, _)) = resolved_cred {
        if !cred_user.is_empty() {
            cmd.arg("-l").arg(cred_user);
        }
    } else if let Some(ref user) = username {
        if !user.is_empty() {
            cmd.arg("-l").arg(user);
        }
    }

    cmd.arg("-ssh").arg(&host).arg("-P").arg(port.to_string());

    // Pass password via -pw if credential resolved
    if let Some((_, ref cred_pass)) = resolved_cred {
        cmd.arg("-pw").arg(cred_pass);
    }

    // 5. Update Last Used
    let now = Local::now().to_rfc3339();
    conn.execute(
        "UPDATE ssh_connections SET last_used_at = ?1 WHERE id = ?2",
        params![now, id],
    )
    .ok();

    // 6. Spawn
    cmd.spawn()
        .map_err(|e| format!("Failed to launch PuTTY at '{}': {}", putty_path, e))?;

    Ok(())
}
