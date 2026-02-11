# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MV-Control is a web system for managing broadcast multiviewers and video routing via two Evertz protocols:
- **Quartz Protocol** (TCP) — routing control through Magnum server
- **NEXX-API** (REST) — multiviewer parameter management through NEXX router

All design docs are in Ukrainian in `DOCS/`.

## Development Commands

```bash
# Backend (from backend/)
source /tmp/mv-venv/bin/activate   # or create venv: python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # dev server at :8000
alembic upgrade head               # run migrations (needs PostgreSQL)
alembic revision -m "description"  # create new migration

# Frontend (from frontend/)
npm install
npm run dev                        # dev server at :5173 (proxies /api + /auth to :8000)
npm run build                      # production build → dist/

# Docker (from root)
docker compose up --build          # full stack: app + PostgreSQL
docker compose down                # stop

# Verify
cd backend && python -c "from app.main import app; print([r.path for r in app.routes])"
```

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy/SQLModel, Alembic
- **Frontend:** React + TypeScript, Vite, Tailwind CSS, Zustand
- **Deployment:** Monolithic Docker container (backend + frontend + PostgreSQL), Portainer, auto-update via GitHub webhook, x86

## Architecture

### Backend Services
- `AuthService` — login/logout, first-admin flow, RBAC (admin/user roles)
- `UserService` — CRUD users, role assignment
- `AccessService` — per-user access to specific sources and multiviewers
- `QuartzService` — TCP client for routing (RD/RS/I/SV commands)
- `NEXXService` — REST client for MV parameters (EV GET/SET)
- `PresetService` — save/load/import/export presets (per-user, not global)
- `StateService` — refresh, cache, snapshot to DB

### Frontend Pages
- **Login** — minimal form, first-login notice
- **Main** — MV selector, global MV params, SVG layout canvas (viewBox 0 0 1000 1000) with clickable windows showing output numbers, window inspector panel with source dropdown, preset modal, layout preview modal (SVG-generated previews from JSON)
- **Admin** — user management, access control (sources/MVs per user), protocol config (IP/port/key), refresh status

### Data Flow
`UI → API → validation → rate-limit → protocol client → response → update state in DB`

## Protocol Details

### Quartz (TCP, port 6543 default)
ASCII request-response, commands start with `.`, terminated with `\r\n`. One command per connection. Timeout 1-5s.
- `.RD{n}` → read input name → `.RAD{n},{name}`
- `.RS{n}` → read output name → `.RAS{n},{name}`
- `.IV{output}` → read routing → `.AV{output},{input}`
- `.SV{output},{input}` → switch video routing (success = connection close, error = `.E`)

Response codes: `.A` = acknowledge, `.E` = error, `.B` = barred (output locked), `.U` = update notification.

**Destination mapping:** formula `out = (mvIndex-1) * 16 + windowIndex` (windowIndex 1..16). MV1 windows → outputs 1-16, MV2 → 17-32, etc.

**Routing in UI:** select window → dropdown to pick Source → send `.SV{output},{input}`.

### NEXX-API (REST, base: `http://<ip>/v.api/apis/`)
Auth via API key (header/query `webeasy-api-key`) or JWT (`/BT/JWTCREATE/<base64_creds>`). Rate limit: < 10 req/sec.

- `GET /EV/GET/parameter/<VARID>` — read parameter
- `GET /EV/SET/parameter/<VARID>/<VALUE>` — write parameter
- Multiple params: `/EV/GET/parameters/<ID1>,<ID2>` or `/EV/SET/parameters/<ID1>,<ID2>/<V1>,<V2>`

**VarID addressing:** `BASE_ID.mv_index.window_index.layer_index`
- MV index: 0-119, Window: 0-15, UMD layer: 0-2

**Key VarIDs:**
- 2700-2702: system info (total/licensed/enabled MVs, read-only)
- 2703.X: MV enable, 2704.X: layout selection, 2716.X: font, 2726.X/2727.X: border pixels
- 2707.X.Y: video/audio source, 2718.X.Y: source label, 2719.X.Y: PCM audio bars
- 2708-2715, 2717, 2733 (X.Y.Z): UMD parameters (selection, text, colors as 0xRRGGBB, alpha 0-255, position, size, padding)
- 2735.X: update preview (write-only, SET=1)

URL-encode special chars in text fields (%20 for space). Enabled MV count read from VarID 2702. Actual window count depends on layout. 43 layouts available. NEXX enum mappings centralized in `backend/app/protocol_mappings.py` and `frontend/src/protocol-mappings.ts`.

### UMD & PCM specifics
- UMD types: Off, Static, Dynamic line 1, NTP time, NTP time w offset
- UMD Text editable only for Static type
- PCM Audio bars values: 0, 2, 4, 6, 8, 12, 16

## Key Constraints

- **Protocols are slow** — rate-limit and batch protection required (balanced approach)
- **State sync:** daily cron or manual refresh; state cached in DB; throttle 1 req/60s per user
- **Concurrent editing:** one user per MV, no locking mechanism — last write wins
- **First registered user auto-becomes admin**; no password recovery, admin reset only
- **Presets are per-user** with selectable parameters (layout, UMD, PCM, borders, font) on both save and load
- **No WebSocket/live updates, no audit logs, no multi-tenancy**
- **Layout system:** 43 layouts described as JSON with normalized 0..1 coordinates, rendered as SVG; same JSON for main canvas and preview thumbnails
- **First protocol status check** runs when admin saves connection parameters

## Database Model (key tables)

`users`, `sessions`, `sources` (quartz inputs), `multiviewers` (nexx index), `user_access_sources`, `user_access_mvs`, `presets` (payload_json per user), `state_mv`, `state_windows`, `state_routing`, `integrations` (protocol connection params)

## Documentation Map

| File | Content |
|------|---------|
| `DOCS/SRS.md` | Software Requirements Specification |
| `DOCS/Backend.md` | Backend architecture, API endpoints, data model, Quartz mapping formula |
| `DOCS/Frontend.md` | UI structure, layout system, React/Vite/Tailwind/Zustand stack |
| `DOCS/Frontend-Wireframes.md` | Mermaid wireflow diagrams |
| `DOCS/Protocols/Quartz.md` | Quartz TCP protocol spec with response codes |
| `DOCS/Protocols/NEXX-api.md` | NEXX REST API spec with all VarIDs and enum tables |
| `DOCS/first mind.txt` | Original project vision |
