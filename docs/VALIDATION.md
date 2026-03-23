# Release Validation Manifest (v1.0.0)

**Date**: 2026-02-15
**Build**: Release (Optimized)

## Summary

This release marks the transition from "Operational" to "Secure & Stable".

### 1. Build Verification

- [x] **Clean Build**: `npm run tauri build` succeeds.
- [x] **Artifacts**: Setup EXE and MSI generated.
- [x] **No Warnings**: `cargo check` and `npm run lint` are clean.

### 2. Functional Verification

- [x] **Add Feed**: Validates URL before saving.
- [x] **Sync**: Correctly parses resources and folders.
- [x] **Launch**: RDP files generated and launched via `mstsc`.
- [x] **Delete**: Removes feed and cleans up DB.

### 3. Security Verification

- [x] **DPAPI**: Confirmed `CurrentUser` scope.
- [x] **Memory**: Confirmed zeroing of decrypted buffers.
- [x] **Persistence**: Confirmed no plaintext in `database.sqlite`.
- [x] **Migration**: Old plaintext passwords serve as one-time tokens for migration to DPAPI.

### 4. Stability

- [x] **No Leaks**: `WinHttpCloseHandle` verified on all paths (including error branches).
- [x] **No Loops**: Background refresh timers removed from frontend.
