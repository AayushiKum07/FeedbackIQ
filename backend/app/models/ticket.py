"""GeneratedTicket, EmergingAlert, and DuplicateMatch models."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Text, JSON, ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base


class GeneratedTicket(Base):
    """An engineering ticket generated from an issue cluster."""

    __tablename__ = "generated_tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_id = Column(String(36), ForeignKey("issue_clusters.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Bug")
    suggested_priority = Column(String(20), default="moderate")  # low, moderate, high, critical
    affected_feedback_count = Column(Integer, default=0, nullable=False)
    supporting_evidence = Column(JSON, default=list)
    suggested_actions = Column(JSON, default=list)
    status = Column(String(50), default="draft", nullable=False)  # draft, approved, rejected, pushed
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    devrev_ticket_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    pushed_at = Column(DateTime, nullable=True)

    cluster = relationship("IssueCluster", back_populates="tickets")
    reviewer = relationship("User")


class EmergingAlert(Base):
    """Alert triggered when a complaint frequency spikes."""

    __tablename__ = "emerging_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_id = Column(String(36), ForeignKey("issue_clusters.id"), nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    growth_rate = Column(Float, default=0.0)
    current_count = Column(Integer, default=0)
    previous_count = Column(Integer, default=0)
    time_window = Column(String(50), default="7d")
    explanation = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cluster = relationship("IssueCluster", back_populates="emerging_alerts")


class DuplicateMatch(Base):
    """Potential duplicate match between issue clusters or tickets."""

    __tablename__ = "duplicate_matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_cluster_id = Column(String(36), ForeignKey("issue_clusters.id"), nullable=False)
    target_cluster_id = Column(String(36), ForeignKey("issue_clusters.id"), nullable=False)
    target_ticket_id = Column(String(36), ForeignKey("generated_tickets.id"), nullable=True)
    similarity_score = Column(Float, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, confirmed, rejected
    recommendation = Column(String(50), default="merge")  # merge, update, ignore
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
