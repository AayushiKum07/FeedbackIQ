"""Statistical Emerging Issue and Spike Detection.

Uses explainable rolling time-series statistics (baseline average, standard deviation,
z-score, and percentage increase) with robust guardrails to detect sudden complaint spikes.
"""

import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.feedback import Feedback
from app.models.issue import IssueCluster, ClusterMember


def detect_emerging_issues(
    db: Session,
    lookback_days: int = 7,
    min_current_count: int = 3,
    min_baseline_active_days: int = 2,
    min_z_score: float = 2.0,
    min_increase_pct: float = 50.0,
    anchor_datetime: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    Detect issue clusters experiencing an abnormal spike in complaints.

    Algorithm:
    1. Anchor detection window to the latest feedback timestamp in the database
       (or anchor_datetime if provided).
    2. Window covers [anchor_date - lookback_days, anchor_date].
    3. The last day in the window (anchor_date) represents the current evaluation day.
    4. The prior lookback_days days serve as the baseline period.
    5. Zero-fill missing dates across the entire window for all active clusters.
    6. Calculate baseline mean (μ) and sample standard deviation (σ), flooring σ at 1.0.
    7. Calculate z-score = (current - μ) / max(σ, 1.0) and lift % = ((current - μ) / max(μ, 0.5)) * 100.
    8. Apply guardrails: current_count >= 3, >= 2 non-zero baseline days, z >= 2.0 and lift >= 50%.
    9. Assign severity: critical (z>=3.5 or lift>=200%), high (z>=2.5 or lift>=100%), medium (z>=2.0 and lift>=50%).
    10. Generate human-readable detection reason.
    """
    if anchor_datetime is None:
        # Anchor to latest feedback timestamp in the database
        latest_record = db.query(
            func.max(func.coalesce(Feedback.feedback_date, Feedback.created_at))
        ).scalar()
        if not latest_record:
            return []
        anchor_datetime = latest_record

    end_date = anchor_datetime.date() if isinstance(anchor_datetime, datetime) else anchor_datetime
    start_date = end_date - timedelta(days=lookback_days)

    window_start_dt = datetime.combine(start_date, datetime.min.time())
    window_end_dt = datetime.combine(end_date, datetime.max.time().replace(microsecond=0))

    # All dates in the window from start_date to end_date (inclusive)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=i) for i in range(total_days)]
    baseline_dates = all_dates[:-1]  # The prior lookback_days days
    current_date = all_dates[-1]      # The latest evaluation day

    # Fetch all active clusters
    active_clusters = db.query(IssueCluster).filter(IssueCluster.status == "active").all()
    if not active_clusters:
        return []

    emerging_issues: List[Dict[str, Any]] = []

    for cluster in active_clusters:
        # Retrieve all feedback timestamps linked to this cluster
        feedbacks = (
            db.query(func.coalesce(Feedback.feedback_date, Feedback.created_at))
            .join(ClusterMember, ClusterMember.feedback_id == Feedback.id)
            .filter(ClusterMember.cluster_id == cluster.id)
            .all()
        )

        # Count feedback occurrences per day within the window
        date_counts: Dict[Any, int] = {d: 0 for d in all_dates}
        for (fb_dt,) in feedbacks:
            if fb_dt:
                d = fb_dt.date() if isinstance(fb_dt, datetime) else fb_dt
                if start_date <= d <= end_date:
                    date_counts[d] = date_counts.get(d, 0) + 1

        current_count = date_counts[current_date]
        baseline_counts = [date_counts[d] for d in baseline_dates]

        # Guardrail 1: Minimum volume threshold on current day
        if current_count < min_current_count:
            continue

        # Guardrail 2: Historical activity check (must have at least N active baseline days)
        non_zero_days = sum(1 for c in baseline_counts if c > 0)
        if non_zero_days < min_baseline_active_days:
            continue

        # Compute baseline mean (μ)
        baseline_avg = sum(baseline_counts) / len(baseline_counts) if baseline_counts else 0.0

        # Compute baseline sample standard deviation (σ)
        if len(baseline_counts) > 1:
            variance = sum((c - baseline_avg) ** 2 for c in baseline_counts) / (len(baseline_counts) - 1)
            std_dev = math.sqrt(variance)
        else:
            std_dev = 1.0

        effective_std = max(std_dev, 1.0)
        effective_baseline = max(baseline_avg, 0.5)

        # Statistical metrics
        z_score = (current_count - baseline_avg) / effective_std
        increase_pct = ((current_count - baseline_avg) / effective_baseline) * 100.0

        # Guardrail 3: Statistical significance and percentage increase thresholds
        if z_score < min_z_score or increase_pct < min_increase_pct:
            continue

        # Severity classification
        if z_score >= 3.5 or increase_pct >= 200.0:
            severity = "critical"
        elif z_score >= 2.5 or increase_pct >= 100.0:
            severity = "high"
        else:
            severity = "medium"

        # Explainable detection reason
        detection_reason = (
            f"Volume rose to {current_count} complaints vs. "
            f"{baseline_avg:.1f}/day {lookback_days}-day avg "
            f"(+{increase_pct:.0f}%, z={z_score:.2f})"
        )

        trend_data = [
            {"date": d.isoformat(), "count": date_counts[d]}
            for d in all_dates
        ]

        emerging_issues.append({
            "issue_id": str(cluster.id),
            "issue_name": cluster.title,
            "category": cluster.primary_category,
            "severity": severity,
            "current_count": current_count,
            "baseline_avg": round(baseline_avg, 2),
            "increase_pct": round(increase_pct, 1),
            "z_score": round(z_score, 2),
            "detection_reason": detection_reason,
            "window_start": window_start_dt,
            "window_end": window_end_dt,
            "trend": trend_data,
        })

    # Sort alerts by severity order then z-score descending
    severity_order = {"critical": 3, "high": 2, "medium": 1}
    emerging_issues.sort(
        key=lambda x: (severity_order.get(x["severity"], 0), x["z_score"]),
        reverse=True,
    )

    return emerging_issues
