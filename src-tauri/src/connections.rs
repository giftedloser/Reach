use chrono::Local;
use rusqlite::{params, Connection as DbConnection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub host: String,
    pub username: Option<String>,
    pub tags_json: String, // stored as JSON string
    pub favorite: bool,
    pub gateway_json: Option<String>,
    pub rdp_options_json: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub last_used_at: Option<String>,
    pub credential_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateConnectionPayload {
    pub name: String,
    pub host: String,
    pub username: Option<String>,
    pub tags_json: String,
    pub gateway_json: Option<String>,
    pub rdp_options_json: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

// -- Commands --

#[tauri::command]
pub fn get_connections(app: AppHandle, search: Option<String>) -> Result<Vec<Connection>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt;
    let mut rows = if let Some(s) = search {
        let pattern = format!("%{}%", s);
        stmt = conn.prepare("SELECT id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id FROM connections WHERE name LIKE ?1 OR host LIKE ?1 OR tags_json LIKE ?1 ORDER BY last_used_at DESC, name ASC").map_err(|e| e.to_string())?;
        stmt.query(params![pattern]).map_err(|e| e.to_string())?
    } else {
        stmt = conn.prepare("SELECT id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id FROM connections ORDER BY last_used_at DESC, name ASC").map_err(|e| e.to_string())?;
        stmt.query([]).map_err(|e| e.to_string())?
    };

    let mut connections = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        connections.push(Connection {
            id: row.get(0).unwrap_or_default(),
            name: row.get(1).unwrap_or_default(),
            protocol: row.get(2).unwrap_or_default(),
            host: row.get(3).unwrap_or_default(),
            username: row.get(4).unwrap_or_default(),
            tags_json: row.get(5).unwrap_or_default(),
            favorite: row.get(6).unwrap_or_default(),
            gateway_json: row.get(7).unwrap_or_default(),
            rdp_options_json: row.get(8).unwrap_or_default(),
            icon: row.get(9).unwrap_or_default(),
            color: row.get(10).unwrap_or_default(),
            last_used_at: row.get(11).unwrap_or_default(),
            credential_id: row.get(12).unwrap_or_default(),
        });
    }

    Ok(connections)
}

#[tauri::command]
pub fn save_connection(app: AppHandle, payload: CreateConnectionPayload) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO connections (id, name, protocol, host, username, tags_json, gateway_json, rdp_options_json, icon, color, credential_id) VALUES (?1, ?2, 'RDP', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            payload.name,
            payload.host,
            payload.username,
            payload.tags_json,
            payload.gateway_json,
            payload.rdp_options_json,
            payload.icon,
            payload.color,
            payload.credential_id
        ],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateConnectionPayload {
    pub id: String,
    pub name: String,
    pub host: String,
    pub username: Option<String>,
    pub tags_json: String,
    pub gateway_json: Option<String>,
    pub rdp_options_json: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

#[tauri::command]
pub fn update_connection(app: AppHandle, payload: UpdateConnectionPayload) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE connections SET name=?1, host=?2, username=?3, tags_json=?4, gateway_json=?5, rdp_options_json=?6, icon=?7, color=?8, credential_id=?9 WHERE id=?10",
        params![
            payload.name,
            payload.host,
            payload.username,
            payload.tags_json,
            payload.gateway_json,
            payload.rdp_options_json,
            payload.icon,
            payload.color,
            payload.credential_id,
            payload.id
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_connection(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM connections WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn launch_rdp(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let rdp_dir = app_dir.join("rdp");
    if !rdp_dir.exists() {
        std::fs::create_dir_all(&rdp_dir).map_err(|e| e.to_string())?;
    }

    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    // Fetch Connection
    let mut stmt = conn
        .prepare(
            "SELECT host, username, gateway_json, rdp_options_json, credential_id FROM connections WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;

    let (host, username, gateway_json, rdp_options_json, credential_id) =
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            (
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, Option<String>>(1).unwrap_or_default(),
                row.get::<_, Option<String>>(2).unwrap_or_default(),
                row.get::<_, Option<String>>(3).unwrap_or_default(),
                row.get::<_, Option<String>>(4).unwrap_or_default(),
            )
        } else {
            return Err("Connection not found".to_string());
        };

    // Resolve credential if assigned
    let resolved_cred = if let Some(ref cred_id) = credential_id {
        match crate::credentials::resolve_credential(&app, cred_id) {
            Ok(cred) => Some(cred),
            Err(e) => {
                eprintln!("Warning: Failed to resolve credential: {}", e);
                None
            }
        }
    } else {
        None
    };

    // If we have a resolved credential, set TERMSRV/{host} for auto-login
    if let Some((ref cred_user, ref cred_pass)) = resolved_cred {
        crate::credentials::set_termsrv_credential(&host, cred_user, cred_pass)?;
    }

    // Generate RDP Content
    let mut rdp_content = String::new();
    rdp_content.push_str(&format!("full address:s:{}\n", host));

    // Use credential username if resolved, otherwise fall back to connection username
    if let Some((ref cred_user, _)) = resolved_cred {
        rdp_content.push_str(&format!("username:s:{}\n", cred_user));
    } else if let Some(ref user) = username {
        rdp_content.push_str(&format!("username:s:{}\n", user));
    }

    // RDP options
    if let Some(opt_str) = rdp_options_json {
        if let Ok(opts) = serde_json::from_str::<serde_json::Value>(&opt_str) {
            if let Some(screen_mode) = opts.get("screen_mode").and_then(|v| v.as_i64()) {
                rdp_content.push_str(&format!("screen mode id:i:{}\n", screen_mode));
            }
            if let Some(multimon) = opts.get("use_multimon").and_then(|v| v.as_bool()) {
                rdp_content.push_str(&format!(
                    "use multimon:i:{}\n",
                    if multimon { 1 } else { 0 }
                ));
            }
        }
    }

    // Gateway logic
    if let Some(gw_str) = gateway_json {
        if let Ok(gw) = serde_json::from_str::<serde_json::Value>(&gw_str) {
            if let Some(hostname) = gw.get("hostname").and_then(|v| v.as_str()) {
                rdp_content.push_str(&format!("gatewayhostname:s:{}\n", hostname));
                rdp_content.push_str("gatewayusagemethod:i:1\n");
                rdp_content.push_str("gatewayprofileusagemethod:i:1\n");
            }
        }
    }

    // Standard defaults — skip credential prompt if we have a resolved credential
    if resolved_cred.is_some() {
        rdp_content.push_str("prompt for credentials:i:0\n");
    } else {
        rdp_content.push_str("prompt for credentials:i:1\n");
    }
    rdp_content.push_str("authentication level:i:2\n");
    rdp_content.push_str("redirectclipboard:i:1\n");

    // Write to file
    let rdp_file_path = rdp_dir.join(format!("{}.rdp", id));
    std::fs::write(&rdp_file_path, rdp_content).map_err(|e| e.to_string())?;

    // Update last_used_at
    let now = Local::now().to_rfc3339();
    conn.execute(
        "UPDATE connections SET last_used_at = ?1 WHERE id = ?2",
        params![now, id],
    )
    .ok();

    // Spawn mstsc
    std::process::Command::new("mstsc")
        .arg(rdp_file_path)
        .spawn()
        .map_err(|e| format!("Failed to launch mstsc: {}", e))?;

    Ok(())
}
