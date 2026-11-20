"""Pydantic schemas for analytics and dashboard KPIs."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class SentimentDistribution(BaseModel):
    positive: int
    neutral: int
    negative: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float


class PriorityDistribution(BaseModel):
    critical: int
    high: int
    moderate: int
    low: int


class TrendPoint(BaseModel):
    date: str
    count: int
    positive: int
    neutral: int
    negative: int


class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class KeyInsight(BaseModel):
    type: str  # warning, info, success
    title: str
    description: str


class OverviewStats(BaseModel):
    total_feedback: int
    total_issues: int
    high_priority_issues: int
    avg_sentiment_score: float
    sentiment_distribution: SentimentDistribution
    priority_distribution: PriorityDistribution
    top_categories: List[CategoryCount]
    trends: List[TrendPoint]
    key_insights: List[KeyInsight]

