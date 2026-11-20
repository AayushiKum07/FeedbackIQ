"""API endpoints for customer feedback management."""

from typing import Optional
from math import ceil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import ClusterMember, IssueCluster
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackListResponse,
    CSVUploadResponse,
)
from app.services.ingestion import (
    ingest_manual_feedback,
    ingest_csv_content,
    seed_sample_data,
)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("", response_model=FeedbackListResponse)
def list_feedback(
    search: Optional[str] = Query(None, description="Search query in feedback text"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment: positive, neutral, negative"),
    priority: Optional[str] = Query(None, description="Filter by priority: critical, high, moderate, low"),
    is_irrelevant: Optional[bool] = Query(None, description="Filter by relevance"),
    cluster_id: Optional[str] = Query(None, description="Filter by issue cluster ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve paginated and filtered customer feedback records."""
    query = db.query(Feedback)

    if is_irrelevant is not None:
        query = query.filter(Feedback.is_irrelevant == is_irrelevant)

    if sentiment:
        query = query.filter(Feedback.sentiment == sentiment.lower())

    if priority:
        query = query.filter(Feedback.priority == priority.lower())

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Feedback.original_text.ilike(search_filter),
                Feedback.cleaned_text.ilike(search_filter),
            )
        )

    if cluster_id:
        query = query.join(ClusterMember, Feedback.id == ClusterMember.feedback_id).filter(
            ClusterMember.cluster_id == cluster_id
        )

    total = query.count()
    items = (
        query.order_by(desc(Feedback.feedback_date))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Attach cluster titles if any
    res_items = []
    for item in items:
        cluster_info = (
            db.query(IssueCluster.id, IssueCluster.title)
            .join(ClusterMember, IssueCluster.id == ClusterMember.cluster_id)
            .filter(ClusterMember.feedback_id == item.id)
            .first()
        )
        res_items.append(
            FeedbackResponse(
                id=item.id,
                original_text=item.original_text,
                cleaned_text=item.cleaned_text,
                sentiment=item.sentiment,
                sentiment_score=item.sentiment_score,
                priority=item.priority,
                is_irrelevant=item.is_irrelevant,
                is_demo_data=item.is_demo_data,
                feedback_date=item.feedback_date,
                created_at=item.created_at,
                source_name=item.source.name if item.source else "Unknown",
                cluster_id=cluster_info[0] if cluster_info else None,
                cluster_title=cluster_info[1] if cluster_info else None,
            )
        )

    return FeedbackListResponse(
        items=res_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/manual", response_model=FeedbackResponse)
def add_manual_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
):
    """Add a customer feedback manually with instant sentiment and priority analysis."""
    fb = ingest_manual_feedback(db, text=payload.text, source_name=payload.source_name or "manual")
    return FeedbackResponse(
        id=fb.id,
        original_text=fb.original_text,
        cleaned_text=fb.cleaned_text,
        sentiment=fb.sentiment,
        sentiment_score=fb.sentiment_score,
        priority=fb.priority,
        is_irrelevant=fb.is_irrelevant,
        is_demo_data=fb.is_demo_data,
        feedback_date=fb.feedback_date,
        created_at=fb.created_at,
        source_name=fb.source.name if fb.source else "manual",
    )


@router.post("/csv-upload", response_model=CSVUploadResponse)
async def upload_csv_feedback(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload customer feedback via CSV file with auto column detection and NLP."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        res = ingest_csv_content(db, content, file.filename)
        return CSVUploadResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


@router.post("/seed")
def seed_demo_feedback(db: Session = Depends(get_db)):
    """Seed sample realistic customer feedback to populate the platform immediately."""
    count = seed_sample_data(db)
    return {"message": f"Successfully seeded {count} new demo feedback records."}


@router.patch("/{feedback_id}/irrelevant")
def toggle_feedback_irrelevant(
    feedback_id: str,
    db: Session = Depends(get_db),
):
    """Toggle the irrelevant flag on a feedback item."""
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.is_irrelevant = not fb.is_irrelevant
    db.commit()
    return {"id": fb.id, "is_irrelevant": fb.is_irrelevant}

