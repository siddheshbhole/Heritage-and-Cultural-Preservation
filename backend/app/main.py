from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import assistant, community, content, geo, ministry, search, trending

app = FastAPI(
    title="Ministry of Culture — Heritage & Culture Preservation Platform API",
    version="0.1.0",
    description="Unified cultural discovery, preservation and intelligence platform for the Ministry of Culture, Government of India.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

ROUTERS = [geo.router, content.router, community.router, search.router, assistant.router, trending.router, ministry.router]
for r in ROUTERS:
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "heritage-culture-platform"}


# Serve the built frontend (frontend/dist) when it exists so that opening the
# backend URL directly (e.g. http://127.0.0.1:8000) loads the whole platform.
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def _index():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
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