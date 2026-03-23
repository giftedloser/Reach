# Reach Integration Release Notes (v1.0.0)

## Highlights

This release delivers a fully secure, enterprise-grade RD Web integration. It replaces the prototype authentication logic with a robust WinHTTP implementation and secures credential storage using Windows DPAPI.

## Features

- **Secure Storage**: Credentials now encrypted via DPAPI. No plaintext on disk.
- **Smart Auth**: Auto-detects IWA vs Forms Authentication.
- **Folder Support**: Fully supports nested RemoteApp folders.
- **Diagnostic Sync**: Clearer error messages ("AuthFailed", "EmptyFeed") instead of generic failures.

## Fixes

- **Memory Leak**: Fixed `HINTERNET` handle leak in `fetch_feed_winhttp`.
- **Parsing**: Fixed issue where nested resources were ignored or flattened.
- **Performance**: Removed aggressive background polling loops.

## Known Issues

- None. (Codebase Frozen)
