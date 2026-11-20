"""DataSource model for managing feedback ingestion sources."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class DataSource(Base):
    """Represents a data source (e.g., CSV upload, Google Play, Reddit)."""

    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # csv, manual, playstore, reddit
    config = Column(JSON, default=dict)
    status = Column(String(50), default="active", nullable=False)
    last_import_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    import_jobs = relationship("ImportJob", back_populates="source", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="source", cascade="all, delete-orphan")
