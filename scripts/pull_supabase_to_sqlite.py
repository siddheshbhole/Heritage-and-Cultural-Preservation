#!/usr/bin/env python3
"""Pull application data from the Supabase PostgreSQL via its REST API
(PostgREST, reachable over IPv4) and upsert it into the local SQLite
database used by the FastAPI backend.

Background: the Supabase *direct* Postgres host (db.<ref>.supabase.co) is
IPv6-only and this development machine has no IPv6 route, while the REST
API (port 443) works fine. This script keeps the local app in sync with the
Supabase tables so the website shows the live Supabase data.

Non-destructive: upserts by primary key (INSERT ... ON CONFLICT ... DO
UPDATE). Only tables/columns present in the local SQLite schema are touched.

Usage (from anywhere):
    python scripts/pull_supabase_to_sqlite.py
"""
import json
import os
import sqlite3
import sys
import urllib.request
from pathlib import Path
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
SQLITE_DB = REPO_ROOT / "data" / "processed" / "heritage.db"

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
if not SUPABASE_KEY:
    SUPABASE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()

if not SUPABASE_URL:
    sys.exit("ERROR: SUPABASE_URL not set in backend/.env")
if not SUPABASE_KEY:
    sys.exit("ERROR: no Supabase key set in backend/.env")

# Tables ordered by foreign-key dependencies (parents first).
DEPENDENCY_ORDER = [
    "states", "authors", "document_categories", "heritage_categories",
    "ministry_profile", "about_entries", "announcements", "awards",
    "commemorations", "community_profiles", "culture_apps", "documents",
    "government_programmes", "institutions", "museums", "schemes",
    "trending_items", "media_albums", "media_artists", "media_brochures",
    "media_events", "media_leaders", "media_monuments", "media_news",
    "media_sanskriti", "media_videos", "media_webcasts", "ministry_leaders",
    "mous", "provenance", "audit_logs", "cities", "publications",
    "heritage_sites", "community_posts", "events", "heritage_images",
    "document_items",
]
SKIP_TABLES = {"alembic_version", "cultural & heritage", "sqlite_sequence"}


def sqlite_columns(conn: sqlite3.Connection, table: str) -> list[str]:
    cur = conn.execute(f'PRAGMA table_info("{table}")')
    return [r[1] for r in cur.fetchall()]


def sqlite_tables(conn: sqlite3.Connection) -> set[str]:
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    return {r[0] for r in cur.fetchall()}


def fetch_table(table: str) -> list[dict]:
    """Fetch every row of a table from the Supabase REST API (paginated)."""
    rows: list[dict] = []
    start = 0
    page_size = 1000
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/{quote(table)}?select=*&order=id.asc"
            f"&limit={page_size}"
        )
        req = urllib.request.Request(url, method="GET")
        req.add_header("apikey", SUPABASE_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
        req.add_header("Range-Unit", "items")
        req.add_header("Range", f"{start}-{start + page_size - 1}")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = resp.read().decode("utf-8")
        except Exception as e:
            print(f"    [ERROR] fetch {table} range {start}: {e}")
            break
        page = json.loads(payload) if payload else []
        rows.extend(page)
        if len(page) < page_size:
            break
        start += page_size
    return rows


def to_sqlite(val):
    if val is None or isinstance(val, (int, float, str)):
        # JSON true/false would survive as strings; normalize bools here.
        if isinstance(val, bool):
            return 1 if val else 0
        if isinstance(val, float) and val.is_integer():
            return int(val)
        return val
    if isinstance(val, bool):
        return 1 if val else 0
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    return str(val)


def upsert(conn: sqlite3.Connection, table: str, cols: list[str], rows: list[dict]) -> int:
    if not cols or not rows:
        return 0
    if "id" not in cols:
        return 0
    col_list = ", ".join(f'"{c}"' for c in cols)
    ph = ", ".join(["?"] * len(cols))
    update_set = ", ".join(
        f'"{c}"=excluded."{c}"' for c in cols if c != "id"
    )
    sql = (
        f'INSERT INTO "{table}" ({col_list}) VALUES ({ph}) '
        f'ON CONFLICT("id") DO UPDATE SET {update_set}'
    )
    count = 0
    for r in rows:
        vals = [to_sqlite(r.get(c)) for c in cols]
        try:
            conn.execute(sql, vals)
            count += 1
        except Exception as e:
            print(f"    [WARN] upsert {table} id={r.get('id')}: {e}")
    return count


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    print("=" * 66)
    print("Supabase REST -> local SQLite sync")
    print(f"Source : {SUPABASE_URL}")
    print(f"Target : {SQLITE_DB}")
    print("=" * 66)

    if not SQLITE_DB.exists():
        sys.exit(f"ERROR: SQLite database not found: {SQLITE_DB}")

    conn = sqlite3.connect(str(SQLITE_DB))
    local_tables = sqlite_tables(conn) - SKIP_TABLES

    ordered = [t for t in DEPENDENCY_ORDER if t in local_tables]
    remaining = sorted(local_tables - set(ordered))
    process_order = ordered + remaining

    totals = {}
    for table in process_order:
        cols = sqlite_columns(conn, table)
        print(f"\n  TABLE: {table}")
        rows = fetch_table(table)
        if not rows:
            print(f"    no rows returned from Supabase (skip)")
            continue
        common = [c for c in cols if c in rows[0]]
        missing_rest = [c for c in cols if c not in rows[0]]
        if missing_rest:
            print(f"    columns absent from Supabase (NULL): {missing_rest}")
        n = upsert(conn, table, common, rows)
        conn.commit()
        cur = conn.execute(f'SELECT COUNT(*) FROM "{table}"')
        final = cur.fetchone()[0]
        totals[table] = (n, final)
        print(f"    upserted {n}/{len(rows)} rows -> SQLite now has {final}")

    print("\n" + "=" * 66)
    print("  SYNC SUMMARY")
    print("=" * 66)
    for table, (n, final) in totals.items():
        print(f"  {table:24s} updated={n:<5d} sqlite_total={final}")
    conn.close()


if __name__ == "__main__":
    main()