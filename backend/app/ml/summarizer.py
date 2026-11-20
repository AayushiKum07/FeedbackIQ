"""Cluster summarization and naming using LLM with deterministic NLP fallback."""

import os
from typing import List, Dict, Any
import httpx
from sklearn.feature_extraction.text import TfidfVectorizer
from app.config import settings


def extract_keywords(texts: List[str], top_n: int = 5) -> List[str]:
    """Extract top distinctive keywords/phrases from a list of texts using TF-IDF."""
    if not texts:
        return []
    try:
        vec = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=100,
            token_pattern=r"(?u)\b[a-zA-Z]{3,}\b",
        )
        tfidf = vec.fit_transform(texts)
        scores = tfidf.sum(axis=0).A1
        words = vec.get_feature_names_out()
        sorted_indices = scores.argsort()[::-1]
        top_words = [words[i] for i in sorted_indices[:top_n]]
        return top_words
    except Exception:
        return []


def generate_cluster_metadata_llm(texts: List[str], keywords: List[str]) -> Dict[str, str]:
    """Call OpenAI API to generate structured title, category, and summary."""
    api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return generate_cluster_metadata_heuristic(texts, keywords)

    sample_texts = texts[:8]
    prompt = f"""
You are an expert software engineering lead analyzing a cluster of user complaints for a mobile application.
Based on the following user feedback samples and key terms, generate a technical title, category, and summary.

Key terms: {', '.join(keywords)}

User Feedback:
{chr(10).join(f"- {t}" for t in sample_texts)}

Provide your output in exactly this format:
TITLE: <Distinct technical 4-7 word title>
CATEGORY: <One of: Payment & Transactions, Authentication & Security, App Performance, UI & UX, Feature Request, Customer Support>
SUMMARY: <2-3 sentence technical summary describing the root problem reported by users, the impact, and the recurring symptom.>
"""
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                title = ""
                category = "General"
                summary = ""
                for line in content.split("\n"):
                    if line.startswith("TITLE:"):
                        title = line.replace("TITLE:", "").strip()
                    elif line.startswith("CATEGORY:"):
                        category = line.replace("CATEGORY:", "").strip()
                    elif line.startswith("SUMMARY:"):
                        summary = line.replace("SUMMARY:", "").strip()
                if title and summary:
                    return {"title": title, "category": category, "summary": summary}
    except Exception as e:
        print(f"OpenAI API call failed: {e}, falling back to heuristic")

    return generate_cluster_metadata_heuristic(texts, keywords)


def generate_cluster_metadata_heuristic(texts: List[str], keywords: List[str]) -> Dict[str, str]:
    """
    Deterministic rule-based NLP fallback that creates grounded, distinct technical titles
    and summaries based on specific keyword patterns and representative complaints.
    """
    joined = " ".join(texts).lower()

    # Determine primary category and specific sub-topic
    if any(k in joined for k in ["support", "agent", "ticket", "dispute", "response", "unresponsive", "customer care"]):
        category = "Customer Support"
        title = "Support Responsiveness & Dispute Delays"
    elif any(k in joined for k in ["fingerprint", "biometric", "face id", "face"]):
        category = "Authentication & Security"
        title = "Biometric & Fingerprint Login Failures"
    elif any(k in joined for k in ["otp", "verification", "sms", "code"]):
        category = "Authentication & Security"
        title = "Delayed OTP & SMS Verification Codes"
    elif any(k in joined for k in ["login", "logged out", "credentials", "password", "pin", "auth"]):
        category = "Authentication & Security"
        title = "Account Authentication & Session Logout"
    elif any(k in joined for k in ["crash", "crashing", "crashes", "camera", "freeze"]):
        category = "App Performance"
        title = "App Crashes & Freezing on QR Scan"
    elif any(k in joined for k in ["slow", "lag", "latency", "battery", "black screen", "loading"]):
        category = "App Performance"
        title = "High Latency & UI Stuttering"
    elif any(k in joined for k in ["debited", "deducted", "refund", "pending"]):
        category = "Payment & Transactions"
        title = "Debited Funds & Delayed Refund Discrepancies"
    elif any(k in joined for k in ["failed", "failure", "timeout", "timed out", "transfer"]):
        category = "Payment & Transactions"
        title = "UPI Transfer & Gateway Failures"
    elif any(k in joined for k in ["dark mode", "feature", "export", "schedule", "widget", "split bill"]):
        category = "Feature Request"
        feature_name = keywords[0].title() if keywords else "Product"
        title = f"Feature Request: {feature_name} Enhancement"
    elif any(k in joined for k in ["love", "best", "smooth", "rewards", "cashback", "fast"]):
        category = "UI & UX"
        title = "User Praise & Scanner Performance"
    else:
        category = "UI & UX"
        kw_title = " ".join([w.title() for w in keywords[:2]]) if keywords else "General Complaints"
        title = f"Issues Involving {kw_title}"

    # Build grounded, evidence-backed summary
    rep_sample = texts[0] if texts else ""
    summary = (
        f"Multiple customers report recurring issues in {category}. "
        f"Primary symptom: \"{rep_sample}\". "
        f"Top recurring terms identified across complaints: {', '.join(keywords[:4])}."
    )

    return {
        "title": title,
        "category": category,
        "summary": summary,
    }


def generate_cluster_metadata(texts: List[str], keywords: List[str]) -> Dict[str, str]:
    """Generate title, category, and summary for a cluster."""
    if settings.OPENAI_API_KEY:
        return generate_cluster_metadata_llm(texts, keywords)
    return generate_cluster_metadata_heuristic(texts, keywords)
