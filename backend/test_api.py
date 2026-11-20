import sys
sys.path.insert(0, r'c:\Users\hp\Documents\customer feedback\feedbackiq\backend')
from starlette.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        res = client.get('/')
        print("Root response:", res.status_code, res.json())

        res_fb = client.get('/api/feedback?page=1&page_size=5')
        data_fb = res_fb.json()
        print(f"Feedback list: status={res_fb.status_code}, total={data_fb.get('total')}")

        res_issues = client.get('/api/issues')
        clusters = res_issues.json()
        print(f"Issue clusters: status={res_issues.status_code}, count={len(clusters)}")
        for c in clusters:
            print(f"  - [{c.get('primary_category')}] {c.get('title')} ({c.get('feedback_count')} items, priority={c.get('priority')})")

        res_an = client.get('/api/analytics/overview')
        an = res_an.json()
        print(f"Analytics overview: status={res_an.status_code}")
        print(f"  Feedback count: {an.get('total_feedback')}")
        print(f"  Discovered issues: {an.get('total_issues')}")
        print(f"  Sentiment distribution: {an.get('sentiment_distribution')}")
        print(f"  Key insights: {len(an.get('key_insights', []))}")

if __name__ == '__main__':
    run_tests()

