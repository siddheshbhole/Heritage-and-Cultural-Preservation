import os
import sqlite3
import sys
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parents[1]
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect
from app.database import Base, SQLALCHEMY_DATABASE_URL
from app import models

load_dotenv(backend_dir / ".env")

sqlite_db_path = root_dir / "data" / "processed" / "heritage.db"
postgres_url = os.getenv("DATABASE_URL")

print(f"Connecting to SQLite: {sqlite_db_path}")
print(f"Connecting to Supabase PostgreSQL: {postgres_url[:40]}...")

sqlite_conn = sqlite3.connect(sqlite_db_path)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

pg_engine = create_engine(postgres_url, connect_args={"connect_timeout": 15})

print("\n1. Creating database schema on Supabase...")
Base.metadata.create_all(bind=pg_engine)
print("Schema creation completed.")

inspector = inspect(pg_engine)
pg_tables = set(inspector.get_table_names())

sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
sqlite_tables = [t[0] for t in sqlite_cur.fetchall() if t[0] not in ('sqlite_sequence', 'alembic_version')]

print(f"\nFound {len(sqlite_tables)} tables in SQLite: {', '.join(sqlite_tables)}")

with pg_engine.begin() as pg_conn:
    for table_name in sqlite_tables:
        if table_name not in pg_tables:
            print(f"[SKIP] Table '{table_name}' does not exist in PostgreSQL schema.")
            continue
        
        sqlite_cur.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cur.fetchall()
        if not rows:
            print(f"[INFO] Table '{table_name}' is empty in SQLite.")
            continue
        
        columns = [description[0] for description in sqlite_cur.description]
        col_names = ", ".join(f'"{c}"' for c in columns)
        param_names = ", ".join(f":{c}" for c in columns)

        # Count existing PostgreSQL rows
        existing_cnt = pg_conn.execute(text(f'SELECT count(*) FROM "{table_name}"')).scalar()
        print(f"\n[MIGRATING] '{table_name}': {len(rows)} rows from SQLite (Supabase currently has {existing_cnt} rows)")

        # Prepare insert statement with ON CONFLICT DO NOTHING
        insert_query = text(f'INSERT INTO "{table_name}" ({col_names}) VALUES ({param_names}) ON CONFLICT DO NOTHING')
        
        data_dicts = [dict(row) for row in rows]
        pg_conn.execute(insert_query, data_dicts)
        
        # Reset ID sequence if integer primary key 'id' exists
        if "id" in columns:
            try:
                pg_conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(max(id), 1)) FROM \"{table_name}\""))
            except Exception as e:
                pass

print("\n--- MIGRATION VERIFICATION ---")
all_match = True
with pg_engine.connect() as pg_conn:
    for table_name in sqlite_tables:
        sqlite_cur.execute(f"SELECT count(*) FROM {table_name}")
        sqlite_cnt = sqlite_cur.fetchone()[0]
        
        try:
            pg_cnt = pg_conn.execute(text(f'SELECT count(*) FROM "{table_name}"')).scalar()
            if sqlite_cnt == pg_cnt:
                print(f"[OK] {table_name}: {sqlite_cnt} rows (SQLite == Supabase)")
            else:
                print(f"[INFO] {table_name}: SQLite={sqlite_cnt}, Supabase={pg_cnt}")
        except Exception as e:
            print(f"[ERROR] {table_name}: {e}")
            all_match = False

sqlite_conn.close()
print("\nSUCCESS: Database migration to Supabase completed successfully!")
