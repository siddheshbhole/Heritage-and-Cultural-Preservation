<div align="center">

<img src="frontend/public/images/branding/sanskriti-setu-logo.png" alt="Sanskriti Setu logo" width="220" />

# Sanskriti Setu — Heritage & Cultural Preservation Platform

**Discover, explore and preserve India's heritage and culture — a Ministry of Culture heritage platform.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=fff)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=fff)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-5B9E46?logo=postgis&logoColor=fff)](https://postgis.net/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Storage-3ECF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=fff)](https://www.docker.com/)

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Problem & Solution](#problem--solution)
- [Key Features](#key-features)
- [User Journey](#user-journey)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [Authentication & Security](#authentication--security)
- [API Overview](#api-overview)
- [Admin Portal](#admin-portal)
- [Heritage Guide Programme](#heritage-guide-programme)
- [Tests](#tests)
- [Utility Scripts](#utility-scripts)
- [Future Scope](#future-scope)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

**Sanskriti Setu** (*“a bridge of culture”*) is a full-stack digital platform for discovering, exploring, documenting and preserving India's heritage and culture, built around official Ministry of Culture content.

It unifies scattered cultural content — heritage sites, museums, festivals, schemes, awards, publications, official documents, media and events — into one searchable, map-driven experience with an interactive India map, a curated Document Archive, a retrieval-grounded AI Heritage Guide, moderated community contributions and a full admin portal.

> Design language: an institutional “sandstone · terracotta · bronze · indigo” theme with a serif/sans pairing, built for a government-cultural portal rather than a generic dashboard.

---

## Problem & Solution

| Problem | How Sanskriti Setu addresses it |
|---|---|
| Fragmented ministry sites, PDFs and portals | One catalogue: heritage, museums, culture, documents, publications, schemes, media |
| Official records hard to find | **Document Archive** (10 categories, autocomplete search, in-browser viewer, CDN files) |
| Discovery needs local context | Interactive India map + State → City → Site hierarchy + location-aware AI |
| Chatbots hallucinate facts | Assistant answers **only from retrieved data**, cites sources |
| No trusted community channel | Moderated posts (pending → approved/rejected), kept distinct from official content |
| Teams need governance | Admin portal: model CRUD, moderation queue, analytics, audit logs |

---

## Key Features

### Discover & Explore
- **Interactive India map** — State → City → heritage sites, museums, festivals, food, handicrafts, history (empty categories hidden automatically).
- **Heritage detail pages** — history, architecture, gallery lightbox, nearby sites, provenance & sources, 360° links where available.
- **Tangible / Intangible / UNESCO** browsing, scored **trending** carousel, 15-language selector.

### Document Archive
- 10 categories: Reports · Act and Policies · Circulars/Orders/Notices · Publications · MoU / Others · Press Release · Gazettes · Guidelines · E-Sanskriti · Schemes.
- **Autocomplete search** across titles, categories and descriptions; one click opens the document.
- In-browser **viewer** (preview + download), sort/filter/pagination; files on **Supabase CDN** with local fallback.

### AI Heritage Guide
- Persistent, page-aware floating assistant; retrieval-grounded answers with **source references** and trust labels.
- Optional **Gemini** generation (`GEMINI_API_KEY`); works from retrieved data without it. Recommendations, itineraries, capped history.

### Community & Services
- Moderated posts + profiles, event booking, announcements ticker.
- **Media library**: photos, videos, brochures, Bharat Beat, Sanskriti Patrika, events, news, webcasts; plus schemes, awards, commemorations, publications & authors, MoUs.

### Admin Portal (`/admin`, allow-list gated)
- Metrics, analytics, system health, model-level CRUD, moderation queue and audit-log viewer.

---

## User Journey

```
HOME (showcase, announcements, events)
    ↓
DISCOVER → MAP / SEARCH / ASK AI → STATE → CITY → SITE
    ↓
DETAIL + SOURCES + NEARBY → READ · BOOK · CONTRIBUTE · GUIDE
```

---

## System Architecture

```
 React SPA (Vite :5173, dev /api proxy)
              ↓
 FastAPI (Uvicorn :8000, 15 routers, serves dist + /docs)
      ┌───────┴────────┐
      ↓                ↓
 PostgreSQL 16     Supabase: Auth (JWT/JWKS)
 + PostGIS (Docker) + Storage bucket "documents" (CDN)
 SQLite fallback    Optional: Gemini (assistant only)
```

- **Dev:** Vite proxies `/api` → `127.0.0.1:8000`.
- **Single process:** backend serves `frontend/dist` with SPA fallback on `:8000`.
- **Documents:** `data/documents/` → upload script → Supabase bucket → CDN URL in `document_items.file_url` (`308` redirect fallback). Details in `README/Tech-stack.md`.

---

## Technology Stack

| Layer | Technologies (all genuinely used — see `package.json` / `requirements.txt`) |
|---|---|
| **Frontend** | React 18 · TypeScript 5 · Vite 5 · React Router 6 · `@svg-maps/india` · `@supabase/supabase-js` · hand-rolled CSS |
| **Backend** | Python · FastAPI · Uvicorn · SQLAlchemy · Alembic · PyJWT · httpx |
| **Data** | PostgreSQL 16 + PostGIS 3.4 (Docker) · SQLite fallback · Supabase Storage |
| **Auth** | Supabase Auth (JWT/JWKS) · Guide PIN auth · `ADMIN_EMAILS` allow-list |
| **AI** | Retrieval-grounded assistant · Optional Gemini (default `gemini-3.6-flash`) |
| **Ops** | Docker Compose · `run.bat` launcher · pytest · Supabase migrations |

> Not used (long-term options in `README/Tech-stack.md` only): Drupal, Kubernetes, Elasticsearch, Redis, GraphQL.

---

## Project Structure

```
Heritage-and-Cultural-Preservation/
├── README.md + README/           ← this file + product/architecture reference docs
├── frontend/                     ← React SPA (≈40 routes)
│   ├── src/{pages,components,api,context,data,styles}
│   ├── public/images/            ← branding, heritage, ministry, media assets
│   └── vite.config.ts            ← :5173, /api proxy → :8000
├── backend/                      ← FastAPI (15 routers)
│   ├── app/{main,models,database,auth,search_engine,seed*.py,routes/}
│   ├── run_server.py · requirements.txt · alembic.ini + migrations/ · tests/
├── supabase/ · docker/           ← SQL migrations · PostGIS compose
├── scripts/                      ← ingest / migrate / upload / trending
├── data/                         ← documents/ (dev) · processed/ (SQLite)
└── run.bat + .env.example        ← one-shot launcher · env placeholders
```

---

## Getting Started

### Prerequisites

Python 3.10+ · Node.js 18+ · Docker Desktop (for PostGIS; optional) · Supabase project (for auth/storage; optional for local browse).

### Option A — One-shot launch (Windows)

```bat
run.bat
```

Starts PostGIS → FastAPI (creates `backend/.venv` on first run) → Vite (`npm install` on first run), each in its own window.

| Frontend | http://localhost:5173 |
|---|---|
| API / docs / health | http://127.0.0.1:8000 · `/docs` · `/api/health` |
| Database | localhost:5432 (or SQLite fallback) |

### Option B — Manual setup

```bash
cd docker && docker compose up -d        # PostGIS on :5432 (skip for SQLite mode)

cd ../backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip -r requirements.txt
.venv\Scripts\python.exe run_server.py   # :8000

cd ../frontend
npm install
npm run dev                              # :5173, proxies /api → :8000
```

Single-process production style: `npm run build` in `frontend/`, then run the backend — it serves `frontend/dist` on `:8000`.

| `npm run dev` / `npm run build` | `frontend/` | Dev server / type-check + build |
| `pytest` | `backend/` | Test suite |
| `docker compose up -d` | `docker/` | Start PostGIS |

---

## Environment Variables

Copy the examples and fill in your own values — **never commit real secrets** (`.env` files are git-ignored).

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres DSN; unset → SQLite fallback (`data/processed/heritage.db`) |
| `SUPABASE_URL` / `SUPABASE_JWT_SECRET` | Auth via JWKS (Dashboard → Settings → API) |
| `ADMIN_EMAILS` | Comma-separated admin allow-list |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Server keys for document uploads |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Optional AI generation (default model `gemini-3.6-flash`) |
| `ALLOWED_ORIGINS` | Extra CORS origins beyond localhost |
| `POSTGRES_USER/PASSWORD/DB` | Docker DB (default `culture` × 3) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client auth |
| `VITE_API_BASE` / `VITE_ADMIN_EMAIL` | Optional API override / admin-nav hint |

---

## Database & Migrations

PostgreSQL 16 + PostGIS 3.4 in Docker (`culture-postgis`, persistent volume) is primary; without `DATABASE_URL` the backend uses SQLite. ~48 tables in `backend/app/models.py` (`states`, `heritage_sites`, `document_items`, `media_*`, `guide_profiles`, `audit_logs`, …) auto-created on startup, with Alembic + Supabase SQL migrations for evolution.

---

## Authentication & Security

Supabase JWTs verified server-side via JWKS; admin access gated by `GET /api/admin/session` on `ADMIN_EMAILS` + token claims; guides use separate PIN auth; explicit localhost CORS allow-list (no wildcard); every admin mutation lands in `audit_logs`; official / verified / community / AI content stays visually distinct.

---

## API Overview

Interactive docs at **`/docs`**. Key endpoints (all verified in code):

| Area | Endpoints |
|---|---|
| Geo / content | `/api/states*` · `/api/heritage*` · `/api/museums*` · `/api/home` · `/api/{schemes,awards,publications,authors,mous,ministry,about}` |
| Documents | `/api/documents` (filter/sort/paginate) · `/categories` · `/file/{id}` (local or `308` → CDN) |
| Media | `/api/media/{photos,videos,brochures,leaders,monuments,artists,sanskriti,news,events,webcast}` |
| Search & AI | `/api/search` (+ `/suggest`) · `POST /api/assistant/query` · `/api/trending` |
| Community / guides | `/api/community/posts` · `/api/bookings` · `/api/guide/…` (auth, tours, reviews) |
| Admin | `/api/admin/{session,stats,analytics,users,posts,health}` · CRUD at `/api/admin/crud/…` · `/api/admin/audit` |

---

## Admin Portal

Route **`/admin`** (requires `ADMIN_EMAILS` sign-in): dashboard metrics & analytics, community moderation queue, generic CRUD over every model, system health, immutable audit log, user overview — all backed by tested endpoints.

---

## Heritage Guide Programme

Route **`/vacancies`** — register as a guide (PIN credentials), set availability, get discovered near sites, run tours, collect ratings/reviews, with a misuse-reporting channel. Covered by `tests/test_guides.py`.

---

## Tests

```bash
cd backend
.venv\Scripts\python.exe -m pip install pytest   # not in requirements.txt
.venv\Scripts\python.exe -m pytest
```

Covers auth, admin session/metrics, guide lifecycle, intelligent search and assistant grounding (`backend/tests/`).

---

## Utility Scripts

| `ingest_documents.py` / `upload_documents_to_supabase.py` | Seed archive metadata · idempotent CDN upload (`--dry-run` supported) |
| `migrate_*` / `pull_supabase_to_sqlite.py` | Move data between SQLite and Supabase/Postgres |
| `update_trending.py` / `generate_migration_sql.py` | Recompute trending scores · emit migration SQL |

---

## Future Scope

Next steps fitting the current architecture (long-term vision in `README/Tech-stack.md`): server-side full-text/vector search, background workers for ingestion/OCR, storage lifecycle + CDN rules, production hardening (managed Postgres, CI, rate limiting), PWA offline support and deeper multilingual coverage.

---

## Contributing

Fork, branch, keep `client.ts` ↔ routes in sync, add tests for API changes, run `npm run build` + `pytest` before a PR. Never commit `.env`, `*.db`, `node_modules/` or `dist/`.

---

## License

No `LICENSE` file is currently present in the repository. Add one (e.g. MIT / Apache-2.0 / a Government Open Data Licence, as appropriate) before public distribution.

---

<div align="center">

**Sanskriti Setu** · Ministry of Culture · Government of India

*Discover · Preserve · Celebrate*

</div>
