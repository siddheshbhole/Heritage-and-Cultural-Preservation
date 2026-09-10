"""Endpoints for the Ministry of Culture Documents section (10 categories).

Documents are populated by :mod:`scripts.ingest_documents`, which extracts the
Ministry's ``Kanak.zip`` archive into ``data/documents/`` and seeds
:class:`DocumentItem` rows. Files are served inline (so PDFs preview in the
browser) through ``GET /api/documents/file/{id}``; ``/static/documents`` is
also mounted in ``main.py`` for direct access.
"""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DocumentCategory, DocumentItem
from ..serializers import document_category_row, document_item_row

router = APIRouter(prefix="/api/documents", tags=["documents"])

DOCUMENTS_ROOT = Path(__file__).resolve().parents[3] / "data" / "documents"


@router.get("/categories")
def document_categories(db: Session = Depends(get_db)):
    """Metadata for every document category, including per-category counts."""
    cats = db.query(DocumentCategory).order_by(DocumentCategory.display_order).all()
    return [
        document_category_row(
            c,
            count=db.query(DocumentItem).filter(DocumentItem.category == c.slug).count(),
        )
        for c in cats
    ]


@router.get("")
def list_documents(
    category: str | None = None,
    search: str | None = None,
    sort_by: str = Query("newest", pattern="^(newest|oldest|title)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Paginated, searchable and sortable list of documents."""
    q = db.query(DocumentItem)
    if category:
        q = q.filter(DocumentItem.category == category)
    if search and search.strip():
        like = f"%{search.strip()}%"
        q = q.filter(
            DocumentItem.title.ilike(like) | DocumentItem.description.ilike(like)
        )

    rows = [document_item_row(d) for d in q.all()]

    if sort_by == "title":
        rows.sort(key=lambda r: (r["title"] or "").lower())
    elif sort_by == "oldest":
        rows.sort(key=lambda r: r["published_date"] or "")
    else:  # newest
        rows.sort(key=lambda r: r["published_date"] or "", reverse=True)

    total = len(rows)
    pages = (total + limit - 1) // limit if total else 0
    start = (page - 1) * limit
    return {
        "items": rows[start : start + limit],
        "total": total,
        "page": page,
        "per_page": limit,
        "pages": pages,
    }


@router.get("/file/{document_id}")
def document_file(document_id: int, db: Session = Depends(get_db)):
    """Stream a document inline, or redirect to its CDN copy when remote.

    Local PDFs render inside the browser viewer via ``FileResponse``. If the
    file is only available remotely (e.g. deployed without ``data/documents/``
    but ``file_url`` points at Supabase Storage), a ``308`` redirect sends the
    client straight to the CDN so the viewer keeps working.
    """
    item = db.get(DocumentItem, document_id)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found")

    if item.file_path:
        root = DOCUMENTS_ROOT.resolve()
        candidate = (root / item.file_path).resolve()
        if candidate.is_relative_to(root) and candidate.is_file():
            return FileResponse(candidate)

    if item.file_url and item.file_url.startswith(("http://", "https://")):
        return RedirectResponse(item.file_url, status_code=308)

    raise HTTPException(status_code=404, detail="Document file not found")


@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Detailed metadata for a single document."""
    item = db.get(DocumentItem, document_id)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_item_row(item)