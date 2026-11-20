"""Main API router combining all endpoint modules."""

from fastapi import APIRouter
from app.api.feedback import router as feedback_router
from app.api.issues import router as issues_router
from app.api.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(feedback_router)
api_router.include_router(issues_router)
api_router.include_router(analytics_router)

