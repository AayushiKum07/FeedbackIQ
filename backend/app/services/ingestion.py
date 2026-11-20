"""Services for feedback ingestion, CSV parsing, demo seeding, and clustering pipeline."""

import csv
import io
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.models.feedback import Feedback, ImportJob, Embedding
from app.models.data_source import DataSource
from app.models.issue import IssueCluster, ClusterMember
from app.ml.sentiment import process_feedback_text
from app.ml.embedder import generate_embeddings, serialize_vector, deserialize_vector
from app.ml.clustering import perform_clustering, find_cluster_representatives
from app.ml.summarizer import extract_keywords, generate_cluster_metadata


SAMPLE_FEEDBACKS = [
    {"text": "Money was deducted from my bank account but not received by merchant. Please refund ASAP!", "date_offset": 1},
    {"text": "App crashed suddenly while transferring 5000 rupees. I don't know if the money went through.", "date_offset": 1},
    {"text": "Payment failed twice but amount debited from my SBI account. Terrible service!", "date_offset": 2},
    {"text": "Transactions keep showing pending status for hours and customer support is unresponsive.", "date_offset": 2},
    {"text": "Transaction timed out, money deducted from bank, refund still pending after 5 days.", "date_offset": 3},
    {"text": "Fingerprint unlock is not working after the latest update. Forces me to type 6-digit pin every time.", "date_offset": 3},
    {"text": "Biometric login keeps failing on Samsung Galaxy S23. Very annoying bug.", "date_offset": 4},
    {"text": "OTP is not arriving when trying to log in on my new phone. Waited for 15 minutes.", "date_offset": 4},
    {"text": "Logged me out automatically and now saying invalid credentials even though password is correct.", "date_offset": 5},
    {"text": "Face ID authentication fails repeatedly in low light environments.", "date_offset": 5},
    {"text": "The app freezes for 10 seconds whenever I open the transaction history tab.", "date_offset": 6},
    {"text": "Extremely slow loading times after updating to version 4.2. Black screen appears for 5 seconds.", "date_offset": 6},
    {"text": "App takes forever to open. High battery drain and phone gets warm while using it.", "date_offset": 7},
    {"text": "Constant stuttering and lag when scrolling through recent payments.", "date_offset": 7},
    {"text": "The app crashes every time I try to scan a QR code with the camera.", "date_offset": 8},
    {"text": "Please add a dark mode! The bright white screen hurts eyes when making payments at night.", "date_offset": 8},
    {"text": "Would love an option to schedule recurring monthly payments for rent and electricity bills.", "date_offset": 9},
    {"text": "Feature request: Allow exporting monthly expense reports in PDF or Excel format.", "date_offset": 10},
    {"text": "Can you please add support for split bill with friends who use different UPI apps?", "date_offset": 11},
    {"text": "Need widget support on iOS and Android home screen for quick balance check.", "date_offset": 12},
    {"text": "Customer support bot is useless. It keeps giving automated generic replies and no human responds.", "date_offset": 13},
    {"text": "Raised a ticket 4 days ago about missing cashback, nobody responded yet.", "date_offset": 14},
    {"text": "Support executive closed my dispute without resolving the debited amount issue.", "date_offset": 15},
    {"text": "Love the clean UI and instant UPI transfers! Much faster than competitors.", "date_offset": 16},
    {"text": "Best payment application. Rewards and cashbacks are genuine, highly recommended!", "date_offset": 17},
    {"text": "Super smooth interface and very reliable. Never had a failed payment so far.", "date_offset": 18},
    {"text": "Bank balance check is instant and UI is very intuitive.", "date_offset": 19},
    {"text": "Scanner is very fast and detects QR codes even in low lighting.", "date_offset": 20},
]


def get_or_create_source(db: Session, name: str, source_type: str) -> DataSource:
    source = db.query(DataSource).filter(DataSource.name == name).first()
    if not source:
        source = DataSource(name=name, type=source_type)
        db.add(source)
        db.commit()
        db.refresh(source)
    return source


def ingest_manual_feedback(db: Session, text: str, source_name: str = "manual") -> Feedback:
    """Ingest a single customer feedback item with immediate sentiment analysis."""
    source = get_or_create_source(db, source_name, "manual")
    nlp_res = process_feedback_text(text)

    fb = Feedback(
        source_id=source.id,
        original_text=text,
        cleaned_text=nlp_res["cleaned_text"],
        sentiment=nlp_res["sentiment"],
        sentiment_score=nlp_res["sentiment_score"],
        priority=nlp_res["priority"],
        feedback_date=datetime.utcnow(),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


def ingest_csv_content(db: Session, file_content: bytes, filename: str) -> Dict[str, Any]:
    """Parse CSV, extract text and date, run sentiment analysis, and save records."""
    source = get_or_create_source(db, f"CSV: {filename}", "csv")

    job = ImportJob(
        source_id=source.id,
        status="processing",
        started_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        # Try decoding with utf-8, fallback to latin-1
        try:
            df = pd.read_csv(io.BytesIO(file_content), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_content), encoding="latin-1")

        # Find the text column
        text_col = None
        for col in df.columns:
            lower = str(col).lower().strip()
            if any(cand in lower for cand in ["text", "review", "content", "comment", "feedback", "body", "description"]):
                text_col = col
                break
        if text_col is None:
            text_col = df.columns[0]  # Fallback to first column

        # Find date column if any
        date_col = None
        for col in df.columns:
            lower = str(col).lower().strip()
            if any(cand in lower for cand in ["date", "time", "created", "timestamp"]):
                date_col = col
                break

        total = len(df)
        processed = 0
        failed = 0

        for _, row in df.iterrows():
            raw_text = str(row[text_col]).strip()
            if not raw_text or raw_text.lower() == "nan":
                failed += 1
                continue

            # Parse date
            fb_date = datetime.utcnow()
            if date_col and pd.notna(row[date_col]):
                try:
                    fb_date = pd.to_datetime(row[date_col]).to_pydatetime()
                except Exception:
                    fb_date = datetime.utcnow()

            nlp_res = process_feedback_text(raw_text)
            fb = Feedback(
                source_id=source.id,
                import_job_id=job.id,
                original_text=raw_text,
                cleaned_text=nlp_res["cleaned_text"],
                sentiment=nlp_res["sentiment"],
                sentiment_score=nlp_res["sentiment_score"],
                priority=nlp_res["priority"],
                feedback_date=fb_date,
            )
            db.add(fb)
            processed += 1

        job.status = "completed"
        job.total_records = total
        job.processed_records = processed
        job.failed_records = failed
        job.completed_at = datetime.utcnow()
        source.last_import_at = datetime.utcnow()
        db.commit()

        return {
            "job_id": job.id,
            "total_records": total,
            "processed_records": processed,
            "failed_records": failed,
            "message": f"Successfully imported {processed} records from {filename}",
        }
    except Exception as e:
        job.status = "failed"
        job.error_log = [str(e)]
        job.completed_at = datetime.utcnow()
        db.commit()
        raise e


def seed_sample_data(db: Session) -> int:
    """Seed realistic customer feedback records."""
    source = get_or_create_source(db, "Demo Data: Google Pay Reviews", "csv")
    created_count = 0

    now = datetime.utcnow()
    for item in SAMPLE_FEEDBACKS:
        existing = db.query(Feedback).filter(Feedback.original_text == item["text"]).first()
        if existing:
            continue

        nlp_res = process_feedback_text(item["text"])
        fb_date = now - timedelta(days=item["date_offset"])

        fb = Feedback(
            source_id=source.id,
            original_text=item["text"],
            cleaned_text=nlp_res["cleaned_text"],
            sentiment=nlp_res["sentiment"],
            sentiment_score=nlp_res["sentiment_score"],
            priority=nlp_res["priority"],
            is_demo_data=True,
            feedback_date=fb_date,
        )
        db.add(fb)
        created_count += 1

    db.commit()
    return created_count


def run_full_clustering_pipeline(db: Session) -> Dict[str, Any]:
    """
    Complete end-to-end clustering pipeline:
    1. Fetch all feedback records (ignoring marked irrelevant)
    2. Generate dense semantic sentence embeddings
    3. Save embeddings in database
    4. Run semantic clustering algorithm (Agglomerative / KMeans)
    5. Generate keywords, technical titles, and LLM/NLP summaries for each cluster
    6. Store issue clusters and assign cluster members
    """
    feedbacks = db.query(Feedback).filter(Feedback.is_irrelevant == False).all()
    if len(feedbacks) < 2:
        return {
            "total_feedback_clustered": len(feedbacks),
            "clusters_created": 0,
            "silhouette_score": 0.0,
            "message": "At least 2 feedback items are required to run clustering.",
        }

    texts = [f.cleaned_text or f.original_text for f in feedbacks]
    feedback_ids = [f.id for f in feedbacks]

    # 1. Generate Embeddings
    embeddings = generate_embeddings(texts)

    # Save embeddings to DB
    for i, fb in enumerate(feedbacks):
        vec_bytes = serialize_vector(embeddings[i])
        existing_emb = db.query(Embedding).filter(Embedding.feedback_id == fb.id).first()
        if existing_emb:
            existing_emb.embedding = vec_bytes
        else:
            emb = Embedding(feedback_id=fb.id, embedding=vec_bytes)
            db.add(emb)
    db.commit()

    # 2. Run Clustering
    labels, sil_score = perform_clustering(embeddings)

    # 3. Clean up old clusters to re-cluster
    db.query(ClusterMember).delete()
    db.query(IssueCluster).delete()
    db.commit()

    unique_labels = sorted(list(set(labels)))
    clusters_created = 0

    for label in unique_labels:
        cluster_indices = [idx for idx, l in enumerate(labels) if l == label]
        cluster_texts = [texts[idx] for idx in cluster_indices]
        cluster_feedbacks = [feedbacks[idx] for idx in cluster_indices]

        # Extract keywords
        keywords = extract_keywords(cluster_texts, top_n=5)

        # Generate Title, Category, and Summary
        meta = generate_cluster_metadata(cluster_texts, keywords)

        # Find representative samples
        representatives = find_cluster_representatives(cluster_indices, embeddings, texts, top_k=3)
        rep_texts = [{"text": r["text"], "similarity": round(r["similarity_to_centroid"], 3)} for r in representatives]

        # Average sentiment and priority of cluster
        avg_sentiment = float(sum(f.sentiment_score for f in cluster_feedbacks) / len(cluster_feedbacks))
        priorities = [f.priority for f in cluster_feedbacks]
        if "critical" in priorities:
            cluster_priority = "critical"
        elif "high" in priorities:
            cluster_priority = "high"
        elif "moderate" in priorities:
            cluster_priority = "moderate"
        else:
            cluster_priority = "low"

        # Create IssueCluster in DB
        cluster = IssueCluster(
            title=meta["title"],
            description=meta.get("summary", ""),
            summary=meta.get("summary", ""),
            primary_category=meta.get("category", "General"),
            status="active",
            feedback_count=len(cluster_feedbacks),
            avg_sentiment_score=round(avg_sentiment, 3),
            priority=cluster_priority,
            keywords=keywords,
            representative_feedback=rep_texts,
        )
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
        clusters_created += 1

        # Create ClusterMember links
        for idx in cluster_indices:
            fb = feedbacks[idx]
            member = ClusterMember(
                cluster_id=cluster.id,
                feedback_id=fb.id,
                similarity_score=1.0,
            )
            db.add(member)

    db.commit()

    return {
        "total_feedback_clustered": len(feedbacks),
        "clusters_created": clusters_created,
        "silhouette_score": round(sil_score, 4),
        "message": f"Successfully created {clusters_created} issue clusters from {len(feedbacks)} customer feedbacks.",
    }

