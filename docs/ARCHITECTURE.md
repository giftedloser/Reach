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

### 2. RDP and Gateway Resolution (`src-tauri/src/connections.rs`)

RDP connections support direct host launch and optional RD Gateway routing.

- **Stored config**: `gateway_json` may contain an explicit gateway hostname or a designated-gateway reference.
- **Designated gateway**: Settings can hold a single named RD Gateway target (`rd_gateway`) that individual connections opt into.
- **Defensive parsing**: Gateway hostnames are normalized before use; malformed JSON-like values are ignored rather than treated as hostnames.
- **Launch output**: Resolved gateways are written into the generated `.rdp` payload before `mstsc` is launched.

### 3. Connection Types

| Type | Backend | Launch Method |
|---|---|---|
| **RDP** | `connections.rs` | `mstsc` with cmdkey auto-login |
| **SSH** | `ssh.rs` | PuTTY with `-l` / `-pw` flags |
| **Apps / `.rdp` launchers** | `apps.rs` | Direct exec, shell items, or `.rdp` file parsing |

### 4. Database (`src-tauri/src/db.rs`)

SQLite via `rusqlite`, stored as `database.sqlite` in the app data directory. Schema managed through versioned migrations.

### 5. Tab System (`src-tauri/src/tabs.rs`)

Custom tabs for organizing resources. Each tab holds a filtered view of RDP, SSH, and app resources.

### 6. Backup System (`src-tauri/src/backup.rs`)

JSON export/import for:

- RDP connections
- SSH connections
- Apps / `.rdp` launchers
- Custom tabs
- Tab assignments
- App settings

Stored passwords remain excluded because they live in Windows Credential Manager. Resource `credential_id` references are preserved so assignments survive if the same credentials exist on the target machine.

Imports support two backend restore modes:

- `merge`: default and backward-compatible; upserts backup rows into the existing database
- `replace`: clears the managed tables inside the same transaction before restoring the backup

### 7. Test Coverage

The backend includes real unit tests around the highest-risk behavior:

- backup/export-import round trips and restore mode semantics
- RD Gateway resolution, including legacy raw-string compatibility
- Windows argument parsing for app and script launch
