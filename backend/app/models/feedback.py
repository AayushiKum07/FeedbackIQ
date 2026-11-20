"""Feedback, ImportJob, and Embedding models."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, Integer, Float, Text, JSON,
    ForeignKey, LargeBinary,
)
from sqlalchemy.orm import relationship
from app.database import Base


class ImportJob(Base):
    """Tracks a batch import of feedback records."""

    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=False)
    status = Column(String(50), default="pending", nullable=False)
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    error_log = Column(JSON, default=list)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    source = relationship("DataSource", back_populates="import_jobs")
    feedbacks = relationship("Feedback", back_populates="import_job")


class Feedback(Base):
    """A single piece of customer feedback."""

    __tablename__ = "feedbacks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)
    import_job_id = Column(String(36), ForeignKey("import_jobs.id"), nullable=True)
    original_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    detected_language = Column(String(10), default="en")
    sentiment = Column(String(20), default="neutral")  # positive, neutral, negative
    sentiment_score = Column(Float, default=0.0)  # compound score between -1.0 and 1.0
    priority = Column(String(20), default="moderate")  # low, moderate, high, critical
    raw_metadata = Column(JSON, default=dict)
    is_demo_data = Column(Boolean, default=False)
    is_irrelevant = Column(Boolean, default=False)
    feedback_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    source = relationship("DataSource", back_populates="feedbacks")
    import_job = relationship("ImportJob", back_populates="feedbacks")
    embedding = relationship("Embedding", back_populates="feedback", uselist=False, cascade="all, delete-orphan")
    cluster_membership = relationship("ClusterMember", back_populates="feedback", uselist=False, cascade="all, delete-orphan")


class Embedding(Base):
    """Vector embedding for a feedback item."""

    __tablename__ = "embeddings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feedback_id = Column(String(36), ForeignKey("feedbacks.id"), unique=True, nullable=False)
    embedding = Column(LargeBinary, nullable=False)  # serialized numpy float array or list
    model_name = Column(String(100), default="tfidf-svd-384")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    feedback = relationship("Feedback", back_populates="embedding")
