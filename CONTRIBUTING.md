# Contributing to Reach

Thanks for your interest! Contributions are welcome — bug reports, feature requests, and pull requests all help.

## Getting Started

1. **Fork** the repo and clone it locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install [Rust](https://www.rust-lang.org/tools/install) and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.
4. Start the dev server:
   ```bash
   npm run tauri dev
   ```

## Project Structure

```
src/               React frontend (TypeScript + Tailwind CSS)
src-tauri/src/     Rust backend
  lib.rs           App entrypoint & command registration
  db.rs            SQLite schema & migrations
  connections.rs   RDP connections
  ssh.rs           SSH connections
  apps.rs          Local app launcher
  rd.rs            RD Web feed sync
  credentials.rs   Credential CRUD + OS secure storage + launch resolution
  settings.rs      Persistent settings
  tabs.rs          Custom tab management
  backup.rs        Export / import
```

## Submitting a Pull Request

- Keep PRs focused — one feature or fix per PR.
- Match the existing code style (Prettier for TS, `cargo fmt` for Rust).
- Run `npx tsc --noEmit` and `npm run build` before opening a PR to make sure nothing is broken.
- Open an issue first for large or breaking changes so we can discuss the approach.

## Reporting Bugs

Open an issue at https://github.com/giftedloser/Reach/issues with:
- Steps to reproduce
- Expected vs actual behavior
- OS version and Reach version

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
