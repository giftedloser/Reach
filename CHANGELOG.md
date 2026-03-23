# Changelog

All notable changes to Reach will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

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
