# n8n-nodes-mindwtr

[![npm version](https://badge.fury.io/js/%40taistudio%2Fn8n-nodes-mindwtr.svg)](https://badge.fury.io/js/%40taistudio%2Fn8n-nodes-mindwtr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [Mindwtr](https://github.com/dongdongbh/Mindwtr) — free GTD to-do app (desktop + mobile, offline-first).

> 🇫🇷 Version française : voir [README_FR.md](./README_FR.md)

## 🌟 Features

- **📝 Tasks**: list, get, create (with quick-add), update, complete, archive, delete, restore
- **📁 Projects**: list, get, create, update, delete, restore
- **🗂️ Areas**: list, get, create, update, delete
- **📑 Sections**: list, get, create, update, delete
- **🔎 Search**: search tasks + projects
- **⚡ Capture**: fast inbox capture (`POST /v1/capture`, Cloud API)
- **🔌 Two modes**: Local Desktop API (`http://127.0.0.1:3456`) and Self-hosted Cloud API (`/v1` prefix handled automatically)

## 🔧 Installation

### Option 1: Install from npm

```bash
npm install @taistudio/n8n-nodes-mindwtr
```

### Option 2: Install from source

```bash
git clone https://github.com/TaiStudio/n8n-nodes-mindwtr.git
cd n8n-nodes-mindwtr
npm install
npm run build
```

## 🚀 Usage

1. **Install the node** using one of the methods above
2. **Restart n8n** to load the new node
3. **Enable the API in Mindwtr**:
   - **Local**: Settings → Advanced → Enable Local API server (default port `3456`, copy the bearer token)
   - **Cloud**: self-host Mindwtr Cloud ([deployment guide](https://docs.mindwtr.app/data-sync/cloud-deployment)) and use a `MINDWTR_CLOUD_AUTH_TOKENS` token
4. **Configure the Mindwtr API credential** in n8n:
   - Base URL: `http://127.0.0.1:3456` (local) or `https://mindwtr.example.com` (cloud, no trailing slash)
   - API Token: your bearer token
5. **Use the node** with `API Mode` = Local Desktop API or Self-Hosted Cloud API

> ⚠️ n8n running in Docker cannot reach `127.0.0.1:3456` of your laptop. For remote setups use the self-hosted Cloud server. Local mode works when n8n and Mindwtr run on the same host.

## 🔐 Authentication

Bearer token, sent as `Authorization: Bearer <token>` on every request.

- Local API: token shown in **Settings → Advanced** (binds to `127.0.0.1` only)
- Cloud API: token from `MINDWTR_CLOUD_AUTH_TOKENS`; capture-only tokens (`mwc_…`) work only on `POST /v1/capture`

Test endpoint: `GET /health` → `{ ok: true }`.

## 📚 Available Operations

### Task Resource

- `getAll`: list with filters (status, query, projectId, isFocusedToday, all, deleted, limit)
- `get`: get single task
- `create`: `title` + optional `quickAdd` (e.g. `Call Alice @phone #errands /due:tomorrow`) + props (status, project, contexts, tags, priority, dates…)
- `update`: PATCH fields (status triage: inbox/next/waiting/someday/reference)
- `complete` / `archive` / `delete` (soft-delete) / `restore`

### Project Resource

- `getAll`, `get`, `create` (title + status/area/color/sequential/dueDate), `update`, `delete`, `restore` (Local API)

### Area Resource

- `getAll` (both modes), `get` / `create` / `update` / `delete` (Cloud API)

### Section Resource

- `getAll` (optional project filter), `get`, `create`, `update`, `delete`

### Search Resource

- `search`: `GET /search?query=…` (local) or `GET /v1/search?query=…` (cloud), returns tasks + projects

### Capture Resource

- `create`: `POST /v1/capture` with `{ transcription }` — Cloud API only, creates an Inbox task

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ❤️ Sponsors

This node is maintained by [Tai Studio](https://github.com/TaiStudio). If it saves you time, consider sponsoring:

- 🧡 [Sponsor on GitHub](https://github.com/sponsors/LeGitHubDeTai)
- ☕ [Buy Me a Coffee](https://www.buymeacoffee.com/taistudio)
- 🎥 [YouTube — Tai Studio](https://www.youtube.com/channel/UCZiVWB8_UNH4NLzr7XbaI8A)
- 👕 [Tai Studio Shop](https://shop.spreadshirt.fr/tai-studio/)
- 💜 [Tipeee](https://fr.tipeee.com/tai-studio)

Thanks to the [Mindwtr sponsors](https://github.com/dongdongbh/Mindwtr#sponsors) for supporting the upstream app.

## 📄 License

MIT — see [LICENSE](./LICENSE) (same sponsor links as [n8n-nodes-planka](https://github.com/TaiStudio/n8n-nodes-planka)).

## 🔗 Links

- [n8n](https://n8n.io/)
- [Mindwtr](https://mindwtr.app/)
- [Mindwtr GitHub](https://github.com/dongdongbh/Mindwtr)
- [Mindwtr Local API docs](https://docs.mindwtr.app/power-users/local-api)
- [Mindwtr Cloud API docs](https://docs.mindwtr.app/developers/cloud-api)
- [Mindwtr Capture webhook](https://docs.mindwtr.app/power-users/capture-webhook)
- [n8n Community Nodes](https://github.com/n8n-io/n8n-nodes-community)

## 📞 Support

- Create an issue on [GitHub Issues](https://github.com/TaiStudio/n8n-nodes-mindwtr/issues)
- Contact the maintainer: [tai.studio@outlook.fr](mailto:tai.studio@outlook.fr)

---

**Note**: Community-maintained node, not officially supported by the n8n or Mindwtr teams.
