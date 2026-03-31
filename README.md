<div align="center">

<img width="200" height="200" alt="newicon" src="https://github.com/user-attachments/assets/e2c2f916-5315-4b99-b944-3c5cb59c2816" />
  
# Reach


**One launcher for every connection.**

RDP &nbsp;|&nbsp; SSH &nbsp;|&nbsp; Local Apps &nbsp;|&nbsp; RemoteApps

[![Latest Release](https://img.shields.io/github/v/release/giftedloser/Reach?style=for-the-badge&color=E8734A&label=Download)](https://github.com/giftedloser/Reach/releases/latest)
&nbsp;&nbsp;
[![License](https://img.shields.io/github/license/giftedloser/Reach?style=for-the-badge&color=353535)](LICENSE)
&nbsp;&nbsp;
[![Built with Tauri](https://img.shields.io/badge/Built_with-Tauri_2-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)

<br />

<img src="https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />

---

<img width="859" height="591" alt="image" src="https://github.com/user-attachments/assets/8fe92936-f202-4dce-8e06-48213ee089a3" />
</div>

## What is Reach?

Reach is a desktop launcher that puts all your remote connections and local apps in one clean interface. No more juggling RDP files, PuTTY shortcuts, and app launchers separately — organize everything into custom tabs, assign saved credentials, and launch with a double-click.

Built with [Tauri 2](https://tauri.app) + React 19 + TypeScript. **Windows only** — uses native Windows Credential Manager and RDP under the hood.

## Features

<table>
<tr>
<td width="50%">

### Launch Anything
- **RDP** connections with auto-login
- **SSH** sessions via PuTTY
- **Local apps** and scripts
- **RemoteApps** — launch `.rdp` files with auto-login

</td>
<td width="50%">

### Stay Organized
- **Custom tabs** to group resources your way
- **Grid & list views** with 3 density modes
- **Quick search** across everything (`Ctrl+K`)
- **Per-resource icons & colors**

</td>
</tr>
<tr>
<td width="50%">

### Credential Management
- **Per-connection credentials** — assign a saved credential to any card
- **Windows Credential Manager** — passwords never stored in the app database
- **One-click password rotation** — update without reassigning
- **Auto-login** — TERMSRV injection for RDP, `-pw` flag for SSH

</td>
<td width="50%">

### Look & Feel
- **3 themes** — Editorial Light, Dark Gold, Riddim Synth
- **Accent color system** — each theme has a distinct accent personality
- **Keyboard shortcuts** — `Ctrl+0-4` for tabs, `Ctrl+,` for settings
- **Export / Import** — back up your entire config as JSON

</td>
</tr>
</table>

## Quick Start

Grab the latest `.msi` or `.exe` from **[Releases](https://github.com/giftedloser/Reach/releases/latest)**, install, and launch.

## Development

> **Prerequisites:** [Node.js 18+](https://nodejs.org/), [Rust](https://www.rust-lang.org/tools/install), [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/giftedloser/Reach.git
cd Reach
npm install
npm run tauri dev
```

**Build an installer:**

```bash
npm run tauri build
# outputs to src-tauri/target/release/bundle/
```

## Tech Stack

| | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Radix UI, Lucide Icons |
| **Backend** | Tauri 2, Rust, SQLite (rusqlite) |
| **Security** | Windows Credential Manager (OS-level secure storage) |
| **Platform** | mstsc, PuTTY |

## Project Structure

```
src/                   React frontend
  components/          UI components (cards, dialogs, views)
  contexts/            React context providers
  lib/                 Utilities, theme config, icon registry
  types/               TypeScript interfaces

src-tauri/src/         Rust backend
  lib.rs               Tauri command registration
  db.rs                SQLite schema & migrations
  credentials.rs       Credential CRUD + OS secure storage
  connections.rs       RDP connections & launch
  ssh.rs               SSH connections & launch
  apps.rs              Local app & RemoteApp launcher
  backup.rs            Export / import
```

## Security

Passwords are **never stored in the app database**. Reach uses Windows Credential Manager for all credential storage. See [SECURITY.md](docs/SECURITY.md) for the full architecture.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](LICENSE) &copy; LoserLabs
