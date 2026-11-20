"""Sentiment analysis and priority assessment module."""

import re
from typing import Dict, Any, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

# High-urgency keywords that trigger critical/high priority
CRITICAL_KEYWORDS = {
    "crash", "crashes", "crashing", "freeze", "freezes", "frozen",
    "stole", "steal", "scam", "fraud", "unauthorized", "lost money",
    "debited but not credited", "money deducted", "failed transaction",
    "account locked", "cannot login", "can't login", "hacked", "security"
}

HIGH_KEYWORDS = {
    "bug", "error", "broken", "failed", "failure", "not working",
    "doesn't work", "terrible", "awful", "horrible", "refund pending",
    "delayed", "stuck", "blank screen", "black screen", "infinite loading"
}


def clean_text(text: str) -> str:
    """Preprocess and clean raw feedback text."""
    if not text:
        return ""
    # Remove HTML tags if any
    cleaned = re.sub(r"<[^>]+>", " ", text)
    # Remove redundant whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def analyze_sentiment(text: str) -> Tuple[str, float]:
    """
    Analyze sentiment using VADER.
    Returns (sentiment_label, compound_score)
    sentiment_label: 'positive' | 'neutral' | 'negative'
    compound_score: float between -1.0 and 1.0
    """
    if not text or not text.strip():
        return "neutral", 0.0

    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return sentiment, float(compound)


def determine_priority(text: str, sentiment: str, compound_score: float) -> str:
    """
    Determine issue priority based on sentiment severity and technical urgency indicators.
    Returns: 'critical' | 'high' | 'moderate' | 'low'
    """
    lower = text.lower()

    # Check for critical keywords
    if any(kw in lower for kw in CRITICAL_KEYWORDS):
        return "critical"

    # Severe negative sentiment with high severity keywords
    if sentiment == "negative" and (compound_score <= -0.6 or any(kw in lower for kw in HIGH_KEYWORDS)):
        return "high"

    # Moderate negative sentiment
    if sentiment == "negative":
        return "moderate"

    # Neutral with minor issue indicators
    if sentiment == "neutral" and any(kw in lower for kw in HIGH_KEYWORDS):
        return "moderate"

    return "low"


def process_feedback_text(text: str) -> Dict[str, Any]:
    """Complete preprocessing and sentiment/priority pipeline for feedback text."""
    cleaned = clean_text(text)
    sentiment, score = analyze_sentiment(cleaned)
    priority = determine_priority(cleaned, sentiment, score)
    return {
        "cleaned_text": cleaned,
        "sentiment": sentiment,
        "sentiment_score": score,
        "priority": priority,
    }

