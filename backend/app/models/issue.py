"""IssueCluster and ClusterMember models for issue intelligence."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Text, JSON, ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base


class IssueCluster(Base):
    """A semantically grouped cluster of customer complaints."""

    __tablename__ = "issue_clusters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    primary_category = Column(String(100), default="General")
    secondary_category = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, merged, archived
    feedback_count = Column(Integer, default=0, nullable=False)
    avg_sentiment_score = Column(Float, default=0.0)
    priority = Column(String(20), default="moderate")  # low, moderate, high, critical
    keywords = Column(JSON, default=list)
    representative_feedback = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    members = relationship("ClusterMember", back_populates="cluster", cascade="all, delete-orphan")
    tickets = relationship("GeneratedTicket", back_populates="cluster", cascade="all, delete-orphan")
    emerging_alerts = relationship("EmergingAlert", back_populates="cluster", cascade="all, delete-orphan")


class ClusterMember(Base):
    """Mapping between an issue cluster and an individual feedback record."""

    __tablename__ = "cluster_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_id = Column(String(36), ForeignKey("issue_clusters.id"), nullable=False)
    feedback_id = Column(String(36), ForeignKey("feedbacks.id"), unique=True, nullable=False)
    similarity_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cluster = relationship("IssueCluster", back_populates="members")
    feedback = relationship("Feedback", back_populates="cluster_membership")
