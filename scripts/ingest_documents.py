"""Extract the Ministry of Culture document archive (``Kanak.zip``) into
``data/documents/`` and seed the Documents API.

The archive ships as ``Kanak.zip`` in the repository root with a top-level
``Documents/`` folder; each sub-folder maps to one of the ten canonical
document categories. Run from the repository root:

    python scripts/ingest_documents.py            # extract + seed
    python scripts/ingest_documents.py --dry-run  # preview only (no writes)
"""
import argparse
import re
import sys
import zipfile
from datetime import date
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import DocumentCategory, DocumentItem  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = REPO_ROOT / "Kanak.zip"
DOCUMENTS_ROOT = REPO_ROOT / "data" / "documents"

# Canonical categories in the strict navigation order used by the frontend.
CATEGORIES = [
    ("reports", "Reports", "Annual reports, committee findings and official reviews.", None),
    ("act-and-policies", "Act and Policies", "Acts, rules and policies made under the Ministry of Culture.", None),
    ("circular-orders-notices", "Circular, Orders and Notices", "Government circulars, orders and administrative notices.", None),
    ("publications", "Publications", "Official publications, dictionaries and compilations.", None),
    ("mou-others", "MoU / Others", "Memoranda of Understanding with partner organisations.", None),
    ("press-release", "Press Release", "Official press releases and announcements.", None),
    ("gazettes-notifications", "Gazettes Notifications", "Gazette notifications and statutory orders.", None),
    ("guidelines", "Guidelines", "Guidelines for schemes, grants and cultural programmes.", None),
    ("e-sanskriti", "E-Sanskriti", "Sanskriti Patrika and e-publications.", None),
    ("schemes", "Schemes", "Scheme guidelines, forms and related documents.", None),
]

# Folder names inside the archive -> canonical category slug.
ZIP_FOLDER_MAP = {
    "acts and policies": "act-and-policies",
    "e-sanskriti": "e-sanskriti",
    "gazettes notifications": "gazettes-notifications",
    "guidelines": "guidelines",
    "mou with organizations": "mou-others",
    "press release": "press-release",
    "publicatinons": "publications",  # typo is preserved in the archive itself
    "reports": "reports",
    "schemes": "schemes",
    "circular, orders and notices": "circular-orders-notices",
}

SUPPORTED = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"}

# Cap the total relative path (below the win32 MAX_PATH budget — this repo
# lives under OneDrive which does not enable LongPathsEnabled by default).
MAX_LEAF_LENGTH = 120


def unique_leaf(rel_leaf: str, used: set[str]) -> Path:
    """Truncate a file name to MAX_LEAF_LENGTH and make it unique per category.

    The archive is flattened into ``data/documents/<category>/`` so long
    sub-folder names (which exceed win32 path budgets on OneDrive) are never
    created; collisions across sub-folders get ``_2``, ``_3`` … suffixes.
    """
    leaf = Path(rel_leaf)
    suffix = leaf.suffix[:12]
    stem = leaf.stem
    max_stem = max(8, MAX_LEAF_LENGTH - len(suffix))
    if len(stem) > max_stem:
        stem = stem[:max_stem]
    stem = "".join(ch for ch in stem if ch not in '<>:"/\\|?*').strip()
    if not stem:
        stem = "document"

    for i in range(1, 10000):
        suffix_i = "" if i == 1 else f"_{i}"
        candidate = f"{stem}{suffix_i}{suffix}"
        if candidate not in used:
            used.add(candidate)
            return Path(candidate)
    raise RuntimeError(f"Could not allocate a unique leaf for {rel_leaf!r}")

# Best-effort date extraction from file names, e.g.:
#   ...Act1958_12.03.2018.pdf      -> 2021-11-10 from 10.11.2021
#   ..._26_05032024.pdf            -> 2024-03-05
#   ..._31_12_2019.pdf             -> 2019-12-31
_DATE_PATTERNS = [
    re.compile(r"(?<!\d)(\d{1,2})[._](\d{1,2})[._](\d{4})(?!\d)"),
    re.compile(r"(?<!\d)(\d{1,2})[._](\d{1,2})[._](\d{2})(?!\d)"),
    re.compile(r"(?<!\d)(\d{2})(\d{2})(\d{4})(?!\d)"),
]


def parse_date(name: str) -> str | None:
    for pat in _DATE_PATTERNS:
        m = pat.search(name)
        if not m:
            continue
        groups = m.groups()
        if len(groups) == 3:
            if len(groups[2]) == 4:
                d, mo, y = int(groups[0]), int(groups[1]), int(groups[2])
            else:
                d, mo, y = int(groups[0]), int(groups[1]), 2000 + int(groups[2])
        else:
            d, mo, y = int(groups[0]), int(groups[1]), int(groups[2])
        try:
            return date(y, mo, d).isoformat()
        except ValueError:
            continue
    return None


def clean_title(stem: str) -> str:
    title = stem.strip()
    if not title:
        return "Document"
    # Collapse underscores/padded dashes left by official file naming.
    title = re.sub(r"[_\s]+", " ", title)
    title = re.sub(r"\s{2,}", " ", title).strip()
    return title[:200] or "Document"


def filename_text(name: str) -> str:
    """Best-effort decode of filename bytes for archives using cp437 names."""
    try:
        return name.encode("cp437").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return name


def slugify_stem(stem: str, fallback_index: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return slug[:80] or f"doc-{fallback_index}"


def extract_archive(dry_run: bool) -> dict[str, int]:
    """Extract ``Kanak.zip`` into per-category folders; returns file counts."""
    counts: dict[str, int] = dict.fromkeys((c[0] for c in CATEGORIES), 0)
    if not ZIP_PATH.exists():
        print(f"[!] Archive not found: {ZIP_PATH}")
        return counts

    with zipfile.ZipFile(ZIP_PATH) as zf:
        infos = [i for i in zf.infolist() if not i.is_dir()]
        print(f"Archive contains {len(infos)} files")
        used_names: dict[str, set[str]] = {}
        for info in infos:
            parts = Path(info.filename).parts
            if len(parts) < 3 or parts[0].lower() != "documents":
                continue
            folder = parts[1].strip().lower()
            slug = ZIP_FOLDER_MAP.get(folder)
            if not slug:
                continue
            cat_dir = DOCUMENTS_ROOT / slug
            used = used_names.setdefault(slug, set())
            leaf = unique_leaf(rel_leaf=Path(*parts[2:]).name, used=used)
            destination = cat_dir / leaf
            if not dry_run:
                destination.parent.mkdir(parents=True, exist_ok=True)
                if not destination.exists() or destination.stat().st_size != info.file_size:
                    with zf.open(info) as src, open(destination, "wb") as out:
                        out.write(src.read())
            counts[slug] += 1

    if dry_run:
        print("--dry-run: nothing was extracted")
    else:
        print(f"Extracted into {DOCUMENTS_ROOT}")
    for slug, n in counts.items():
        print(f"  {slug:<26} {n:>4} files")
    return counts


def seed_database():
    """Upsert categories and index every supported file under data/documents/."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for order, (slug, name, desc, _icon) in enumerate(CATEGORIES, start=1):
            cat = db.query(DocumentCategory).filter(DocumentCategory.slug == slug).first()
            if not cat:
                cat = DocumentCategory(slug=slug, name=name, description=desc, display_order=order)
                db.add(cat)

        db.flush()

        added = 0
        skipped_files = 0
        doc_index = 1
        for slug, _name, _desc, _icon in CATEGORIES:
            cat_dir = DOCUMENTS_ROOT / slug
            if not cat_dir.exists():
                continue
            for path in sorted(cat_dir.rglob("*")):
                if not path.is_file() or path.suffix.lower() not in SUPPORTED:
                    continue
                rel = path.relative_to(DOCUMENTS_ROOT).as_posix()
                stem_text = filename_text(path.stem)
                title = clean_title(stem_text)

                exists = (
                    db.query(DocumentItem)
                    .filter(
                        DocumentItem.category == slug,
                        DocumentItem.title == title,
                    )
                    .first()
                )
                if exists:
                    skipped_files += 1
                    continue

                item = DocumentItem(
                    title=title,
                    slug=slugify_stem(stem_text, doc_index),
                    category=slug,
                    file_path=rel,
                    file_url=f"/static/documents/{rel}",
                    file_type=path.suffix.lower().lstrip("."),
                    file_size=path.stat().st_size,
                    published_date=parse_date(path.stem),
                    description=f"Official {path.suffix.lower().lstrip('.').upper()} document published by the Ministry of Culture, Government of India.",
                    sort_order=0,
                    created_at=date.today().isoformat(),
                )
                db.add(item)
                added += 1
                doc_index += 1

        db.commit()
        print(f"Seeded {added} new documents; {skipped_files} already indexed")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest the Ministry of Culture document archive.")
    parser.add_argument("--dry-run", action="store_true", help="List what would happen without extracting or seeding.")
    args = parser.parse_args()

    counts = extract_archive(dry_run=args.dry_run)
    if not any(counts.values()):
        print("[!] No documents found in the archive for known categories.")
        return
    if not args.dry_run:
        seed_database()


if __name__ == "__main__":
    main()