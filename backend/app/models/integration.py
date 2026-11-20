"""IntegrationConfig and IntegrationLog models for DevRev sync."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class IntegrationConfig(Base):
    """Configuration for third-party integrations (e.g., DevRev)."""

    __tablename__ = "integration_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String(50), default="devrev", nullable=False)
    credentials_encrypted = Column(JSON, default=dict)
    field_mapping = Column(JSON, default=dict)
    status = Column(String(50), default="inactive", nullable=False)
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    logs = relationship("IntegrationLog", back_populates="config", cascade="all, delete-orphan")


class IntegrationLog(Base):
    """Audit log for integration synchronization events."""

    __tablename__ = "integration_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id = Column(String(36), ForeignKey("integration_configs.id"), nullable=False)
    ticket_id = Column(String(36), ForeignKey("generated_tickets.id"), nullable=True)
    action = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    response_data = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    config = relationship("IntegrationConfig", back_populates="logs")
