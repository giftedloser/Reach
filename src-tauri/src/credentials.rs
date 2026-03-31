use rusqlite::{params, Connection as DbConnection};
use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const CREATE_NO_WINDOW: u32 = 0x08000000;

// -- Models --

#[derive(Debug, Serialize, Deserialize)]
pub struct StoredCredential {
    pub id: String,
    pub label: String,
    pub username: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCredentialPayload {
    pub label: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCredentialPayload {
    pub id: String,
    pub label: String,
    pub username: String,
    pub password: Option<String>, // None = keep existing password
}

// -- OS Credential Helpers --

fn credential_target(id: &str) -> String {
    format!("REACH/{}", id)
}

fn os_save_password(id: &str, user: &str, pass: &str) -> Result<(), String> {
    let target = credential_target(id);
    let output = Command::new("cmdkey")
        .arg(format!("/generic:{}", target))
        .arg(format!("/user:{}", user))
        .arg(format!("/pass:{}", pass))
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to save credential to OS store: {}", err));
    }
    Ok(())
}

fn os_delete_password(id: &str) -> Result<(), String> {
    let target = credential_target(id);
    let output = Command::new("cmdkey")
        .arg(format!("/delete:{}", target))
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        if !err.contains("Element not found") {
            return Err(format!(
                "Failed to delete credential from OS store: {}",
                err
            ));
        }
    }
    Ok(())
}

fn os_get_password(id: &str) -> Result<Option<String>, String> {
    // cmdkey doesn't expose passwords directly. We use PowerShell + CredRead via
    // the .NET CredentialManager or a simpler approach: store/retrieve via cmdkey
    // and use advapi32 CredRead. For simplicity, we use PowerShell with
    // System.Runtime.InteropServices to call CredRead.
    let target = credential_target(id);
    let ps_script = format!(
        r#"
Add-Type -Namespace Advapi32 -Name Cred -MemberDefinition '
[DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
public static extern bool CredReadW(string target, int type, int flags, out IntPtr credential);
[DllImport("advapi32.dll")]
public static extern void CredFree(IntPtr buffer);
[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
public struct CREDENTIAL {{
    public int Flags;
    public int Type;
    public string TargetName;
    public string Comment;
    public long LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
}}
'
$ptr = [IntPtr]::Zero
$result = [Advapi32.Cred]::CredReadW("{target}", 1, 0, [ref]$ptr)
if ($result) {{
    $cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [Type][Advapi32.Cred+CREDENTIAL])
    if ($cred.CredentialBlobSize -gt 0) {{
        $bytes = [byte[]]::new($cred.CredentialBlobSize)
        [System.Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
        [System.Text.Encoding]::Unicode.GetString($bytes)
    }}
    [Advapi32.Cred]::CredFree($ptr)
}}
"#
    );

    let output = Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &ps_script,
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to read credential from OS store: {}", e))?;

    if !output.status.success() {
        // Credential may not exist
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if stdout.is_empty() {
        Ok(None)
    } else {
        Ok(Some(stdout))
    }
}

/// Sets a TERMSRV/{host} credential in Windows Credential Manager for RDP auto-login.
pub fn set_termsrv_credential(host: &str, username: &str, password: &str) -> Result<(), String> {
    let target = format!("TERMSRV/{}", host);
    let output = Command::new("cmdkey")
        .arg(format!("/generic:{}", target))
        .arg(format!("/user:{}", username))
        .arg(format!("/pass:{}", password))
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to set TERMSRV credential: {}", err));
    }
    Ok(())
}

/// Resolves a credential_id to (username, password) for launch flows.
pub fn resolve_credential(
    app: &AppHandle,
    credential_id: &str,
) -> Result<(String, String), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT username FROM stored_credentials WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![credential_id])
        .map_err(|e| e.to_string())?;

    let username = if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        row.get::<_, String>(0).unwrap_or_default()
    } else {
        return Err("Credential not found".to_string());
    };

    let password = os_get_password(credential_id)?
        .ok_or_else(|| "Password not found in OS credential store".to_string())?;

    Ok((username, password))
}

// -- Tauri Commands: Stored Credentials --

#[tauri::command]
pub fn list_stored_credentials(app: AppHandle) -> Result<Vec<StoredCredential>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, label, username, created_at FROM stored_credentials ORDER BY label ASC",
        )
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut creds = Vec::new();

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        creds.push(StoredCredential {
            id: row.get(0).unwrap_or_default(),
            label: row.get(1).unwrap_or_default(),
            username: row.get(2).unwrap_or_default(),
            created_at: row.get(3).unwrap_or_default(),
        });
    }

    Ok(creds)
}

#[tauri::command]
pub fn create_stored_credential(
    app: AppHandle,
    payload: CreateCredentialPayload,
) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();

    // Save password to OS secure storage first
    os_save_password(&id, &payload.username, &payload.password)?;

    // Save metadata to app DB
    conn.execute(
        "INSERT INTO stored_credentials (id, label, username) VALUES (?1, ?2, ?3)",
        params![id, payload.label, payload.username],
    )
    .map_err(|e| {
        // Rollback OS credential on DB failure
        let _ = os_delete_password(&id);
        e.to_string()
    })?;

    Ok(id)
}

#[tauri::command]
pub fn update_stored_credential(
    app: AppHandle,
    payload: UpdateCredentialPayload,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    // Update password in OS store if provided
    if let Some(ref password) = payload.password {
        os_save_password(&payload.id, &payload.username, password)?;
    }

    // Update metadata in app DB
    conn.execute(
        "UPDATE stored_credentials SET label=?1, username=?2 WHERE id=?3",
        params![payload.label, payload.username, payload.id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_stored_credential(app: AppHandle, id: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("database.sqlite");
    let conn = DbConnection::open(db_path).map_err(|e| e.to_string())?;

    // Clear credential_id references from all resource tables
    conn.execute(
        "UPDATE connections SET credential_id = NULL WHERE credential_id = ?1",
        params![id],
    )
    .ok();
    conn.execute(
        "UPDATE ssh_connections SET credential_id = NULL WHERE credential_id = ?1",
        params![id],
    )
    .ok();
    conn.execute(
        "UPDATE apps SET credential_id = NULL WHERE credential_id = ?1",
        params![id],
    )
    .ok();

    // Delete from OS store
    os_delete_password(&id)?;

    // Delete from app DB
    conn.execute("DELETE FROM stored_credentials WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

// -- Legacy Commands (kept for backward compat but now unused by UI) --

#[tauri::command]
pub fn get_creds_list() -> Result<Vec<String>, String> {
    let output = Command::new("cmdkey")
        .arg("/list")
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to list credentials".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut targets = Vec::new();
    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("Target:") {
            let target_raw = trimmed.trim_start_matches("Target:").trim();
            targets.push(target_raw.to_string());
        }
    }

    Ok(targets)
}

#[tauri::command]
pub fn save_cred(target: String, user: String, pass: String) -> Result<(), String> {
    let output = Command::new("cmdkey")
        .arg(format!("/generic:{}", target))
        .arg(format!("/user:{}", user))
        .arg(format!("/pass:{}", pass))
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to save cred: {}", err));
    }

    Ok(())
}

#[tauri::command]
pub fn delete_cred(target: String) -> Result<(), String> {
    let output = Command::new("cmdkey")
        .arg(format!("/delete:{}", target))
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        if err.contains("Element not found") {
            return Ok(());
        }
        return Err(format!("Failed to delete cred: {}", err));
    }

    Ok(())
}
