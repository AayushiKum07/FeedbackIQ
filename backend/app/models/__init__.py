"""Import all models so they are registered with SQLAlchemy Base."""

from app.models.user import User
from app.models.data_source import DataSource
from app.models.feedback import ImportJob, Feedback, Embedding
from app.models.issue import IssueCluster, ClusterMember
from app.models.ticket import GeneratedTicket, EmergingAlert, DuplicateMatch
from app.models.integration import IntegrationConfig, IntegrationLog
from app.models.evaluation import EvaluationResult

__all__ = [
    "User",
    "DataSource",
    "ImportJob",
    "Feedback",
    "Embedding",
    "IssueCluster",
    "ClusterMember",
    "GeneratedTicket",
    "EmergingAlert",
    "DuplicateMatch",
    "IntegrationConfig",
    "IntegrationLog",
    "EvaluationResult",
]
