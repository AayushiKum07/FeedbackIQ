"""EvaluationResult model for storing system performance metrics."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, JSON
from app.database import Base


class EvaluationResult(Base):
    """Stores calculated evaluation metrics for ML models and pipelines."""

    __tablename__ = "evaluation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    evaluation_type = Column(String(50), nullable=False)  # clustering, classification, duplicate_detection
    details = Column(JSON, default=dict)
    evaluated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
