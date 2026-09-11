#!/usr/bin/env python3
"""Generate a PostgreSQL migration SQL file from heritage.db (SQLite).

Reads every table in the local SQLite database and emits idempotent
INSERT … ON CONFLICT (id) DO UPDATE statements that can be pasted
into the Supabase SQL editor or saved as a migration file.

Usage:
    python scripts/generate_migration_sql.py                    # writes supabase/migrations/migration.sql
    python scripts/generate_migration_sql.py -o backup.sql      # custom output path
"""
import argparse
import sqlite3
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SQLITE_DB = REPO_ROOT / "data" / "processed" / "heritage.db"
DEFAULT_OUT = REPO_ROOT / "supabase" / "migrations" / "migration.sql"

SKIP_TABLES = {"alembic_version", "sqlite_sequence", "cultural & heritage"}

DEPENDENCY_ORDER = [
    "states",
    "authors",
    "document_categories",
    "heritage_categories",
    "ministry_profile",
    "about_entries",
    "announcements",
    "awards",
    "commemorations",
    "community_profiles",
    "culture_apps",
    "documents",
    "government_programmes",
    "institutions",
    "museums",
    "schemes",
    "trending_items",
    "media_albums",
    "media_artists",
    "media_brochures",
    "media_events",
    "media_leaders",
    "media_monuments",
    "media_news",
    "media_sanskriti",
    "media_videos",
    "media_webcasts",
    "ministry_leaders",
    "mous",
    "provenance",
    "audit_logs",
    "cities",
    "publications",
    "heritage_sites",
    "community_posts",
    "events",
    "heritage_images",
    "document_items",
]


def escape_pg(val: str) -> str:
    return val.replace("\\", "\\\\").replace("'", "''")


def format_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, float):
        return f"{val}"
    if isinstance(val, bytes):
        return f"E'\\\\x{val.hex()}'"
    s = str(val)
    return f"'{escape_pg(s)}'"


def main():
    parser = argparse.ArgumentParser(
        description="Generate PostgreSQL migration SQL from heritage.db"
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output SQL file (default: {DEFAULT_OUT})",
    )
    args = parser.parse_args()

    if not SQLITE_DB.exists():
        sys.exit(f"ERROR: SQLite database not found: {SQLITE_DB}")

    sqlite_conn = sqlite3.connect(str(SQLITE_DB))

    all_tables = [
        r[0]
        for r in sqlite_conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
    ]
    tables = [t for t in all_tables if t.lower() not in SKIP_TABLES]

    ordered = [t for t in DEPENDENCY_ORDER if t in tables]
    remaining = [t for t in tables if t not in ordered]
    process_order = ordered + remaining

    col_info = {}
    for t in tables:
        col_info[t] = [
            r[1] for r in sqlite_conn.execute(f'PRAGMA table_info("{t}")').fetchall()
        ]

    lines: list[str] = []
    lines.append("-- =============================================================")
    lines.append("-- Heritage & Cultural Preservation — Supabase migration")
    lines.append(f"-- Generated from: {SQLITE_DB.name}")
    lines.append("-- Strategy:       INSERT … ON CONFLICT (id) DO UPDATE (upsert)")
    lines.append("-- Safe to re-run: yes (idempotent)")
    lines.append("-- =============================================================")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    total_rows = 0

    for table in process_order:
        cols = col_info.get(table, [])
        if not cols:
            continue

        rows = sqlite_conn.execute(f'SELECT * FROM "{table}"').fetchall()
        if not rows:
            lines.append(f"-- {table}: 0 rows, skipped")
            lines.append("")
            continue

        pk_cols = [
            r[1]
            for r in sqlite_conn.execute(f'PRAGMA table_info("{table}")').fetchall()
            if r[5]
        ]
        conflict_target = ", ".join(f'"{pk}"' for pk in pk_cols)
        update_cols = [c for c in cols if c not in pk_cols]
        if update_cols:
            update_set = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
            on_conflict = f"ON CONFLICT ({conflict_target}) DO UPDATE SET {update_set}"
        else:
            on_conflict = f"ON CONFLICT ({conflict_target}) DO NOTHING"

        col_list = ", ".join(f'"{c}"' for c in cols)

        lines.append(f"-- {table}: {len(rows)} rows")
        lines.append(f'INSERT INTO "{table}" ({col_list}) VALUES')

        for i, row in enumerate(rows):
            vals = ", ".join(format_value(v) for v in row)
            comma = "," if i < len(rows) - 1 else ";"
            lines.append(f"  ({vals}){comma}")

        lines.append(f"{on_conflict};")
        lines.append("")
        total_rows += len(rows)

    lines.append("COMMIT;")
    lines.append("")
    lines.append(f"-- Total: {total_rows} rows across {len(process_order)} tables")
    lines.append("")

    lines.append("-- =============================================================")
    lines.append("-- Reset sequences so new inserts get correct IDs")
    lines.append("-- =============================================================")
    for table in process_order:
        cols = col_info.get(table, [])
        if "id" in cols:
            rows = sqlite_conn.execute(f'SELECT MAX(id) FROM "{table}"').fetchone()
            max_id = rows[0] if rows and rows[0] else 0
            if max_id > 0:
                lines.append(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                    f"GREATEST({max_id}, (SELECT COALESCE(MAX(id),0) FROM \"{table}\")));"
                )
    lines.append("")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")

    print(f"Generated: {args.output}")
    print(f"Tables:    {len(process_order)}")
    print(f"Rows:      {total_rows}")
    print(f"Size:      {args.output.stat().st_size / 1024:.1f} KB")

    sqlite_conn.close()


if __name__ == "__main__":
    main()
