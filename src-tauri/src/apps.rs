use chrono::Local;
use rusqlite::{params, Connection as DbConnection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct App {
    pub id: String,
    pub name: String,
    pub exe_path: String,
    pub working_dir: Option<String>,
    pub args: Option<String>,
    pub run_as_admin: bool,
    pub tags_json: String,
    pub favorite: bool,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub last_used_at: Option<String>,
    pub credential_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAppPayload {
    pub name: String,
    pub exe_path: String,
    pub working_dir: Option<String>,
    pub args: Option<String>,
    pub run_as_admin: bool,
    pub tags_json: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

#[tauri::command]
pub fn get_apps(app: AppHandle, search: Option<String>) -> Result<Vec<App>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt;
    let mut rows = if let Some(s) = search {
        let pattern = format!("%{}%", s);
        stmt = conn.prepare("SELECT id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id FROM apps WHERE name LIKE ?1 OR exe_path LIKE ?1 OR tags_json LIKE ?1 ORDER BY last_used_at DESC, name ASC").map_err(|e| e.to_string())?;
        stmt.query(params![pattern]).map_err(|e| e.to_string())?
    } else {
        stmt = conn.prepare("SELECT id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id FROM apps ORDER BY last_used_at DESC, name ASC").map_err(|e| e.to_string())?;
        stmt.query([]).map_err(|e| e.to_string())?
    };

    let mut apps = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        apps.push(App {
            id: row.get(0).unwrap_or_default(),
            name: row.get(1).unwrap_or_default(),
            exe_path: row.get(2).unwrap_or_default(),
            working_dir: row.get(3).unwrap_or_default(),
            args: row.get(4).unwrap_or_default(),
            run_as_admin: row.get(5).unwrap_or_default(),
            tags_json: row.get(6).unwrap_or_default(),
            favorite: row.get(7).unwrap_or_default(),
            icon: row.get(8).unwrap_or_default(),
            color: row.get(9).unwrap_or_default(),
            last_used_at: row.get(10).unwrap_or_default(),
            credential_id: row.get(11).unwrap_or_default(),
        });
    }

    Ok(apps)
}

#[tauri::command]
pub fn save_app(app: AppHandle, payload: CreateAppPayload) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO apps (id, name, exe_path, working_dir, args, run_as_admin, tags_json, icon, color, credential_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            payload.name,
            payload.exe_path,
            payload.working_dir,
            payload.args,
            payload.run_as_admin,
            payload.tags_json,
            payload.icon,
            payload.color,
            payload.credential_id
        ],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAppPayload {
    pub id: String,
    pub name: String,
    pub exe_path: String,
    pub working_dir: Option<String>,
    pub args: Option<String>,
    pub run_as_admin: bool,
    pub tags_json: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credential_id: Option<String>,
}

#[tauri::command]
pub fn update_app(app: AppHandle, payload: UpdateAppPayload) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE apps SET name=?1, exe_path=?2, working_dir=?3, args=?4, run_as_admin=?5, tags_json=?6, icon=?7, color=?8, credential_id=?9 WHERE id=?10",
        params![
            payload.name,
            payload.exe_path,
            payload.working_dir,
            payload.args,
            payload.run_as_admin,
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
pub fn delete_app(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM apps WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Parse "full address:s:hostname" from an .rdp file to extract the target host.
fn parse_rdp_host(rdp_path: &str) -> Option<String> {
    if let Ok(content) = std::fs::read_to_string(rdp_path) {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.to_lowercase().starts_with("full address:s:") {
                let host = trimmed.splitn(2, ":s:").nth(1)?.trim().to_string();
                if !host.is_empty() {
                    // Strip port if present (e.g., "host:3389")
                    return Some(host.split(':').next().unwrap_or(&host).to_string());
                }
            }
        }
    }
    None
}

#[tauri::command]
pub fn launch_app(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    // Fetch App
    let mut stmt = conn
        .prepare("SELECT exe_path, working_dir, args, run_as_admin, credential_id FROM apps WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;

    let (exe_path, working_dir, args, run_as_admin, credential_id) =
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            (
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, Option<String>>(1).unwrap_or_default(),
                row.get::<_, Option<String>>(2).unwrap_or_default(),
                row.get::<_, bool>(3).unwrap_or_default(),
                row.get::<_, Option<String>>(4).unwrap_or_default(),
            )
        } else {
            return Err("App not found".to_string());
        };

    // Update last_used_at
    let now = Local::now().to_rfc3339();
    conn.execute(
        "UPDATE apps SET last_used_at = ?1 WHERE id = ?2",
        params![now, id],
    )
    .ok();

    // Resolve credential if assigned
    let resolved_cred = if let Some(ref cred_id) = credential_id {
        match crate::credentials::resolve_credential(&app, cred_id) {
            Ok(cred) => Some(cred),
            Err(e) => {
                eprintln!("Warning: Failed to resolve app credential: {}", e);
                None
            }
        }
    } else {
        None
    };

    let path_lower = exe_path.to_lowercase();
    let is_url = path_lower.starts_with("http://") || path_lower.starts_with("https://");

    // For .rdp files with credentials, set TERMSRV before launching
    if path_lower.ends_with(".rdp") {
        if let Some((ref cred_user, ref cred_pass)) = resolved_cred {
            if let Some(rdp_host) = parse_rdp_host(&exe_path) {
                crate::credentials::set_termsrv_credential(&rdp_host, cred_user, cred_pass)?;
            }
        }
    }

    if run_as_admin {
        let mut ps_cmd = format!("Start-Process -FilePath \"{}\"", exe_path);

        if let Some(arg_str) = args {
            let escaped_args = arg_str.replace("\"", "`\"");
            ps_cmd.push_str(&format!(" -ArgumentList \"{}\"", escaped_args));
        }

        if let Some(wd) = working_dir {
            let escaped_wd = wd.replace("\"", "`\"");
            ps_cmd.push_str(&format!(" -WorkingDirectory \"{}\"", escaped_wd));
        }

        ps_cmd.push_str(" -Verb RunAs");

        std::process::Command::new("powershell")
            .args(&["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps_cmd])
            .spawn()
            .map_err(|e| format!("Failed to elevate app: {}", e))?;

        return Ok(());
    }

    // Standard Launch Strategies (Non-Admin)
    if is_url || path_lower.ends_with(".lnk") {
        let mut cmd = std::process::Command::new("cmd");
        cmd.args(&["/c", "start", "", &exe_path]);

        if !is_url {
            if let Some(wd) = working_dir {
                cmd.current_dir(wd);
            }
        }

        cmd.spawn()
            .map_err(|e| format!("Failed to launch shell item: {}", e))?;
    } else if path_lower.ends_with(".rdp") {
        let mut cmd = std::process::Command::new("mstsc");
        cmd.arg(&exe_path);
        if let Some(wd) = working_dir {
            cmd.current_dir(wd);
        }
        cmd.spawn()
            .map_err(|e| format!("Failed to launch RDP file: {}", e))?;
    } else if path_lower.ends_with(".ps1") {
        let mut cmd = std::process::Command::new("powershell");
        cmd.arg("-ExecutionPolicy");
        cmd.arg("Bypass");
        cmd.arg("-File");
        cmd.arg(&exe_path);

        if let Some(arg_str) = args {
            for part in arg_str.split_whitespace() {
                cmd.arg(part);
            }
        }

        if let Some(wd) = working_dir {
            cmd.current_dir(wd);
        }

        cmd.spawn()
            .map_err(|e| format!("Failed to launch PowerShell script: {}", e))?;
    } else if path_lower.ends_with(".bat") || path_lower.ends_with(".cmd") {
        let mut cmd = std::process::Command::new("cmd");
        cmd.arg("/c");
        cmd.arg(&exe_path);

        if let Some(arg_str) = args {
            for part in arg_str.split_whitespace() {
                cmd.arg(part);
            }
        }

        if let Some(wd) = working_dir {
            cmd.current_dir(wd);
        }

        cmd.spawn()
            .map_err(|e| format!("Failed to launch batch script: {}", e))?;
    } else {
        let mut cmd = std::process::Command::new(&exe_path);

        if let Some(arg_str) = args {
            for part in arg_str.split_whitespace() {
                cmd.arg(part);
            }
        }

        if let Some(wd) = working_dir {
            cmd.current_dir(wd);
        }

        cmd.spawn()
            .map_err(|e| format!("Failed to launch executable: {}", e))?;
    }

    Ok(())
}
