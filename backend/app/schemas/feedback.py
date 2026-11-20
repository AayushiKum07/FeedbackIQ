"""Pydantic schemas for feedback ingestion and exploration."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    text: str = Field(..., min_length=2, description="Customer feedback comment or review")
    source_name: Optional[str] = "manual"
    feedback_date: Optional[datetime] = None
    raw_metadata: Optional[Dict[str, Any]] = None


class FeedbackResponse(BaseModel):
    id: str
    original_text: str
    cleaned_text: Optional[str] = None
    sentiment: str
    sentiment_score: float
    priority: str
    is_irrelevant: bool
    is_demo_data: bool
    feedback_date: datetime
    created_at: datetime
    source_name: Optional[str] = None
    cluster_id: Optional[str] = None
    cluster_title: Optional[str] = None

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    items: List[FeedbackResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CSVUploadResponse(BaseModel):
    job_id: str
    total_records: int
    processed_records: int
    failed_records: int
    message: str
