"""Upload Ministry of Culture documents to Supabase Storage and point the
``document_items.file_url`` column at the public CDN URLs.

This is the cloud-deployment pipeline for the Documents section: local
development serves PDFs from ``data/documents/`` via the FastAPI proxy
(``GET /api/documents/file/{id}``), but Vercel/Render/Railway filesystems are
ephemeral — so the binaries live in a public Supabase Storage bucket and the
backend/serializer hands the CDN URL straight to the browser.

Workflow
--------
1. ``python scripts/ingest_documents.py``            # extract + seed (local DB)
2. ``python scripts/upload_documents_to_supabase.py --dry-run``
   # preview: bucket target, storage paths, resulting public URLs
3. ``python scripts/upload_documents_to_supabase.py``
   # ensure a public "documents" bucket, upload every file under
   # data/documents/, and update document_items.file_url in PostgreSQL

Environment
-----------
- ``SUPABASE_URL``            (required; set in backend/.env)
- ``SUPABASE_SECRET_KEY``     (preferred — the modern elevated server-side key
  (``sb_secret_...``) used for the storage admin API). Falls back to the legacy
  ``SUPABASE_SERVICE_ROLE_KEY``, then ``SUPABASE_STORAGE_KEY``, then
  ``SUPABASE_ANON_KEY`` (anon may be blocked by RLS — use a server-side key).

The script always loads ``backend/.env`` (resolved from ``Path(__file__)``) so it
works from any working directory. HTTP requests always send ``apikey``; the
``Authorization: Bearer`` header is only set for legacy JWT keys (anything that
does not start with ``sb_secret_``).

Dependencies: Python standard library + python-dotenv (already used by the
backend) + the app's DB session.
"""
import argparse
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv

try:  # file names contain non-ASCII characters; keep output portable on Windows
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(ENV_PATH)  # guarantee backend/.env is loaded regardless of CWD

sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import DocumentItem  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS_ROOT = REPO_ROOT / "data" / "documents"

BUCKET = "documents"

SUPPORTED = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"}

CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


# Strict key priority: modern secret key first, legacy keys as fallbacks.
KEY_PRIORITY = [
    ("SUPABASE_SECRET_KEY", "SECRET"),
    ("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE"),
    ("SUPABASE_STORAGE_KEY", "STORAGE"),
    ("SUPABASE_ANON_KEY", "ANON"),
]


def describe_key_format(key: str) -> str:
    """Classify a key into a safe, printable format (never prints key content)."""
    if key.startswith("sb_secret_"):
        return "sb_secret_"
    if key.startswith("eyJ"):
        return "JWT (eyJ...)"
    return "other"


def storage_key() -> tuple[str, str]:
    """Resolve the storage API key by strict priority and return ``(key, label)``.

    Prints safe diagnostics (source label, key format, existence) without
    revealing the secret itself.
    """
    resolved = next(
        ((env_name, label) for env_name, label in KEY_PRIORITY if os.environ.get(env_name)),
        None,
    )
    if not resolved:
        raise RuntimeError(
            "No Supabase key found. Set SUPABASE_SECRET_KEY (preferred) or, "
            "for legacy setups, SUPABASE_SERVICE_ROLE_KEY. Fallbacks: "
            "SUPABASE_STORAGE_KEY, SUPABASE_ANON_KEY."
        )
    env_name, label = resolved
    key = os.environ[env_name]
    print(f"[=] Supabase key: source={label} format={describe_key_format(key)} "
          f"found=True ({env_name})")
    return key, label


def supabase_url() -> str:
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    if not url:
        raise RuntimeError("SUPABASE_URL is not configured (see backend/.env)")
    return url


def http_json(method: str, url: str, token: str, body: bytes | None = None, headers: dict | None = None) -> dict:
    """Minimal JSON client for the Supabase Management/Storage REST API.

    ``apikey`` is always sent. ``Authorization: Bearer`` is only added for
    legacy JWT keys — the modern ``sb_secret_...`` format is not a JWT and must
    not be sent as a bearer token.
    """
    headers = dict(headers or {})
    headers["apikey"] = token
    if not token.startswith("sb_secret_"):
        headers["Authorization"] = f"Bearer {token}"
    if body is not None and "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    # Retry loop for network operations against Supabase storage
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode("utf-8")
                try:
                    return resp.status, json.loads(raw) if raw else {}
                except Exception:
                    return resp.status, raw
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            # If 409 Conflict (file exists), return status
            if e.code == 409:
                return 409, err_body
            if attempt == 2:
                raise RuntimeError(f"HTTP {e.code} for {method} {url}: {err_body}") from e
        except (urllib.error.URLError, TimeoutError, Exception) as e:
            if attempt == 2:
                raise RuntimeError(f"Request failed for {method} {url}: {str(e)}") from e
    return 500, "Max retries exceeded"


def ensure_bucket(url: str, token: str, bucket: str) -> None:
    """Create the bucket if missing, and make sure it is public."""
    _, buckets = http_json("GET", f"{url}/storage/v1/bucket", token)
    existing = next((b for b in buckets if b.get("id") == bucket or b.get("name") == bucket), None)
    if existing is None:
        payload = json.dumps({"id": bucket, "name": bucket, "public": True}).encode()
        http_json("POST", f"{url}/storage/v1/bucket", token, body=payload)
        print(f"[+] Created public bucket \"{bucket}\"")
    elif not existing.get("public"):
        payload = json.dumps({"public": True}).encode()
        http_json("PUT", f"{url}/storage/v1/bucket/{bucket}", token, body=payload)
        print(f"[+] Bucket \"{bucket}\" set to public")
    else:
        print(f"[=] Bucket \"{bucket}\" already exists and is public")


def object_public_url(url: str, bucket: str, storage_path: str) -> str:
    """Public URL for an object; percent-encodes the path (spaces etc.) but keeps ``/``."""
    return f"{url}/storage/v1/object/public/{bucket}/{quote(storage_path, safe='/')}"


# Supabase Storage only accepts ASCII object keys, so Devanagari filenames are
# transliterated for the storage path (the local rel / DB file_path is unchanged).
_INDEPENDENT_VOWELS = {
    "अ": "a", "आ": "aa", "इ": "i", "ई": "ii", "उ": "u", "ऊ": "uu",
    "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
}
_CONSONANTS = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v",
    "श": "sh", "ष": "sh", "स": "s", "ह": "h", "ळ": "l",
}
_DEPENDENT_VOWELS = {
    "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
    "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
}


def _to_ascii(ch: str) -> str | None:
    """Return the ASCII rendering of one Devanagari char, or None if not Devanagari."""
    table = {}
    table.update(_INDEPENDENT_VOWELS)
    table.update(_CONSONANTS)
    table.update(_DEPENDENT_VOWELS)
    table.update({"\u0902": "n", "\u0903": "h", "\u0964": ".", "\u0965": ".", "\u093d": "a"})
    return table.get(ch)


def safe_object_key(rel: str) -> str:
    """Transliterate Devanagari to ASCII for the storage path; leave ASCII intact."""
    out: list[str] = []
    for ch in unicodedata.normalize("NFC", rel):
        mapped = _to_ascii(ch)
        if mapped is not None:
            out.append(mapped)
        elif ord(ch) < 128:
            out.append(ch)
        elif ch in ("\u094d", "\u093c") or unicodedata.category(ch).startswith("M"):
            continue  # virama/nukta/combining marks are dropped
        else:
            out.append("_")
    key = "".join(out)
    while "__" in key:
        key = key.replace("__", "_")
    return key.strip(" _.")


def upload_file(url: str, token: str, bucket: str, storage_path: str, local: Path) -> None:
    """Upload a raw file body; ``x-upsert`` makes repeated runs idempotent."""
    raw = local.read_bytes()
    headers = {
        "Content-Type": CONTENT_TYPES.get(local.suffix.lower(), "application/octet-stream"),
        "x-upsert": "true",
        "Content-Length": str(len(raw)),
    }
    dest = f"{url}/storage/v1/object/{bucket}/{quote(storage_path, safe='/')}"
    http_json("POST", dest, token, body=raw, headers=headers)


def collect_files() -> list[tuple[str, Path]]:
    files = []
    for path in sorted(DOCUMENTS_ROOT.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED:
            rel = path.relative_to(DOCUMENTS_ROOT).as_posix()
            files.append((rel, path))
    return files


def update_database(file_url_by_rel: dict[str, str]) -> tuple[int, int]:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    updated = 0
    missing = 0
    try:
        for rel, public_url in file_url_by_rel.items():
            item = db.query(DocumentItem).filter(DocumentItem.file_path == rel).first()
            if not item:
                missing += 1
                print(f"[!] No DB row for file_path={rel}")
                continue
            if item.file_url != public_url:
                item.file_url = public_url
                updated += 1
        db.commit()
    finally:
        db.close()
    return updated, missing


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload data/documents to Supabase Storage and update file_urls.")
    parser.add_argument("--dry-run", action="store_true", help="Preview uploads and target URLs without writing anything.")
    parser.add_argument("--bucket", default=BUCKET, help=f"Storage bucket name (default: {BUCKET})")
    args = parser.parse_args()

    print(f"[=] Loaded .env: {ENV_PATH} (exists={ENV_PATH.exists()})")

    token: str | None = None
    if args.dry_run:
        try:
            token, source = storage_key()
        except RuntimeError as e:
            print(f"[!] {e}")
            source = None
    else:
        token, source = storage_key()
        if source == "ANON":
            print("[!] Using the anon key — storage writes may be blocked by RLS. "
                  "Prefer SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).")

    files = collect_files()
    if not files:
        print("[!] No supported files found under data/documents/ — run ingest_documents.py first.")
        return

    def public_url(storage_path: str) -> str:
        return object_public_url(supabase_url(), args.bucket, storage_path)

    storage_by_rel: dict[str, str] = {}
    used_keys: set[str] = set()
    for rel, _path in files:
        key = safe_object_key(rel)
        base, suffix = key.rsplit(".", 1) if "." in key else (key, "")
        n = 1
        while key in used_keys:
            n += 1
            key = f"{base}_{n}.{suffix}" if suffix else f"{base}_{n}"
        used_keys.add(key)
        storage_by_rel[rel] = key

    print(f"Found {len(files)} documents under {DOCUMENTS_ROOT}")
    if args.dry_run:
        print("--dry-run: no network calls, file uploads, or database writes performed")
        for rel, _path in files:
            print(f"  {rel:<70} -> {public_url(storage_by_rel[rel])}")
        return

    assert token is not None
    url = supabase_url()
    print(f"Target bucket: {args.bucket} on {url}")

    ensure_bucket(url, token, args.bucket)

    uploaded = 0
    file_url_by_rel: dict[str, str] = {}
    for rel, path in files:
        upload_file(url, token, args.bucket, storage_by_rel[rel], path)
        file_url_by_rel[rel] = public_url(storage_by_rel[rel])
        uploaded += 1
        print(f"  [OK] {rel}")

    updated, missing = update_database(file_url_by_rel)
    print(f"Uploaded {uploaded} files; updated {updated} DB rows "
          f"(local file_url stays for {missing} unmatched rows).")


if __name__ == "__main__":
    main()