from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import assistant, community, content, geo, search

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

ROUTERS = [geo.router, content.router, community.router, search.router, assistant.router]
for r in ROUTERS:
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "heritage-culture-platform"}


@app.get("/")
def root():
    return {
        "service": "Ministry of Culture — Heritage & Culture Preservation Platform",
        "docs": "/docs",
        "health": "/api/health",
    }