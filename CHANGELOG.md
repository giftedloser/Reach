# Changelog

All notable changes to Reach will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — 2026-03-31

### Added
- Designated RD Gateway support through Settings, with per-RDP opt-in for routed launches
- Backend regression tests covering backup/import, RD Gateway resolution, and Windows argument parsing
- Subtle card and list indicators for RDP resources that use an RD Gateway

### Changed
- Backup exports now include SSH connections, custom tabs, tab assignments, and app settings
- Backup payloads now carry explicit restore semantics with backward-compatible `merge` default and backend `replace` support
- App launch argument handling now preserves quoted Windows arguments more reliably
- Resource type tags on tiles now sit in a consistent bottom position
- Sidebar branding and app icon assets were refreshed to use the new Reach mark

### Fixed
- Removed stale RD Web feed UI remnants after feed support was dropped
- Deleting resources now cleans up related tab assignments more reliably
- Deleting the active custom tab now falls back cleanly instead of leaving the main panel blank
- Global/custom-tab search now matches subtitles as well as names
- Gateway parsing now rejects malformed JSON-like values instead of treating them as hostnames

## [1.1.0] — 2026-03-23

### Added
- Per-connection credential assignment — assign a saved credential to any RDP, SSH, or App card
- Credential management system — CRUD for stored credentials with passwords in Windows Credential Manager (keyed as `REACH/{id}`)
- Credential picker dropdown in Add and Edit dialogs for RDP, SSH, and App resources
- Auto-login for RDP connections via TERMSRV credential injection before mstsc launch
- Auto-login for SSH sessions via PuTTY `-pw` flag when credential is assigned
- RemoteApp (.rdp file) credential support — parses host from .rdp files and sets TERMSRV credentials
- Quick password update — edit a credential to change just the password without recreating it
- Settings credential manager reworked with edit (pencil) and delete actions per credential

---

## [1.0.0] — 2024

### Added
- Unified launcher for RDP connections, SSH sessions, local applications, and RD Web feeds
- Custom tabs to organize resources into named groups
- Per-resource custom icons and accent colors
- Grid and list view modes with compact / standard / comfortable density
- Light, Dark, and Catppuccin themes
- Quick search across all resources (Ctrl+K)
- Windows Credential Manager integration for secure RDP credential storage
- Export / import data as JSON backup
- RD Web feed sync (experimental) — authenticates via WinHTTP or reqwest and parses portal resources
- Keyboard shortcuts: Ctrl+0–4 for tab navigation, Ctrl+, for settings
- Collapsible sidebar with per-tab resource counts
