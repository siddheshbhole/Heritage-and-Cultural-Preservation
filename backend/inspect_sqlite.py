import sqlite3
import os
from pathlib import Path

db_path = Path(__file__).resolve().parents[1] / "data" / "processed" / "heritage.db"
print("DB path:", db_path, "Exists:", db_path.exists())

if db_path.exists():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]
    print(f"Total tables: {len(tables)}")
    for t in sorted(tables):
        cursor.execute(f'SELECT count(*) FROM "{t}";')
        cnt = cursor.fetchone()[0]
        print(f"  {t}: {cnt} rows")
    conn.close()
