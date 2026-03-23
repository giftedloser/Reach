# Reach Security Architecture

## 1. Stored Credentials (Windows Credential Manager)

User credentials for RDP, SSH, and App connections are stored securely using the OS credential store.

### Implementation

- **Mechanism**: Windows Credential Manager via `cmdkey.exe` (write) and `CredReadW` via advapi32 P/Invoke (read).
- **Scope**: Per-user. Credentials are tied to the logged-in Windows user profile.
- **Key Format**: `REACH/{credential_id}` — each stored credential gets a UUID-based key.

### Lifecycle

1.  **Input**: User enters label, username, and password in Settings > Saved Credentials.
2.  **Storage**: Password saved to Windows Credential Manager (`cmdkey /generic:REACH/{id}`). Only metadata (id, label, username) stored in SQLite.
3.  **Assignment**: User selects a credential from the picker dropdown on any RDP/SSH/App card.
4.  **Resolution**: At launch time, `resolve_credential()` fetches username from DB and password from OS store via `CredReadW`.
5.  **Usage (RDP)**: Sets `TERMSRV/{host}` in Windows Credential Manager, then launches `mstsc`. Auto-authenticates without prompt.
6.  **Usage (SSH)**: Passes `-l {user} -pw {password}` to PuTTY.
7.  **Usage (App/.rdp)**: Parses `full address` from .rdp file, sets TERMSRV credential, then launches.
8.  **Deletion**: Removes from both OS store and SQLite. Clears `credential_id` from all referencing resources.

### Design Decisions

- **No plaintext in SQLite**: Passwords never touch the app database. Only the OS credential store holds secrets.
- **Nullable credential_id**: Connections without a credential assigned prompt normally (backward compatible).
- **Password rotation**: Users can update just the password on an existing credential without changing assignments.

## 2. RD Web Feed Credentials (DPAPI)

Feed credentials (for RD Web Access portals) use DPAPI for encryption at rest.

- **Mechanism**: `CryptProtectData` / `CryptUnprotectData` with CurrentUser scope.
- **Storage**: Encrypted blob stored as Base64 in SQLite.
- **API Redaction**: `get_feeds` returns `password: null` to the frontend.

## 3. Leak Prevention

- **No passwords in SQLite**: Stored credentials use OS-level secure storage only.
- **No passwords in .rdp files**: Credentials are injected via `cmdkey` before launch, not written to disk.
- **Logging**: No sensitive data is logged.
- **Frontend isolation**: Passwords are never sent to the frontend after initial save.
