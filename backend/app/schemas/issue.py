"""Pydantic schemas for issue intelligence and clustering."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ClusterMemberResponse(BaseModel):
    id: str
    feedback_id: str
    text: str
    sentiment: str
    priority: str
    feedback_date: datetime
    similarity_score: float


class IssueClusterResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    summary: Optional[str] = None
    primary_category: str
    secondary_category: Optional[str] = None
    status: str
    feedback_count: int
    avg_sentiment_score: float
    priority: str
    keywords: List[str]
    representative_feedback: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IssueClusterDetail(IssueClusterResponse):
    members: List[ClusterMemberResponse] = []


class ClusteringRunResponse(BaseModel):
    total_feedback_clustered: int
    clusters_created: int
    silhouette_score: float
    message: str


class TimeSeriesPoint(BaseModel):
    date: str
    count: int


class EmergingIssueOut(BaseModel):
    issue_id: str
    issue_name: str
    category: str
    severity: str  # critical, high, medium
    current_count: int
    baseline_avg: float
    increase_pct: float
    z_score: float
    detection_reason: str
    window_start: datetime
    window_end: datetime
    trend: List[TimeSeriesPoint]


