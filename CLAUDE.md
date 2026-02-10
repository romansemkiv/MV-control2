# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MV-Control is a web system for managing broadcast multiviewers and video routing via two Evertz protocols:
- **Quartz Protocol** (TCP) — routing control through Magnum server
- **NEXX-API** (REST) — multiviewer parameter management through NEXX router

Currently in **pre-implementation phase** — the repository contains only design documentation in `DOCS/`. All docs are written in Ukrainian.

## Planned Tech Stack

- **Backend:** Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy/SQLModel, Alembic
- **Frontend:** Multi-page SPA (Login, Main, Admin), dark broadcast-panel theme, SVG-based layout rendering
- **Deployment:** Docker via Portainer, auto-update via GitHub webhook, x86 architecture

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
- **Main** — MV selector, global MV params, SVG layout canvas (viewBox 0 0 1000 1000) with clickable windows, window inspector panel, preset modal, layout preview modal
- **Admin** — user management, access control (sources/MVs per user), protocol config (IP/port/key), refresh status

### Data Flow
`UI → API → validation → rate-limit → protocol client → response → update state in DB`

## Protocol Details

### Quartz (TCP, port 6543 default)
ASCII request-response, commands start with `.`, terminated with `\r\n`. One command per connection.
- `.RD{n}` → read input name → `.RAD{n},{name}`
- `.RS{n}` → read output name → `.RAS{n},{name}`
- `.IV{output}` → read routing → `.AV{output},{input}`
- `.SV{output},{input}` → switch video routing

**Destination mapping:** MV1 windows → outputs 1-16, MV2 windows → outputs 17-32, etc.

### NEXX-API (REST, base: `http://<ip>/v.api/apis/`)
Auth via API key (header/query `webeasy-api-key`) or JWT (`/BT/JWTCREATE/<base64_creds>`).

- `GET /EV/GET/parameter/<VARID>` — read parameter
- `GET /EV/SET/parameter/<VARID>/<VALUE>` — write parameter
- Multiple params: `/EV/GET/parameters/<ID1>,<ID2>` or `/EV/SET/parameters/<ID1>,<ID2>/<V1>,<V2>`

**VarID addressing:** `BASE_ID.mv_index.window_index.layer_index`
- MV index: 0-119, Window: 0-15, UMD layer: 0-2

**Key VarIDs:**
- 2700-2702: system info (total/licensed/enabled MVs, read-only)
- 2703.X: MV enable, 2704.X: layout selection, 2716.X: font, 2726.X/2727.X: border pixels
- 2719.X.Y: PCM audio bars per window
- 2708-2715, 2717, 2733 (X.Y.Z): UMD parameters (selection, text, colors as 0xRRGGBB, alpha 0-255, position, size, padding)

URL-encode special chars in text fields (%20 for space).

## Key Constraints

- **Protocols are slow** — rate-limit required; manual refresh throttled to 1 req/60s per user
- **State sync:** daily cron or manual refresh; state cached in DB
- **One user edits one MV at a time**; multiple concurrent users allowed
- **First registered user auto-becomes admin**; no password recovery, admin reset only
- **Presets are per-user** with selectable parameters (layout, UMD, PCM, borders, font) on both save and load
- **No WebSocket/live updates, no audit logs, no multi-tenancy**
- **Layout JSON format:** normalized 0..1 coordinates, rendered as SVG

## Database Model (key tables)

`users`, `sessions`, `sources` (quartz inputs), `multiviewers` (nexx index), `user_access_sources`, `user_access_mvs`, `presets` (payload_json per user), `state_mv`, `state_windows`, `state_routing`, `integrations` (protocol connection params)

## Documentation Map

| File | Content |
|------|---------|
| `DOCS/SRS.md` | Software Requirements Specification |
| `DOCS/Backend.md` | Backend architecture, API endpoints, data model |
| `DOCS/Frontend.md` | UI structure, layout system, behavior |
| `DOCS/Frontend-Wireframes.md` | Mermaid wireflow diagrams |
| `DOCS/Protocols/Quartz.md` | Quartz TCP protocol specification |
| `DOCS/Protocols/NEXX-api.md` | NEXX REST API specification with all VarIDs |
| `DOCS/first mind.txt` | Original project vision |
