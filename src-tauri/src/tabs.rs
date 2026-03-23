use rusqlite::{params, Connection as DbConnection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Tab {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TabAssignment {
    pub tab_id: String,
    pub resource_id: String,
    pub resource_type: String, // "app", "rdp", "ssh", "rd_feed"
}

#[tauri::command]
pub fn get_tabs(app: AppHandle) -> Result<Vec<Tab>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, icon, color FROM active_tabs ORDER BY name ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Tab {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tabs = Vec::new();
    for row in rows {
        tabs.push(row.map_err(|e| e.to_string())?);
    }

    Ok(tabs)
}

#[tauri::command]
pub fn create_tab(
    app: AppHandle,
    name: String,
    icon: Option<String>,
    color: Option<String>,
) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO active_tabs (id, name, icon, color) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, icon, color],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn update_tab(
    app: AppHandle,
    id: String,
    name: String,
    icon: Option<String>,
    color: Option<String>,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE active_tabs SET name = ?2, icon = ?3, color = ?4 WHERE id = ?1",
        params![id, name, icon, color],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_tab(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM active_tabs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn assign_to_tab(
    app: AppHandle,
    tab_id: String,
    resource_id: String,
    resource_type: String,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR IGNORE INTO tab_assignments (tab_id, resource_id, resource_type) VALUES (?1, ?2, ?3)",
        params![tab_id, resource_id, resource_type],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn remove_from_tab(app: AppHandle, tab_id: String, resource_id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM tab_assignments WHERE tab_id = ?1 AND resource_id = ?2",
        params![tab_id, resource_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_tab_assignments(app: AppHandle, tab_id: String) -> Result<Vec<TabAssignment>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT tab_id, resource_id, resource_type FROM tab_assignments WHERE tab_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![tab_id], |row| {
            Ok(TabAssignment {
                tab_id: row.get(0)?,
                resource_id: row.get(1)?,
                resource_type: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut assignments = Vec::new();
    for row in rows {
        assignments.push(row.map_err(|e| e.to_string())?);
    }

    Ok(assignments)
}

#[tauri::command]
pub fn get_resource_tab_assignments(
    app: AppHandle,
    resource_id: String,
) -> Result<Vec<String>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT tab_id FROM tab_assignments WHERE resource_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![resource_id], |row| Ok(row.get::<_, String>(0)?))
        .map_err(|e| e.to_string())?;

    let mut tab_ids = Vec::new();
    for row in rows {
        tab_ids.push(row.map_err(|e| e.to_string())?);
    }

    Ok(tab_ids)
}
