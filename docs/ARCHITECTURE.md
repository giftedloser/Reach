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

### 2. RD Web Integration (`src-tauri/src/rd.rs`)

The application integrates with RD Web Access (IIS) to discover and launch RemoteApps and Desktops. It treats the RD Web feed as a REST-like API endpoint, consuming the XML feed directly.

### 2. WinHTTP Network Layer

- **Library**: `windows::Win32::Networking::WinHttp` (unsafe Rust bindings).
- **Purpose**: Provides a robust, OS-native HTTP client that correctly handles:
  - NTLM/Kerberos Authentication (IWA)
  - Proxy detection
  - Cookie management
  - SSL/TLS

### 3. Folder Parsing Logic

The XML parser uses a stack-based state machine to correctly interpret nested `<Folder>` tags within the `TSWP` or `Atom` feed.

- **Hierarchy**: Resources are grouped by their folder path (e.g., "Office/Word").
- **Display**: The frontend (`RDView.tsx`) sorts folders alphabetically and displays them before root-level items.

### 4. Database Schema

Stored in `database.sqlite` in the generic `rd_feeds` table:

```sql
CREATE TABLE rd_feeds (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    username TEXT,
    password TEXT, -- Encrypted Blob (Base64)
    resources_json TEXT, -- Cached feed content
    last_sync_at TEXT
);
```
