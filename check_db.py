import sqlite3
import pprint

db = sqlite3.connect('C:/Users/admin/OneDrive/Desktop/SIH/Heritage-and-Cultural-Preservation/data/processed/heritage.db')
c = db.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in c.fetchall()]

print("--- TABLES AND ROWS ---")
for t in tables:
    if t == 'sqlite_sequence': continue
    c.execute(f"SELECT count(*) FROM {t}")
    count = c.fetchone()[0]
    print(f"{t}: {count} rows")

print("\n--- SCHEMA ---")
for t in tables:
    if t == 'sqlite_sequence': continue
    c.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{t}'")
    sql = c.fetchone()[0]
    print(sql)
    print("")
