"""FeedbackIQ FastAPI main entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
import app.models  # Ensure all models are registered
from app.api.router import api_router
from app.services.ingestion import seed_sample_data, run_full_clustering_pipeline
from app.models.feedback import Feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Check if database is empty; if so, auto-seed with sample feedback and cluster
    db: Session = SessionLocal()
    try:
        count = db.query(Feedback).count()
        if count == 0:
            print("Database empty. Seeding realistic sample feedback data...")
            seed_sample_data(db)
            print("Running initial clustering pipeline on sample data...")
            run_full_clustering_pipeline(db)
            print("Sample data & issue clusters ready!")
    except Exception as e:
        print(f"Startup initialization notice: {e}")
    finally:
        db.close()

    yield


app = FastAPI(
    title="FeedbackIQ API",
    description="AI-Powered Customer Feedback Intelligence and Automated Issue Discovery Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "online",
        "app": "FeedbackIQ",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "feedback": "/api/feedback",
            "issues": "/api/issues",
            "analytics": "/api/analytics/overview",
        },
    }

