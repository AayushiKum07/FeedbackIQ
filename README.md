# FeedbackIQ - AI-Powered Customer Feedback Intelligence Platform

FeedbackIQ is an AI/ML intelligence platform that collects customer feedback across sources, analyzes sentiment and priority, generates sentence embeddings, groups semantically similar feedback into issue clusters, and generates technical summaries using LLMs.

---

## Part 1 (MVP) Features Implemented

1. **CSV Feedback Ingestion**: Upload any `.csv` file with automatic column detection (`review`, `text`, `comment`, `date`).
2. **Manual Feedback Entry**: Add customer complaints in real-time with instant VADER sentiment and technical priority classification.
3. **Pre-Loaded Sample Dataset**: One-click demo seed with 28+ realistic FinTech / Google Pay customer complaints.
4. **Feedback Explorer (`/feedback`)**: Filter by sentiment (positive, neutral, negative), priority (critical, high, moderate, low), relevance toggle, full-text search, and pagination.
5. **Sentence Embeddings (`/api/issues/cluster`)**: Dense 128-dim normalized semantic vectors capturing word relationships and technical patterns.
6. **Semantic Clustering**: Agglomerative / KMeans clustering with cosine distance metrics.
7. **AI Summarization and Naming**: Automatic technical title generation, categorization, and problem synthesis (using OpenAI or built-in deterministic NLP fallback).
8. **Issue Intelligence (`/issues`)**: Cluster cards showing complaint volume, category badges, keywords, and representative customer quotes, plus an interactive modal to view all complaints in any group.
9. **Executive Dashboard (`/dashboard`)**:
   - 4 primary KPI cards (Total Feedback, Discovered Issues, Critical Count, Sentiment Index).
   - Interactive Donut Sentiment Distribution.
   - 14-day Ingestion and Issue Spike Trend chart.
   - Top Complaint Categories horizontal bar chart.
   - Automated AI Issue Insights alert feed.

---

## Phase 4: Emerging Issue Detection

FeedbackIQ continuously evaluates customer complaints over time to automatically flag emerging clusters whose volume is spiking abnormally compared to historical baseline.

- **Explainable Statistical Detection**: Uses rolling average, standard deviation, z-score, and percentage increase instead of opaque black-box models.
- **Time-Series Aggregation**: Zero-fills missing dates and anchors window dynamically to latest database records.
- **Noise Guardrails**:
  - Current evaluation volume >= 3 complaints.
  - At least 2 active days in baseline window.
  - z-score >= 2.0 and volume increase >= 50%.
- **Severity Classification**:
  - Critical: z >= 3.5 or increase >= 200%.
  - High: z >= 2.5 or increase >= 100%.
  - Medium: z >= 2.0 and increase >= 50%.
- **Interactive Dashboard Alert Feed**: Lookback toggle (7-day / 14-day), explainable detection reason, and daily volume trend timeline.

---

## How to Run Locally

### 1. Start Backend (FastAPI)

```bash
cd feedbackiq/backend
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger UI): **http://localhost:8000/docs**
- Health Check: **http://localhost:8000/**

*(Note: SQLite database `feedbackiq.db` is created automatically with sample data pre-seeded on first run).*

### 2. Start Frontend (Next.js)

```bash
cd feedbackiq/frontend
npm run dev
```
- Web Application: **http://localhost:3000**
