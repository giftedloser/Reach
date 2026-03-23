# Reach Architecture Overview

## Core Components

### 1. Credential System (`src-tauri/src/credentials.rs`)

Per-connection credential assignment with OS-level secure storage.

- **Database**: `stored_credentials` table stores id, label, username. No passwords in SQLite.
- **OS Storage**: Passwords stored in Windows Credential Manager as `REACH/{id}`.
- **Resolution**: `resolve_credential()` combines DB metadata + OS password at launch time.
- **RDP Launch**: Sets `TERMSRV/{host}` via cmdkey before spawning mstsc.
- **SSH Launch**: Passes `-l` and `-pw` flags to PuTTY.
- **App Launch (.rdp)**: Parses `full address:s:` from .rdp files, sets TERMSRV credential.
- **Cleanup**: Deleting a credential clears `credential_id` from all referencing connections/apps.

### 2. Connection Types

| Type | Backend | Launch Method |
|---|---|---|
| **RDP** | `connections.rs` | `mstsc` with cmdkey auto-login |
| **SSH** | `ssh.rs` | PuTTY with `-l` / `-pw` flags |
| **Apps / RemoteApps** | `apps.rs` | Direct exec, shell items, or `.rdp` file parsing |

### 3. Database (`src-tauri/src/db.rs`)

SQLite via `rusqlite`, stored as `database.sqlite` in the app data directory. Schema managed through versioned migrations.

### 4. Tab System (`src-tauri/src/tabs.rs`)

Custom tabs for organizing resources. Each tab holds a filtered view of connections and apps. Reorderable with drag-and-drop.

### 5. Backup System (`src-tauri/src/backup.rs`)

Full export/import of the database as JSON. Credentials are excluded from exports (OS-level storage only).
