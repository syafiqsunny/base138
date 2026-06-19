# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **single, fully self-contained static web app**: `index.html.html`. It is the "HP2026 Command Center", an event-planning dashboard (UI language is Malay). There is no package manager, build step, backend, lint config, or test suite.

### Running the app (development)

Serve the repo root with any static file server and open the file (note the unusual double `.html.html` name):

```
python3 -m http.server 8000
# then open http://localhost:8000/index.html.html
```

There is no `index.html`, so the URL must include the full filename `index.html.html`.

### How it works (non-obvious notes)

- **All state is client-side.** Data lives in `localStorage` under key `hp2026_cc_v2` (sync config under `hp2026_sync_cfg`). Clearing browser storage resets the app to the seed `DATA` embedded in the file.
- **Login is local, not server-backed.** Master admin is `Syafiq`. Default passwords: admin `admin12345`, staff `staff12345` (constants `DEFAULT_ADMIN_PASSWORD` / `DEFAULT_STAFF_PASSWORD` in the inline script).
- **Cloud sync is optional and OFF by default.** It only activates if a user pastes a Google Apps Script URL into the sync settings; the app is fully functional without any network/backend.

### Lint / test / build

None exist. There is nothing to lint, test, or build — editing means changing `index.html.html` directly and reloading the browser.
