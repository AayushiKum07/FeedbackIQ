"""Test suite for FeedbackIQ API and Phase 4 Emerging Issue Detection."""

import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, r'c:\Users\hp\Documents\customer feedback\feedbackiq\backend')

from starlette.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.feedback import Feedback
from app.models.issue import IssueCluster, ClusterMember
from app.ml.anomaly import detect_emerging_issues


def test_anomaly_detection_rules():
    """Unit tests for time-series spike detection and guardrails."""
    db = SessionLocal()
    created_cluster_ids = []
    created_feedback_ids = []

    try:
        anchor_dt = datetime(2026, 11, 20, 15, 0, 0)
        anchor_date = anchor_dt.date()

        # Helper to populate test clusters and feedback
        def create_test_dataset(cluster_title, category, daily_counts):
            """
            daily_counts: dict of {days_ago: count}
            e.g. {0: 12, 1: 2, 2: 3} means 12 today (anchor), 2 yesterday, 3 two days ago.
            """
            cluster = IssueCluster(
                id=str(uuid.uuid4()),
                title=cluster_title,
                primary_category=category,
                status="active",
                feedback_count=sum(daily_counts.values()),
            )
            db.add(cluster)
            created_cluster_ids.append(cluster.id)

            for days_ago, count in daily_counts.items():
                fb_dt = datetime.combine(anchor_date - timedelta(days=days_ago), datetime.min.time())
                for _ in range(count):
                    fb = Feedback(
                        id=str(uuid.uuid4()),
                        original_text=f"Test feedback for {cluster_title}",
                        feedback_date=fb_dt,
                        sentiment="negative",
                        priority="high",
                    )
                    db.add(fb)
                    created_feedback_ids.append(fb.id)

                    member = ClusterMember(
                        id=str(uuid.uuid4()),
                        cluster_id=cluster.id,
                        feedback_id=fb.id,
                        similarity_score=0.95,
                    )
                    db.add(member)

            db.commit()
            return cluster

        # Case 1: Clear Spike (Surge on anchor day vs prior days)
        # Baseline days (1 to 7 days ago): 2, 3, 2, 2, 0, 0, 0
        # Anchor day (0 days ago): 14 complaints
        spike_cluster = create_test_dataset(
            "Payment Gateway Timeout",
            "Payments",
            {0: 14, 1: 2, 2: 3, 3: 2, 4: 2, 5: 0, 6: 0, 7: 0},
        )

        # Case 2: Normal steady volume (No false positive)
        # 3 complaints every day across the entire window
        steady_cluster = create_test_dataset(
            "Steady Navigation Inquiry",
            "UI/UX",
            {0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3},
        )

        # Case 3: Small sample guardrail (Current count < 3)
        # Baseline had 0.5/day, today jumped to 2 (high lift %, but count is only 2)
        small_sample_cluster = create_test_dataset(
            "Minor Typo on Settings",
            "General",
            {0: 2, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0},
        )

        # Case 4: Insufficient baseline history (< 2 non-zero days in baseline)
        # Brand new issue with 10 complaints today, but only 1 day in baseline
        no_history_cluster = create_test_dataset(
            "Brand New Sudden Outage",
            "Infrastructure",
            {0: 10, 1: 5, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0},
        )

        # Run anomaly detection anchored at anchor_dt
        results = detect_emerging_issues(
            db=db,
            lookback_days=7,
            anchor_datetime=anchor_dt,
        )

        flagged_ids = [r["issue_id"] for r in results]

        # Assertions
        assert spike_cluster.id in flagged_ids, "Clear spike cluster must be flagged as emerging"
        assert steady_cluster.id not in flagged_ids, "Steady cluster must NOT be flagged (no false positive)"
        assert small_sample_cluster.id not in flagged_ids, "Cluster with count < 3 must be blocked by guardrail"
        assert no_history_cluster.id not in flagged_ids, "Cluster with < 2 active baseline days must be blocked by guardrail"

        # Check detected spike details
        spike_alert = next(r for r in results if r["issue_id"] == spike_cluster.id)
        assert spike_alert["current_count"] == 14
        assert spike_alert["severity"] in ["critical", "high"]
        assert spike_alert["z_score"] >= 2.0
        assert spike_alert["increase_pct"] >= 50.0
        assert len(spike_alert["trend"]) == 8  # 7 baseline days + 1 current day
        assert "Volume rose to 14 complaints" in spike_alert["detection_reason"]
        print("[PASS] Statistical spike detection & guardrails unit test passed!")

    finally:
        # Cleanup test records
        if created_feedback_ids:
            db.query(ClusterMember).filter(ClusterMember.feedback_id.in_(created_feedback_ids)).delete(synchronize_session=False)
            db.query(Feedback).filter(Feedback.id.in_(created_feedback_ids)).delete(synchronize_session=False)
        if created_cluster_ids:
            db.query(IssueCluster).filter(IssueCluster.id.in_(created_cluster_ids)).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_api_endpoints():
    """Integration test verifying all API endpoints including GET /api/issues/emerging."""
    with TestClient(app) as client:
        # 1. Root health check
        res = client.get("/")
        assert res.status_code == 200, f"Root endpoint failed: {res.status_code}"
        print("[PASS] Root health check returned 200 OK")

        # 2. Feedback list
        res_fb = client.get("/api/feedback?page=1&page_size=5")
        assert res_fb.status_code == 200
        data_fb = res_fb.json()
        assert "items" in data_fb
        print(f"[PASS] Feedback endpoint returned 200 (total={data_fb.get('total')})")

        # 3. Discovered clusters list
        res_issues = client.get("/api/issues")
        assert res_issues.status_code == 200
        clusters = res_issues.json()
        assert isinstance(clusters, list)
        print(f"[PASS] Issue clusters returned 200 (count={len(clusters)})")

        # 4. Phase 4: Emerging Issues endpoint
        res_emerging = client.get("/api/issues/emerging?lookback_days=7")
        assert res_emerging.status_code == 200, f"Emerging issues failed: {res_emerging.status_code} {res_emerging.text}"
        emerging_data = res_emerging.json()
        assert isinstance(emerging_data, list), "Emerging issues response must be a list"

        if len(emerging_data) > 0:
            sample = emerging_data[0]
            required_fields = [
                "issue_id", "issue_name", "category", "severity",
                "current_count", "baseline_avg", "increase_pct",
                "z_score", "detection_reason", "window_start",
                "window_end", "trend",
            ]
            for field in required_fields:
                assert field in sample, f"Missing field '{field}' in emerging issue schema"
            assert sample["severity"] in ["critical", "high", "medium"]
            assert isinstance(sample["trend"], list)
            if sample["trend"]:
                assert "date" in sample["trend"][0]
                assert "count" in sample["trend"][0]
        print(f"[PASS] GET /api/issues/emerging returned 200 with valid schema (spikes detected={len(emerging_data)})")

        # 5. Emerging issues with 14-day lookback
        res_emerging_14 = client.get("/api/issues/emerging?lookback_days=14")
        assert res_emerging_14.status_code == 200
        print(f"[PASS] GET /api/issues/emerging?lookback_days=14 returned 200")

        # 6. Analytics overview
        res_an = client.get("/api/analytics/overview")
        assert res_an.status_code == 200
        an = res_an.json()
        assert "total_feedback" in an
        print(f"[PASS] Analytics overview returned 200 (total_feedback={an.get('total_feedback')})")


def run_tests():
    print("========================================")
    print("Running FeedbackIQ Phase 4 Test Suite...")
    print("========================================")
    test_anomaly_detection_rules()
    test_api_endpoints()
    print("========================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("========================================")


if __name__ == "__main__":
    run_tests()
