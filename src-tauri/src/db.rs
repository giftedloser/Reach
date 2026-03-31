use rusqlite::{Connection, Result};
use std::fs;
use tauri::{AppHandle, Manager};

pub(crate) const INIT_SQL: &str = "
CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    protocol TEXT NOT NULL,
    host TEXT NOT NULL,
    username TEXT,
    tags_json TEXT,
    favorite BOOLEAN DEFAULT 0,
    gateway_json TEXT,
    rdp_options_json TEXT,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exe_path TEXT NOT NULL,
    working_dir TEXT,
    args TEXT,
    run_as_admin BOOLEAN DEFAULT 0,
    tags_json TEXT,
    favorite BOOLEAN DEFAULT 0,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT
);

CREATE TABLE IF NOT EXISTS ssh_connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT,
    tags_json TEXT,
    favorite BOOLEAN DEFAULT 0,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS active_tabs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tab_assignments (
    tab_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tab_id, resource_id, resource_type),
    FOREIGN KEY(tab_id) REFERENCES active_tabs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stored_credentials (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
";

pub(crate) fn init_conn(conn: &Connection) -> Result<()> {
    conn.execute_batch(INIT_SQL)?;

    // Migration: Add icon and color columns to resource tables
    let _ = conn.execute("ALTER TABLE connections ADD COLUMN icon TEXT", []);
    let _ = conn.execute("ALTER TABLE connections ADD COLUMN color TEXT", []);
    let _ = conn.execute("ALTER TABLE apps ADD COLUMN icon TEXT", []);
    let _ = conn.execute("ALTER TABLE apps ADD COLUMN color TEXT", []);
    let _ = conn.execute("ALTER TABLE ssh_connections ADD COLUMN icon TEXT", []);
    let _ = conn.execute("ALTER TABLE ssh_connections ADD COLUMN color TEXT", []);
    let _ = conn.execute("ALTER TABLE active_tabs ADD COLUMN icon TEXT", []);
    let _ = conn.execute("ALTER TABLE active_tabs ADD COLUMN color TEXT", []);

    // Migration: Add credential_id columns
    let _ = conn.execute("ALTER TABLE connections ADD COLUMN credential_id TEXT", []);
    let _ = conn.execute(
        "ALTER TABLE ssh_connections ADD COLUMN credential_id TEXT",
        [],
    );
    let _ = conn.execute("ALTER TABLE apps ADD COLUMN credential_id TEXT", []);

    Ok(())
}

pub fn init_db(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");

    // Ensure directory exists
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    let db_path = app_dir.join("database.sqlite");
    let conn = Connection::open(db_path)?;
    init_conn(&conn)?;

    Ok(())
}
