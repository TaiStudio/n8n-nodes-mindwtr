# n8n-nodes-mindwtr

[![npm version](https://badge.fury.io/js/%40taistudio%2Fn8n-nodes-mindwtr.svg)](https://badge.fury.io/js/%40taistudio%2Fn8n-nodes-mindwtr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Node communautaire n8n pour [Mindwtr](https://github.com/dongdongbh/Mindwtr) — application GTD gratuite (desktop + mobile, offline-first).

> 🇬🇧 English version: see [README.md](./README.md)

## 🌟 Fonctionnalités

- **📝 Tâches** : lister, lire, créer (avec quick-add), mettre à jour, terminer, archiver, supprimer, restaurer
- **📁 Projets** : lister, lire, créer, mettre à jour, supprimer, restaurer
- **🗂️ Zones (Areas)** : lister, lire, créer, mettre à jour, supprimer
- **📑 Sections** : lister, lire, créer, mettre à jour, supprimer
- **🔎 Recherche** : chercher dans tâches + projets
- **⚡ Capture** : capture rapide vers l'inbox (`POST /v1/capture`, API Cloud)
- **🔌 Deux modes** : API locale desktop (`http://127.0.0.1:3456`) et API Cloud auto-hébergée (préfixe `/v1` géré automatiquement)

## 🔧 Installation

### Option 1 : depuis npm

```bash
npm install @taistudio/n8n-nodes-mindwtr
```

### Option 2 : depuis les sources

```bash
git clone https://github.com/TaiStudio/n8n-nodes-mindwtr.git
cd n8n-nodes-mindwtr
npm install
npm run build
```

## 🚀 Utilisation

1. **Installez le node** via l'une des méthodes ci-dessus
2. **Redémarrez n8n** pour charger le node
3. **Activez l'API dans Mindwtr** :
   - **Local** : Paramètres → Avancé → activer le serveur API locale (port `3456` par défaut, copiez le token bearer)
   - **Cloud** : auto-hébergez Mindwtr Cloud ([guide de déploiement](https://docs.mindwtr.app/data-sync/cloud-deployment)) et utilisez un token `MINDWTR_CLOUD_AUTH_TOKENS`
4. **Configurez le credential Mindwtr API** dans n8n :
   - Base URL : `http://127.0.0.1:3456` (local) ou `https://mindwtr.example.com` (cloud, sans slash final)
   - API Token : votre bearer token
5. **Utilisez le node** avec `API Mode` = Local Desktop API ou Self-Hosted Cloud API

> ⚠️ n8n dans Docker ne peut pas joindre le `127.0.0.1:3456` de votre PC. Pour un usage distant, utilisez le serveur Cloud auto-hébergé. Le mode local fonctionne quand n8n et Mindwtr tournent sur la même machine.

## 🔐 Authentification

Token bearer envoyé en `Authorization: Bearer <token>` à chaque requête.

- API locale : token affiché dans **Paramètres → Avancé** (lié à `127.0.0.1` uniquement)
- API Cloud : token `MINDWTR_CLOUD_AUTH_TOKENS` ; les tokens de capture seule (`mwc_…`) ne marchent que sur `POST /v1/capture`

Endpoint de test : `GET /health` → `{ ok: true }`.

## 📚 Opérations disponibles

### Ressource Task

- `getAll` : liste avec filtres (status, query, projectId, isFocusedToday, all, deleted, limit)
- `get` : lire une tâche
- `create` : `title` + optionnel `quickAdd` (ex. `Appeler Alice @phone #courses /due:tomorrow`) + props (statut, projet, contextes, tags, priorité, dates…)
- `update` : champs PATCH (triage : inbox/next/waiting/someday/reference)
- `complete` / `archive` / `delete` (soft-delete) / `restore`

### Ressource Project

- `getAll`, `get`, `create` (titre + statut/zone/couleur/séquentiel/échéance), `update`, `delete`, `restore` (API locale)

### Ressource Area

- `getAll` (les deux modes), `get` / `create` / `update` / `delete` (API Cloud)

### Ressource Section

- `getAll` (filtre projet optionnel), `get`, `create`, `update`, `delete`

### Ressource Search

- `search` : `GET /search?query=…` (local) ou `GET /v1/search?query=…` (cloud), retourne tâches + projets

### Ressource Capture

- `create` : `POST /v1/capture` avec `{ transcription }` — API Cloud uniquement, crée une tâche Inbox

## 🤝 Contribuer

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une Pull Request.

1. Forkez le dépôt
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez (`git commit -m 'Add some AmazingFeature'`)
4. Poussez (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## ❤️ Sponsors

Ce node est maintenu par [Tai Studio](https://github.com/TaiStudio). S'il vous fait gagner du temps, pensez à sponsoriser (mêmes liens que [n8n-nodes-planka](https://github.com/TaiStudio/n8n-nodes-planka)) :

- 🧡 [Sponsor sur GitHub](https://github.com/sponsors/LeGitHubDeTai)
- ☕ [Buy Me a Coffee](https://www.buymeacoffee.com/taistudio)
- 🎥 [YouTube — Tai Studio](https://www.youtube.com/channel/UCZiVWB8_UNH4NLzr7XbaI8A)
- 👕 [Boutique Tai Studio](https://shop.spreadshirt.fr/tai-studio/)
- 💜 [Tipeee](https://fr.tipeee.com/tai-studio)

Merci aussi aux [sponsors de Mindwtr](https://github.com/dongdongbh/Mindwtr#sponsors) qui soutiennent l'app d'origine.

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).

## 🔗 Liens

- [n8n](https://n8n.io/)
- [Mindwtr](https://mindwtr.app/)
- [GitHub Mindwtr](https://github.com/dongdongbh/Mindwtr)
- [Docs API locale Mindwtr](https://docs.mindwtr.app/power-users/local-api)
- [Docs API Cloud Mindwtr](https://docs.mindwtr.app/developers/cloud-api)
- [Capture webhook](https://docs.mindwtr.app/power-users/capture-webhook)
- [Nodes communautaires n8n](https://github.com/n8n-io/n8n-nodes-community)

## 📞 Support

- Ouvrez une issue sur [GitHub Issues](https://github.com/TaiStudio/n8n-nodes-mindwtr/issues)
- Contact : [tai.studio@outlook.fr](mailto:tai.studio@outlook.fr)

---

**Note** : node communautaire, sans support officiel des équipes n8n ou Mindwtr.
