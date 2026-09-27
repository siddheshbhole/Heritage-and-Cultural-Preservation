<div align="center">

<img src="frontend/public/images/branding/sanskriti-setu-logo.png" alt="Sanskriti Setu logo" width="220" />

# Sanskriti Setu — Heritage & Cultural Preservation Platform

<h3>Discover, explore and preserve India's heritage and culture — a Ministry of Culture heritage platform.</h3>

<div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 14px;">

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=fff)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=fff)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=fff)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-5B9E46?style=for-the-badge&logo=postgis&logoColor=fff)](https://postgis.net/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=fff)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=fff)](https://www.docker.com/)

</div>

</div>

---

## About the Project

**Sanskriti Setu** (*“a bridge of culture”*) is a full-stack digital platform for discovering, exploring, documenting and preserving India's heritage and culture, built around official Ministry of Culture content.

It unifies scattered cultural content — heritage sites, museums, festivals, schemes, awards, publications, official documents, media and events — into one searchable, map-driven experience with an interactive India map, a curated Document Archive, a retrieval-grounded AI Heritage Guide, moderated community contributions and a full admin portal.

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
React SPA (Vite frontend)
        ↓
FastAPI backend (serves built frontend + API)
   ┌────┴────────┐
   ↓             ↓
PostgreSQL   Supabase: Auth (JWT/JWKS)
+ PostGIS    + Storage bucket for documents (CDN)
SQLite       Optional: Gemini (assistant only)
fallback
```

- **Dev:** the frontend proxies API calls to the backend.
- **Single process:** the backend serves the built frontend with SPA fallback.
- **Documents:** local files → upload script → Supabase bucket → CDN URL stored on the record, with redirect fallback. Details in `README/Tech-stack.md`.

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
│   └── vite.config.ts            ← dev server + backend proxy
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

Starts the database, backend (creates `backend/.venv` on first run) and frontend (`npm install` on first run), each in its own window.

### Option B — Manual setup

```bash
cd docker && docker compose up -d        # PostGIS database (skip for SQLite mode)

cd ../backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip -r requirements.txt
.venv\Scripts\python.exe run_server.py

cd ../frontend
npm install
npm run dev
```

Single-process production style: `npm run build` in `frontend/`, then run the backend — it serves the built site itself.

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
| `ALLOWED_ORIGINS` | Extra CORS origins |
| `POSTGRES_USER/PASSWORD/DB` | Docker DB (default `culture` × 3) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client auth |
| `VITE_API_BASE` / `VITE_ADMIN_EMAIL` | Optional backend override / admin-nav hint |

---

## Database & Migrations

PostgreSQL 16 + PostGIS 3.4 in Docker (`culture-postgis`, persistent volume) is primary; without `DATABASE_URL` the backend uses SQLite. ~48 tables in `backend/app/models.py` (`states`, `heritage_sites`, `document_items`, `media_*`, `guide_profiles`, `audit_logs`, …) auto-created on startup, with Alembic + Supabase SQL migrations for evolution.

---

## Authentication & Security

Supabase JWTs verified server-side via JWKS; admin access gated on `ADMIN_EMAILS` + token claims; guides use separate PIN auth; strict CORS allow-list (no wildcard); every admin mutation lands in `audit_logs`; official / verified / community / AI content stays visually distinct.

---

## License

No `LICENSE` file is currently present in the repository. Add one (e.g. MIT / Apache-2.0 / a Government Open Data Licence, as appropriate) before public distribution.

---

<div align="center">

**Sanskriti Setu** · Ministry of Culture · Government of India

*Discover · Preserve · Celebrate*

</div>
