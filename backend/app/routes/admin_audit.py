from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import AuditLog

router = APIRouter(prefix="/api/admin/audit", tags=["admin-audit"])

@router.get("/")
def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    model_name: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Retrieve audit logs with filtering and pagination."""
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if model_name:
        query = query.filter(AuditLog.model_name == model_name.lower())
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    logs = (
        query.order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "user_id": l.user_id,
            "user_email": l.user_email,
            "action": l.action,
            "model_name": l.model_name,
            "record_id": l.record_id,
            "details": l.details,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 1,
    }
