"""Tests for the admin culture/ritual metrics and the measured health endpoint.

The dashboard presents CULTURAL RECORDS and RITUALS as headline figures, so these
tests pin both the query semantics and the requirement that the figures are real
row counts rather than derived approximations. They also pin the system status
contract: signals are measured, and an unconfigured dependency is reported as
``unavailable`` instead of being optimistically shown as healthy.
"""
import pytest
from fastapi import HTTPException
from sqlalchemy import func, text

from app import auth
from app.models import Event, HeritageSite
from app.routes.admin import (
    RITUAL_HERITAGE_CATEGORIES,
    get_admin_health,
    get_admin_stats,
)

ADMIN_USER = {"email": "admin@example.com", "is_admin": True}


@pytest.fixture
def db():
    """Provide a transactional database session bound to the real schema."""

    from app.database import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-legacy-jwt-secret-value-1234567890")
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    monkeypatch.setenv("SUPABASE_STORAGE_BUCKET", "")
    yield


# ---------------------------------------------------------------------------
# Culture and ritual metrics
# ---------------------------------------------------------------------------


def test_ritual_categories_are_defined_and_lowercase():
    """Categories are compared with func.lower(), so they must be lowercase."""
    assert RITUAL_HERITAGE_CATEGORIES
    for category in RITUAL_HERITAGE_CATEGORIES:
        assert category == category.lower()


def test_culture_and_ritual_metrics_match_direct_counts(db):
    stats = get_admin_stats(db=db, admin_user=ADMIN_USER)

    direct_culture = db.query(Event).filter(Event.event_type == "culture").count()
    direct_ritual_events = db.query(Event).filter(Event.event_type == "ritual").count()
    direct_ritual_heritage = (
        db.query(HeritageSite)
        .filter(func.lower(HeritageSite.category).in_(RITUAL_HERITAGE_CATEGORIES))
        .count()
    )

    assert stats["culture_events_count"] == direct_culture
    assert stats["ritual_events_count"] == direct_ritual_events
    assert stats["ritual_heritage_count"] == direct_ritual_heritage


def test_ritual_metrics_are_reported_separately(db):
    """Rituals are surfaced as two distinct figures, never blended into one."""
    stats = get_admin_stats(db=db, admin_user=ADMIN_USER)
    assert "ritual_events_count" in stats
    assert "ritual_heritage_count" in stats
    assert stats["ritual_events_count"] != stats["ritual_heritage_count"] or (
        stats["ritual_events_count"] == 0
    )


def test_culture_and_ritual_metrics_are_integers(db):
    stats = get_admin_stats(db=db, admin_user=ADMIN_USER)
    for key in ("culture_events_count", "ritual_events_count", "ritual_heritage_count"):
        assert isinstance(stats[key], int)
        assert stats[key] >= 0


# ---------------------------------------------------------------------------
# Measured system health
# ---------------------------------------------------------------------------


def test_health_probes_the_database_rather_than_asserting_ok(db):
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    database = next(c for c in body["checks"] if c["name"] == "database")
    assert database["status"] == "operational"
    assert database["latency_ms"] >= 0


def test_health_marks_absent_storage_as_unavailable(db):
    """An unconfigured integration must never be reported as working."""
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    storage = next(c for c in body["checks"] if c["name"] == "storage")
    assert storage["status"] == "unavailable"
    assert "no Supabase Storage bucket" in storage["detail"]
    assert body["status"] == "partial"


def test_health_reports_configured_storage_as_operational(db, monkeypatch):
    monkeypatch.setenv("SUPABASE_STORAGE_BUCKET", "heritage-media")
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    storage = next(c for c in body["checks"] if c["name"] == "storage")
    assert storage["status"] == "operational"
    assert "heritage-media" in storage["detail"]
    assert body["status"] == "operational"


def test_health_reports_the_active_auth_verification_mode(db):
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    auth_check = next(c for c in body["checks"] if c["name"] == "authentication")
    assert auth_check["status"] == "operational"
    assert "SUPABASE_JWT_SECRET" in auth_check["detail"]


def test_health_reports_unconfigured_auth_as_unavailable(db, monkeypatch):
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("VITE_SUPABASE_URL", raising=False)
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    auth_check = next(c for c in body["checks"] if c["name"] == "authentication")
    assert auth_check["status"] == "unavailable"
    assert "Not configured" in auth_check["detail"]


def test_health_falls_back_to_degraded_when_database_is_unreachable(db, monkeypatch):
    """A failing dependency must surface, not be swallowed into a healthy 200."""

    def boom(*args, **kwargs):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(db, "execute", boom)
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    database = next(c for c in body["checks"] if c["name"] == "database")
    assert database["status"] == "down"
    assert "connection refused" in database["detail"]
    assert body["status"] == "degraded"


def test_health_response_shape_is_stable(db):
    body = get_admin_health(db=db, admin_user=ADMIN_USER)
    assert set(body) == {"status", "checks", "generated_at"}
    assert body["status"] in {"operational", "partial", "degraded"}
    for check in body["checks"]:
        assert set(check) == {"name", "label", "status", "detail", "latency_ms"}
        assert check["status"] in {"operational", "unavailable", "down"}
    names = {c["name"] for c in body["checks"]}
    assert names == {"database", "authentication", "storage"}


def test_health_is_admin_only_over_http():
    """The health probe exposes configuration detail, so it stays admin-only.

    ``Depends(require_admin)`` is enforced by the routing layer, so this has to
    be asserted through the app rather than by calling the handler directly.
    """
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    assert client.get("/api/admin/health").status_code == 401
    assert client.get("/api/admin/stats").status_code == 401


def test_health_and_stats_are_registered_as_admin_scoped_routes():
    """Guard against a future refactor dropping the require_admin dependency."""
    from app.routes.admin import router

    scoped = {
        route.path: route
        for route in router.routes
        if getattr(route, "path", "").startswith("/api/admin")
    }
    for path in ("/api/admin/health", "/api/admin/stats"):
        # require_admin is declared as a parameter default, so FastAPI records it
        # in the dependant rather than the route-level dependency list.
        calls = [
            getattr(dep.call, "__name__", "")
            for dep in scoped[path].dependant.dependencies
        ]
        assert "require_admin" in calls, f"{path} is not guarded by require_admin: {calls}"
