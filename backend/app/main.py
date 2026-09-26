import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import admin, admin_audit, admin_crud, assistant, community, content, documents, geo, guide_auth, heritage, heritage_guides, media, ministry, search, trending

app = FastAPI(
    title="Ministry of Culture — Heritage & Culture Preservation Platform API",
    version="0.1.0",
    description="Unified cultural discovery, preservation and intelligence platform for the Ministry of Culture, Government of India.",
)

# Fix Bug 4: Explicit, safe CORS origins instead of wildcard '*' with credentials
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    allowed_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

ROUTERS = [
    geo.router,
    heritage.router,
    content.router,
    community.router,
    heritage_guides.router,
    guide_auth.router,
    search.router,
    assistant.router,
    trending.router,
    ministry.router,
    media.router,
    documents.router,
    admin.router,
    admin_crud.router,
    admin_audit.router,
]
for r in ROUTERS:
    app.include_router(r)

# Serve the extracted Ministry of Culture documents under /static/documents.
# Registered *before* the SPA catch-all below so file URLs are not swallowed.
from .routes.documents import DOCUMENTS_ROOT  # noqa: E402

DOCUMENTS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/static/documents", StaticFiles(directory=DOCUMENTS_ROOT), name="documents")



@app.get("/api/health")
def health():
    return {"status": "ok", "service": "heritage-culture-platform"}


# Serve the built frontend (frontend/dist) when it exists so that opening the
# backend URL directly (e.g. http://127.0.0.1:8000) loads the whole platform.
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def _index():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(
            index,
            headers={"Cache-Control": "no-cache", "Pragma": "no-cache", "Expires": "0"},
        )
    return JSONResponse(
        {
            "detail": "Frontend build not found. Run `npm run build` in frontend/, or use the Vite dev server.",
            "health": "/api/health",
            "docs": "/docs",
        },
        status_code=404,
    )


@app.get("/")
def root():
    return _index()


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if not full_path:
            return _index()
        candidate = (FRONTEND_DIST / full_path).resolve()
        if candidate.is_relative_to(FRONTEND_DIST.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        return _index()