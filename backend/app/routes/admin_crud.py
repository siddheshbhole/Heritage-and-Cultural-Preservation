import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import String, Text, Integer, Float, DateTime, Boolean, inspect, or_
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from .. import models
from ..models import AuditLog

router = APIRouter(prefix="/api/admin/crud", tags=["admin-crud"])

# Helper to map SQLAlchemy column types to simple JSON schema types
def _get_column_type(column) -> str:
    col_type = column.type
    if isinstance(col_type, Integer):
        return "integer"
    elif isinstance(col_type, Float):
        return "float"
    elif isinstance(col_type, Boolean):
        return "boolean"
    elif isinstance(col_type, DateTime):
        return "datetime"
    elif isinstance(col_type, Text):
        return "text"
    else:
        return "string"

# Map model class names to human readable categories
MODEL_DOMAINS = {
    "District": "Geography",
    "State": "Geography",
    "MinistryEntity": "Governance",
    "Language": "Culture",
    "HeritageSite": "Heritage",
    "IntangibleHeritage": "Heritage",
    "TraditionalKnowledge": "Culture",
    "CulturalArtifact": "Heritage",
    "LivingTradition": "Culture",
    "OralTradition": "Culture",
    "PerformingArt": "Culture",
    "TraditionalCraft": "Culture",
    "FestiveEvent": "Culture",
    "KnowledgeSystem": "Culture",
    "Manuscript": "Publications",
    "MonumentsRecord": "Heritage",
    "ArchaeologicalSite": "Heritage",
    "MuseumArtifact": "Heritage",
    "ArchivalRecord": "Publications",
    "ResearchPaper": "Publications",
    "CulturalPolicy": "Governance",
    "ConservationProject": "Governance",
    "GrantScheme": "Governance",
    "CommunityPost": "Community",
    "Provenance": "Governance",
    "TrendingItem": "Media",
    "MediaNews": "Media",
    "MediaAlbum": "Media",
    "MediaVideo": "Media",
    "MediaBrochure": "Media",
    "MediaLeader": "Media",
    "MediaMonument": "Media",
    "MediaArtist": "Media",
    "MediaSanskriti": "Media",
    "MediaEvent": "Media",
    "MediaWebcast": "Media",
    "AuditLog": "System",
}

# Discover all model classes from models.py
MODEL_MAP: Dict[str, Any] = {}
for attr_name in dir(models):
    attr = getattr(models, attr_name)
    if isinstance(attr, type) and hasattr(attr, "__tablename__") and attr_name != "Base":
        # Key by snake_case table name or model name (lowercase)
        key = attr.__tablename__
        MODEL_MAP[key] = attr
        MODEL_MAP[attr_name.lower()] = attr

def _get_model_class(model_key: str):
    key = model_key.lower()
    if key in MODEL_MAP:
        return MODEL_MAP[key]
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Model '{model_key}' not found.",
    )

def _inspect_model_fields(model_cls) -> List[Dict[str, Any]]:
    mapper = inspect(model_cls)
    fields = []
    for column in mapper.columns:
        fields.append({
            "name": column.name,
            "type": _get_column_type(column),
            "primary_key": column.primary_key,
            "nullable": column.nullable,
            "editable": not column.primary_key,
        })
    return fields

def _model_to_dict(obj) -> Dict[str, Any]:
    mapper = inspect(obj.__class__)
    res = {}
    for column in mapper.columns:
        val = getattr(obj, column.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        res[column.name] = val
    return res

def _log_audit(db: Session, admin_user: dict, action: str, model_name: str, record_id: str, details: dict):
    try:
        log = AuditLog(
            user_id=admin_user.get("id", "admin"),
            user_email=admin_user.get("email", ""),
            action=action,
            model_name=model_name,
            record_id=str(record_id),
            details=json.dumps(details, default=str),
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
        db.rollback()


@router.get("/models")
def get_model_registry(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Return schema metadata and row counts for all manageable database models."""
    registry = []
    # Avoid duplicates if mapped by both table_name and class_name
    seen_classes = set()
    
    for key, model_cls in MODEL_MAP.items():
        if model_cls in seen_classes:
            continue
        seen_classes.add(model_cls)
        
        class_name = model_cls.__name__
        table_name = model_cls.__tablename__
        count = db.query(model_cls).count()
        fields = _inspect_model_fields(model_cls)
        domain = MODEL_DOMAINS.get(class_name, "General")

        registry.append({
            "key": table_name,
            "class_name": class_name,
            "table_name": table_name,
            "domain": domain,
            "count": count,
            "fields": fields,
        })

    registry.sort(key=lambda x: (x["domain"], x["class_name"]))
    return registry


@router.get("/{model_key}")
def list_records(
    model_key: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: Optional[str] = "id",
    order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """List records for a specific model with pagination, search, and sorting."""
    model_cls = _get_model_class(model_key)
    query = db.query(model_cls)

    # Search in string/text columns
    if search:
        mapper = inspect(model_cls)
        search_clauses = []
        pattern = f"%{search}%"
        for col in mapper.columns:
            if isinstance(col.type, (String, Text)):
                search_clauses.append(getattr(model_cls, col.name).ilike(pattern))
        if search_clauses:
            query = query.filter(or_(*search_clauses))

    total = query.count()

    # Sorting
    mapper = inspect(model_cls)
    sort_col = getattr(model_cls, sort_by, None) if sort_by in mapper.columns else getattr(model_cls, "id", None)
    if sort_col is not None:
        if order.lower() == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

    records = query.offset((page - 1) * per_page).limit(per_page).all()
    items = [_model_to_dict(r) for r in records]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 1,
    }


@router.get("/{model_key}/{record_id}")
def get_record(
    model_key: str,
    record_id: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Fetch a single record by primary key."""
    model_cls = _get_model_class(model_key)
    rec = db.query(model_cls).filter(model_cls.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} in '{model_key}' not found.",
        )
    return _model_to_dict(rec)


@router.post("/{model_key}")
def create_record(
    model_key: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Create a new record in model table."""
    model_cls = _get_model_class(model_key)
    mapper = inspect(model_cls)

    # Filter payload attributes to match model columns
    cleaned = {}
    for col in mapper.columns:
        if col.primary_key and col.name not in payload:
            continue
        if col.name in payload:
            val = payload[col.name]
            # Convert types if needed
            if isinstance(col.type, Integer) and val is not None and val != "":
                val = int(val)
            elif isinstance(col.type, Float) and val is not None and val != "":
                val = float(val)
            cleaned[col.name] = val

    try:
        new_obj = model_cls(**cleaned)
        db.add(new_obj)
        db.commit()
        db.refresh(new_obj)

        rec_dict = _model_to_dict(new_obj)
        _log_audit(db, admin_user, "CREATE", model_cls.__tablename__, str(rec_dict.get("id", "new")), rec_dict)
        return rec_dict
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create record: {str(err)}",
        )


@router.put("/{model_key}/{record_id}")
def update_record(
    model_key: str,
    record_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Update an existing record."""
    model_cls = _get_model_class(model_key)
    rec = db.query(model_cls).filter(model_cls.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} in '{model_key}' not found.",
        )

    mapper = inspect(model_cls)
    changes = {}
    for col in mapper.columns:
        if col.primary_key:
            continue
        if col.name in payload:
            val = payload[col.name]
            if isinstance(col.type, Integer) and val is not None and val != "":
                val = int(val)
            elif isinstance(col.type, Float) and val is not None and val != "":
                val = float(val)
            old_val = getattr(rec, col.name)
            if old_val != val:
                changes[col.name] = {"old": old_val, "new": val}
                setattr(rec, col.name, val)

    try:
        db.commit()
        db.refresh(rec)
        rec_dict = _model_to_dict(rec)
        _log_audit(db, admin_user, "UPDATE", model_cls.__tablename__, str(record_id), changes)
        return rec_dict
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update record: {str(err)}",
        )


@router.delete("/{model_key}/{record_id}")
def delete_record(
    model_key: str,
    record_id: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Delete a record."""
    model_cls = _get_model_class(model_key)
    rec = db.query(model_cls).filter(model_cls.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} in '{model_key}' not found.",
        )

    try:
        old_data = _model_to_dict(rec)
        db.delete(rec)
        db.commit()
        _log_audit(db, admin_user, "DELETE", model_cls.__tablename__, str(record_id), old_data)
        return {"message": f"Record #{record_id} deleted successfully from '{model_key}'."}
    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete record: {str(err)}",
        )
