use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::command;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct Backup {
    pub connections: Vec<crate::connections::Connection>,
    pub apps: Vec<crate::apps::App>,
    pub timestamp: String,
}

#[command]
pub fn export_data(app: AppHandle, path: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Fetch Connections
    let mut stmt = conn.prepare("SELECT id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id FROM connections").map_err(|e| e.to_string())?;
    let conn_iter = stmt
        .query_map([], |row| {
            Ok(crate::connections::Connection {
                id: row.get(0)?,
                name: row.get(1)?,
                protocol: row.get(2)?,
                host: row.get(3)?,
                username: row.get(4)?,
                tags_json: row.get(5)?,
                favorite: row.get(6)?,
                gateway_json: row.get(7)?,
                rdp_options_json: row.get(8)?,
                icon: row.get(9)?,
                color: row.get(10)?,
                last_used_at: row.get(11)?,
                credential_id: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let connections: Result<Vec<_>, _> = conn_iter.collect();
    let connections = connections.map_err(|e| e.to_string())?;

    // Fetch Apps
    let mut stmt = conn.prepare("SELECT id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id FROM apps").map_err(|e| e.to_string())?;
    let app_iter = stmt
        .query_map([], |row| {
            Ok(crate::apps::App {
                id: row.get(0)?,
                name: row.get(1)?,
                exe_path: row.get(2)?,
                working_dir: row.get(3)?,
                args: row.get(4)?,
                run_as_admin: row.get(5)?,
                tags_json: row.get(6)?,
                favorite: row.get(7)?,
                icon: row.get(8)?,
                color: row.get(9)?,
                last_used_at: row.get(10)?,
                credential_id: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let apps: Result<Vec<_>, _> = app_iter.collect();
    let apps = apps.map_err(|e| e.to_string())?;

    let backup = Backup {
        connections,
        apps,
        timestamp: chrono::Local::now().to_rfc3339(),
    };

    let json = serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn import_data(app: AppHandle, path: String) -> Result<(), String> {
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let backup: Backup = serde_json::from_str(&json).map_err(|e| e.to_string())?;

    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for c in backup.connections {
        tx.execute(
            "INSERT OR REPLACE INTO connections (id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![c.id, c.name, c.protocol, c.host, c.username, c.tags_json, c.favorite, c.gateway_json, c.rdp_options_json, c.icon, c.color, c.last_used_at, c.credential_id],
        ).map_err(|e| e.to_string())?;
    }

    for a in backup.apps {
        tx.execute(
             "INSERT OR REPLACE INTO apps (id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
              params![a.id, a.name, a.exe_path, a.working_dir, a.args, a.run_as_admin, a.tags_json, a.favorite, a.icon, a.color, a.last_used_at, a.credential_id]
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
