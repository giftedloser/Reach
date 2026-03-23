# Reach

A desktop launcher for managing RDP, SSH, local applications, and RD Web feeds — all from one place.

Built with [Tauri](https://tauri.app) + React + TypeScript. **Windows only** (RDP, WinHTTP, and Windows Credential Manager are Windows-specific).

## Features

- **Unified launcher** — RDP connections, SSH sessions, local apps, and RD Web resources in one interface
- **Custom tabs** — Organize resources into named groups
- **Per-resource customization** — Custom icons and accent colors for every resource
- **Multiple view modes** — Grid and list views with compact / standard / comfortable density
- **Three themes** — Light, Dark, and Catppuccin
- **Search** — Quick search across all resources (Ctrl+K)
- **Per-connection credentials** — Assign saved credentials to individual RDP, SSH, and app cards for auto-login
- **Credential management** — Passwords stored in Windows Credential Manager; update passwords in one click when they rotate
- **Data backup** — Export and import all data as JSON
- **RD Web integration** — Sync resources from Remote Desktop Web Access feeds (experimental)
- **Keyboard shortcuts** — Ctrl+0–4 for tabs, Ctrl+, for settings

## Installation

Download the latest installer from the [Releases](https://github.com/giftedloser/Reach/releases) page and run the `.msi` or `.exe` setup.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) (Windows: WebView2, C++ build tools)

### Setup

```bash
git clone https://github.com/giftedloser/Reach.git
cd reach
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Outputs an installer to `src-tauri/target/release/bundle/`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Radix UI |
| Backend | Tauri 2, Rust, SQLite (rusqlite) |
| Platform | Windows Credential Manager, WinHTTP |
| Icons | Lucide React |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](LICENSE) © LoserLabs
