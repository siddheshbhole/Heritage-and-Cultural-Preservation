import sqlite3
import urllib.request
import json

db = sqlite3.connect('c:/Users/ASUS/OneDrive/Desktop/Heritage-and-Cultural-Preservation/data/processed/heritage.db')
c = db.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in c.fetchall() if t[0] != 'sqlite_sequence']

url = "https://aptttepqwxecgxrljeec.supabase.co"
apikey = "sb_publishable_PP0QwTZol17N_sr6Gb1HhA_w5dkGT34"

print("--- VERIFYING MIGRATION ---")
all_match = True

for t in tables:
    c.execute(f"SELECT count(*) FROM {t}")
    sqlite_count = c.fetchone()[0]

    req = urllib.request.Request(f"{url}/rest/v1/{t}?select=*", headers={
        "apikey": apikey,
        "Authorization": f"Bearer {apikey}",
        "Prefer": "count=exact",
        "Range": "0-0"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            content_range = response.headers.get("Content-Range")
            if content_range:
                supabase_count = int(content_range.split('/')[-1])
            else:
                supabase_count = 0
            
            if sqlite_count == supabase_count:
                print(f"[OK] {t}: {sqlite_count} rows in both")
            else:
                print(f"[FAIL] {t}: SQLite={sqlite_count}, Supabase={supabase_count}")
                all_match = False
    except Exception as e:
        print(f"[ERROR] {t}: Failed to check Supabase ({e})")
        all_match = False

if all_match:
    print("\nSUCCESS: All table counts match between SQLite and Supabase!")
else:
    print("\nWARNING: Some tables did not match or failed to query.")
