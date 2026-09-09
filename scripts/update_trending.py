"""Wrapper to run the trending updater from the repository root.

Schedule this file (e.g. Windows Task Scheduler / cron) so the homepage
"Heritage & trending" list refreshes automatically:

    python scripts/update_trending.py
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.trending_updater import refresh  # noqa: E402

if __name__ == "__main__":
    print("Running trending updater...")
    print(refresh())