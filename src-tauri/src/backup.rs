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
    pub ssh_connections: Vec<crate::ssh::SshConnection>,
    pub tabs: Vec<crate::tabs::Tab>,
    pub tab_assignments: Vec<crate::tabs::TabAssignment>,
    pub settings: Vec<SettingEntry>,
    #[serde(default)]
    pub restore_mode: RestoreMode,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct SettingEntry {
    pub key: String,
    pub value_json: String,
}

#[derive(Clone, Copy, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum RestoreMode {
    #[default]
    Merge,
    Replace,
}

pub(crate) fn collect_backup(conn: &Connection) -> Result<Backup, String> {
    // Fetch Connections
    let mut stmt = conn.prepare("SELECT id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id FROM connections ORDER BY id ASC").map_err(|e| e.to_string())?;
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
    let mut stmt = conn.prepare("SELECT id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id FROM apps ORDER BY id ASC").map_err(|e| e.to_string())?;
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

    // Fetch SSH Connections
    let mut stmt = conn.prepare("SELECT id, name, host, port, username, tags_json, favorite, icon, color, last_used_at, credential_id FROM ssh_connections ORDER BY id ASC").map_err(|e| e.to_string())?;
    let ssh_iter = stmt
        .query_map([], |row| {
            Ok(crate::ssh::SshConnection {
                id: row.get(0)?,
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get(3)?,
                username: row.get(4)?,
                tags_json: row.get(5)?,
                favorite: row.get(6)?,
                icon: row.get(7)?,
                color: row.get(8)?,
                last_used_at: row.get(9)?,
                credential_id: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let ssh_connections: Result<Vec<_>, _> = ssh_iter.collect();
    let ssh_connections = ssh_connections.map_err(|e| e.to_string())?;

    // Fetch Tabs
    let mut stmt = conn
        .prepare("SELECT id, name, icon, color FROM active_tabs ORDER BY id ASC")
        .map_err(|e| e.to_string())?;
    let tab_iter = stmt
        .query_map([], |row| {
            Ok(crate::tabs::Tab {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let tabs: Result<Vec<_>, _> = tab_iter.collect();
    let tabs = tabs.map_err(|e| e.to_string())?;

    // Fetch Tab Assignments
    let mut stmt = conn
        .prepare("SELECT tab_id, resource_id, resource_type FROM tab_assignments ORDER BY tab_id ASC, resource_type ASC, resource_id ASC")
        .map_err(|e| e.to_string())?;
    let assignment_iter = stmt
        .query_map([], |row| {
            Ok(crate::tabs::TabAssignment {
                tab_id: row.get(0)?,
                resource_id: row.get(1)?,
                resource_type: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let tab_assignments: Result<Vec<_>, _> = assignment_iter.collect();
    let tab_assignments = tab_assignments.map_err(|e| e.to_string())?;

    // Fetch Settings
    let mut stmt = conn
        .prepare("SELECT key, value_json FROM settings ORDER BY key ASC")
        .map_err(|e| e.to_string())?;
    let settings_iter = stmt
        .query_map([], |row| {
            Ok(SettingEntry {
                key: row.get(0)?,
                value_json: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let settings: Result<Vec<_>, _> = settings_iter.collect();
    let settings = settings.map_err(|e| e.to_string())?;

    Ok(Backup {
        connections,
        apps,
        ssh_connections,
        tabs,
        tab_assignments,
        settings,
        restore_mode: RestoreMode::Merge,
        timestamp: chrono::Local::now().to_rfc3339(),
    })
}

pub(crate) fn restore_backup(conn: &mut Connection, backup: Backup) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let replace_existing = matches!(backup.restore_mode, RestoreMode::Replace);

    if replace_existing {
        tx.execute("DELETE FROM tab_assignments", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM active_tabs", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM ssh_connections", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM apps", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM connections", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM settings", [])
            .map_err(|e| e.to_string())?;
    }

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

    for s in backup.ssh_connections {
        tx.execute(
            "INSERT OR REPLACE INTO ssh_connections (id, name, host, port, username, tags_json, favorite, icon, color, last_used_at, credential_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![s.id, s.name, s.host, s.port, s.username, s.tags_json, s.favorite, s.icon, s.color, s.last_used_at, s.credential_id],
        ).map_err(|e| e.to_string())?;
    }

    for tab in backup.tabs {
        tx.execute(
            "INSERT OR REPLACE INTO active_tabs (id, name, icon, color) VALUES (?1, ?2, ?3, ?4)",
            params![tab.id, tab.name, tab.icon, tab.color],
        )
        .map_err(|e| e.to_string())?;
    }

    for assignment in backup.tab_assignments {
        tx.execute(
            "INSERT OR REPLACE INTO tab_assignments (tab_id, resource_id, resource_type) VALUES (?1, ?2, ?3)",
            params![assignment.tab_id, assignment.resource_id, assignment.resource_type],
        )
        .map_err(|e| e.to_string())?;
    }

    for setting in backup.settings {
        tx.execute(
            "INSERT OR REPLACE INTO settings (key, value_json) VALUES (?1, ?2)",
            params![setting.key, setting.value_json],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn export_data(app: AppHandle, path: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let backup = collect_backup(&conn)?;
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
    restore_backup(&mut conn, backup)
}

#[cfg(test)]
mod tests {
    use super::{collect_backup, restore_backup, Backup, RestoreMode};
    use crate::db::init_conn;
    use rusqlite::{params, Connection};
    use serde_json::Value;

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        init_conn(&conn).unwrap();
        conn
    }

    fn seed_db(conn: &Connection) {
        conn.execute(
            "INSERT INTO connections (id, name, protocol, host, username, tags_json, favorite, gateway_json, rdp_options_json, icon, color, last_used_at, credential_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                "conn-1",
                "Primary RDP",
                "RDP",
                "rdp.internal",
                "DOMAIN\\alice",
                "[\"prod\"]",
                true,
                "{\"mode\":\"designated\"}",
                "{\"screen_mode\":2}",
                "monitor",
                "#f97316",
                "2025-01-01T00:00:00Z",
                "cred-1"
            ],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO apps (id, name, exe_path, working_dir, args, run_as_admin, tags_json, favorite, icon, color, last_used_at, credential_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                "app-1",
                "Admin Tool",
                "C:\\Tools\\admin.exe",
                "C:\\Tools",
                "--host rdp.internal",
                true,
                "[\"ops\"]",
                false,
                "command",
                "#3b82f6",
                "2025-01-02T00:00:00Z",
                Option::<String>::None
            ],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO ssh_connections (id, name, host, port, username, tags_json, favorite, icon, color, last_used_at, credential_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                "ssh-1",
                "SSH Prod",
                "ssh.internal",
                2222,
                "root",
                "[\"linux\"]",
                true,
                "terminal",
                "#10b981",
                "2025-01-03T00:00:00Z",
                "cred-2"
            ],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO active_tabs (id, name, icon, color) VALUES (?1, ?2, ?3, ?4)",
            params!["tab-1", "Production", "folder", "#ffcc00"],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO tab_assignments (tab_id, resource_id, resource_type) VALUES (?1, ?2, ?3)",
            params!["tab-1", "conn-1", "rdp"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO tab_assignments (tab_id, resource_id, resource_type) VALUES (?1, ?2, ?3)",
            params!["tab-1", "ssh-1", "ssh"],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO settings (key, value_json) VALUES (?1, ?2)",
            params![
                "putty_path",
                "\"C:\\\\Program Files\\\\PuTTY\\\\putty.exe\""
            ],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO settings (key, value_json) VALUES (?1, ?2)",
            params!["rd_gateway", "{\"hostname\":\"gateway.internal\"}"],
        )
        .unwrap();
    }

    #[test]
    fn backup_round_trip_preserves_all_persisted_tables() {
        let source = setup_db();
        seed_db(&source);

        let backup = collect_backup(&source).unwrap();
        let mut restored = setup_db();
        restore_backup(&mut restored, backup).unwrap();

        let mut original_json = serde_json::to_value(collect_backup(&source).unwrap()).unwrap();
        let mut restored_json = serde_json::to_value(collect_backup(&restored).unwrap()).unwrap();

        original_json["timestamp"] = Value::Null;
        restored_json["timestamp"] = Value::Null;

        assert_eq!(original_json, restored_json);
    }

    #[test]
    fn backup_includes_ssh_tabs_assignments_and_settings() {
        let conn = setup_db();
        seed_db(&conn);

        let backup = collect_backup(&conn).unwrap();

        assert_eq!(backup.ssh_connections.len(), 1);
        assert_eq!(backup.tabs.len(), 1);
        assert_eq!(backup.tab_assignments.len(), 2);
        assert_eq!(backup.settings.len(), 2);
    }

    #[test]
    fn restore_backup_replace_mode_clears_stale_rows() {
        let source = setup_db();
        seed_db(&source);
        let mut backup = collect_backup(&source).unwrap();
        backup.restore_mode = RestoreMode::Replace;

        let mut restored = setup_db();
        seed_db(&restored);
        restored
            .execute(
                "INSERT INTO connections (id, name, protocol, host, username, tags_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params!["stale-conn", "Stale", "RDP", "stale.internal", Option::<String>::None, "[]"],
            )
            .unwrap();
        restored
            .execute(
                "INSERT INTO settings (key, value_json) VALUES (?1, ?2)",
                params!["stale_setting", "\"stale\""],
            )
            .unwrap();

        restore_backup(&mut restored, backup).unwrap();

        let stale_conn_count: i64 = restored
            .query_row(
                "SELECT COUNT(*) FROM connections WHERE id = 'stale-conn'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        let stale_setting_count: i64 = restored
            .query_row(
                "SELECT COUNT(*) FROM settings WHERE key = 'stale_setting'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(stale_conn_count, 0);
        assert_eq!(stale_setting_count, 0);
    }

    #[test]
    fn import_defaults_to_merge_when_restore_mode_missing() {
        let legacy_backup = serde_json::json!({
            "connections": [],
            "apps": [],
            "ssh_connections": [],
            "tabs": [],
            "tab_assignments": [],
            "settings": [],
            "timestamp": "2025-01-01T00:00:00Z"
        });

        let parsed: Backup = serde_json::from_value(legacy_backup).unwrap();

        assert!(matches!(parsed.restore_mode, RestoreMode::Merge));
    }
}
