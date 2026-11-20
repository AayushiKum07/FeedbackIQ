"""API endpoints for dashboard analytics, KPI metrics, trends, and key insights."""

from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import IssueCluster
from app.schemas.analytics import (
    OverviewStats,
    SentimentDistribution,
    PriorityDistribution,
    TrendPoint,
    CategoryCount,
    KeyInsight,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])


@router.get("/overview", response_model=OverviewStats)
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Retrieve high-level dashboard metrics, sentiment breakdown, trends, and AI insights."""
    feedbacks = db.query(Feedback).filter(Feedback.is_irrelevant == False).all()
    clusters = db.query(IssueCluster).filter(IssueCluster.status == "active").all()

    total_fb = len(feedbacks)
    total_issues = len(clusters)

    # Sentiment distribution
    pos_count = sum(1 for f in feedbacks if f.sentiment == "positive")
    neu_count = sum(1 for f in feedbacks if f.sentiment == "neutral")
    neg_count = sum(1 for f in feedbacks if f.sentiment == "negative")

    sentiment_dist = SentimentDistribution(
        positive=pos_count,
        neutral=neu_count,
        negative=neg_count,
        positive_percentage=round((pos_count / total_fb * 100), 1) if total_fb else 0.0,
        neutral_percentage=round((neu_count / total_fb * 100), 1) if total_fb else 0.0,
        negative_percentage=round((neg_count / total_fb * 100), 1) if total_fb else 0.0,
    )

    # Priority distribution
    crit_count = sum(1 for f in feedbacks if f.priority == "critical")
    high_count = sum(1 for f in feedbacks if f.priority == "high")
    mod_count = sum(1 for f in feedbacks if f.priority == "moderate")
    low_count = sum(1 for f in feedbacks if f.priority == "low")

    priority_dist = PriorityDistribution(
        critical=crit_count,
        high=high_count,
        moderate=mod_count,
        low=low_count,
    )

    # High priority issue clusters
    high_prio_clusters = sum(1 for c in clusters if c.priority in ["critical", "high"])
    avg_sent = round(sum(f.sentiment_score for f in feedbacks) / total_fb, 2) if total_fb else 0.0

    # Top categories
    cat_counts = defaultdict(int)
    for c in clusters:
        cat_counts[c.primary_category] += c.feedback_count
    total_cat_fb = sum(cat_counts.values()) or 1
    top_categories = [
        CategoryCount(
            category=cat,
            count=cnt,
            percentage=round(cnt / total_cat_fb * 100, 1),
        )
        for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1])
    ]

    # 30-day trends
    today = datetime.utcnow().date()
    days_map = {today - timedelta(days=i): {"count": 0, "pos": 0, "neu": 0, "neg": 0} for i in range(14, -1, -1)}

    for f in feedbacks:
        fb_d = f.feedback_date.date() if isinstance(f.feedback_date, datetime) else today
        if fb_d in days_map:
            days_map[fb_d]["count"] += 1
            if f.sentiment == "positive":
                days_map[fb_d]["pos"] += 1
            elif f.sentiment == "negative":
                days_map[fb_d]["neg"] += 1
            else:
                days_map[fb_d]["neu"] += 1

    trends = [
        TrendPoint(
            date=d.strftime("%b %d"),
            count=data["count"],
            positive=data["pos"],
            neutral=data["neu"],
            negative=data["neg"],
        )
        for d, data in sorted(days_map.items())
    ]

    # Generate actionable key insights
    insights = []
    if neg_count > pos_count and total_fb > 0:
        insights.append(
            KeyInsight(
                type="warning",
                title="Negative Sentiment Dominance",
                description=f"{round(neg_count/total_fb*100)}% of customer feedback is negative. Urgent attention required for payment and stability issues.",
            )
        )
    if crit_count > 0:
        insights.append(
            KeyInsight(
                type="warning",
                title=f"{crit_count} Critical Issues Detected",
                description="Customers reporting transaction failures, debited funds without confirmation, and biometric login failures.",
            )
        )
    if top_categories:
        top_cat = top_categories[0]
        insights.append(
            KeyInsight(
                type="info",
                title=f"Primary Complaint Area: {top_cat.category}",
                description=f"{top_cat.count} feedback items belong to '{top_cat.category}' representing {top_cat.percentage}% of grouped complaints.",
            )
        )
    if pos_count > 0:
        insights.append(
            KeyInsight(
                type="success",
                title="Positive User Highlights",
                description="Users praise fast scanner detection, instant balance checks, and clean UI navigation.",
            )
        )

    return OverviewStats(
        total_feedback=total_fb,
        total_issues=total_issues,
        high_priority_issues=high_prio_clusters,
        avg_sentiment_score=avg_sent,
        sentiment_distribution=sentiment_dist,
        priority_distribution=priority_dist,
        top_categories=top_categories,
        trends=trends,
        key_insights=insights,
    )

