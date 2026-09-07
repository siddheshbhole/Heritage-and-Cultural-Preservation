"""Standalone trending updater (intended to be run on a schedule).

This is the "Scheduled Job" in the architecture:

    Scheduled Job  ->  Fetch/check cultural info  ->  Update PostgreSQL  ->  GET /api/trending

For the prototype it recomputes trend scores from the stored signal scores, decays
outdated items and flips inactive items back vs keeping them rotated. In production
each step below can be extended to query trusted sources (MoC, ASI, UNESCO, IGNCA,
State cultural departments) before persisting.

Run directly (from the backend directory):

    python -m app.trending_updater

or from the repository root via the wrapper script:

    python scripts/update_trending.py

Configure it in Windows Task Scheduler / cron to run periodically so the homepage
trending list updates without any frontend (or even API) code change.
"""
from datetime import date

from .database import Base, SessionLocal, engine
from .models import TrendingItem
from .routes.trending import compute_trend_score

# Items whose recency decays fastest (live festivals / events).
LIVE_CATEGORIES = {"Festival", "Dance / Festival", "Performing Art"}
# After this many days with no signals an item is considered stale.
INACTIVE_AFTER_DAYS = 180


def refresh():
    """Re-score, decay and rotate trending items. Returns change summary."""
    today = date.today()
    changed = 0
    deactivated = 0
    reactivated = 0

    db = SessionLocal()
    try:
        for item in db.query(TrendingItem).all():
            # Simulate time-based recency decay so very old items start to fall.
            # A production updater would replace this with real event windows.
            if item.category in LIVE_CATEGORIES:
                item.recency_score = max(20.0, (item.recency_score or 0.0) * 0.985)
            else:
                item.recency_score = max(30.0, (item.recency_score or 0.0) * 0.995)

            new_score = compute_trend_score(item)
            age_days = None
            if item.updated_at:
                try:
                    age_days = (today - date.fromisoformat(item.updated_at)).days
                except ValueError:
                    age_days = None

            if age_days is not None and age_days >= INACTIVE_AFTER_DAYS and item.is_active:
                item.is_active = 0
                deactivated += 1
            elif new_score >= 60 and not item.is_active:
                item.is_active = 1
                reactivated += 1

            if abs((item.trend_score or 0.0) - new_score) > 0.001:
                changed += 1
            item.trend_score = new_score
            item.updated_at = today.isoformat()

        db.commit()
        active = db.query(TrendingItem).filter(TrendingItem.is_active == 1).count()
        return {
            "rescored": changed,
            "deactivated": deactivated,
            "reactivated": reactivated,
            "active_total": active,
            "ran_at": today.isoformat(),
        }
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print(refresh())