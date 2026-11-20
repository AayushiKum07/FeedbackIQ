"""API endpoints for issue intelligence, clustering, and cluster details."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.issue import IssueCluster, ClusterMember
from app.models.feedback import Feedback
from app.schemas.issue import (
    IssueClusterResponse,
    IssueClusterDetail,
    ClusterMemberResponse,
    ClusteringRunResponse,
    EmergingIssueOut,
)
from app.ml.anomaly import detect_emerging_issues
from app.services.ingestion import run_full_clustering_pipeline

router = APIRouter(prefix="/issues", tags=["Issues & Clustering"])


@router.get("", response_model=List[IssueClusterResponse])
def list_issues(
    category: Optional[str] = Query(None, description="Filter by primary category"),
    priority: Optional[str] = Query(None, description="Filter by priority: critical, high, moderate, low"),
    db: Session = Depends(get_db),
):
    """Retrieve all discovered issue clusters."""
    query = db.query(IssueCluster).filter(IssueCluster.status == "active")

    if category:
        query = query.filter(IssueCluster.primary_category == category)
    if priority:
        query = query.filter(IssueCluster.priority == priority.lower())

    clusters = query.order_by(desc(IssueCluster.feedback_count)).all()
    return clusters


@router.get("/emerging", response_model=List[EmergingIssueOut])
def get_emerging_issues(
    lookback_days: int = Query(7, ge=3, le=30, description="Lookback window in days (min 3, max 30)"),
    db: Session = Depends(get_db),
):
    """
    Detect emerging issue clusters whose complaint volume is suddenly spiking
    compared to their historical baseline.
    """
    alerts = detect_emerging_issues(db=db, lookback_days=lookback_days)
    return alerts


@router.get("/{cluster_id}", response_model=IssueClusterDetail)
def get_issue_detail(
    cluster_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve an issue cluster and all of its associated feedback members."""
    cluster = db.query(IssueCluster).filter(IssueCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Issue cluster not found")

    memberships = (
        db.query(ClusterMember, Feedback)
        .join(Feedback, ClusterMember.feedback_id == Feedback.id)
        .filter(ClusterMember.cluster_id == cluster_id)
        .order_by(desc(ClusterMember.similarity_score))
        .all()
    )

    member_responses = []
    for member, fb in memberships:
        member_responses.append(
            ClusterMemberResponse(
                id=member.id,
                feedback_id=fb.id,
                text=fb.original_text,
                sentiment=fb.sentiment,
                priority=fb.priority,
                feedback_date=fb.feedback_date,
                similarity_score=member.similarity_score,
            )
        )

    res = IssueClusterDetail(
        id=cluster.id,
        title=cluster.title,
        description=cluster.description,
        summary=cluster.summary,
        primary_category=cluster.primary_category,
        secondary_category=cluster.secondary_category,
        status=cluster.status,
        feedback_count=cluster.feedback_count,
        avg_sentiment_score=cluster.avg_sentiment_score,
        priority=cluster.priority,
        keywords=cluster.keywords or [],
        representative_feedback=cluster.representative_feedback or [],
        created_at=cluster.created_at,
        updated_at=cluster.updated_at,
        members=member_responses,
    )
    return res


@router.post("/cluster", response_model=ClusteringRunResponse)
def trigger_clustering(db: Session = Depends(get_db)):
    """
    Trigger end-to-end clustering on all feedback:
    Generates sentence embeddings, groups semantically similar feedback,
    and generates meaningful names and summaries using LLM / advanced NLP.
    """
    try:
        res = run_full_clustering_pipeline(db)
        return ClusteringRunResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering failed: {str(e)}")

