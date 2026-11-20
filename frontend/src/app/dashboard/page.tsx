'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import SentimentChart from '@/components/charts/SentimentChart';
import TrendChart from '@/components/charts/TrendChart';
import CategoryChart from '@/components/charts/CategoryChart';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OverviewStats } from '@/types';
import api from '@/lib/api';
import {
  MessageSquare,
  Layers,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRunClustering = async () => {
    try {
      setClusteringLoading(true);
      const res = await api.post('/issues/cluster');
      setNotification(res.data.message);
      await fetchOverview();
    } catch (err: any) {
      alert('Clustering failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setClusteringLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Intelligence Overview"
        description="Real-time customer feedback analytics, sentiment intelligence, and issue discovery"
        action={
          <Button
            onClick={handleRunClustering}
            loading={clusteringLoading}
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            size="sm"
          >
            Run AI Discovery
          </Button>
        }
      />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Notification toast */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Primary KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Feedback
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.total_feedback ?? 0}
              </span>
              <span className="text-xs text-gray-500">records ingested</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Discovered Issues
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.total_issues ?? 0}
              </span>
              <span className="text-xs text-purple-600 font-medium">clusters formed</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                High / Critical
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">
                {stats?.high_priority_issues ?? 0}
              </span>
              <span className="text-xs text-gray-500">urgent issue groups</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sentiment Index
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.avg_sentiment_score !== undefined
                  ? (stats.avg_sentiment_score > 0 ? `+${stats.avg_sentiment_score}` : stats.avg_sentiment_score)
                  : '0.0'}
              </span>
              <span className="text-xs text-gray-500">scale -1 to +1</span>
            </div>
          </div>
        </div>

        {/* AI Key Insights Alert Box */}
        {stats?.key_insights && stats.key_insights.length > 0 && (
          <div className="bg-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-800">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold tracking-tight text-white">
                Automated AI Issue Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.key_insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-indigo-900/60 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-indigo-100">{insight.title}</span>
                  </div>
                  <p className="text-xs text-indigo-200/90 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Sentiment Distribution</h3>
              <span className="text-xs text-gray-500">VADER NLP</span>
            </div>
            <SentimentChart data={stats?.sentiment_distribution} />
          </div>

          {/* Feedback Trends */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Feedback Volume & Spike Trends</h3>
                <p className="text-xs text-gray-500">Daily ingested complaints vs negative sentiment</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" /> Total
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2" /> Issues
              </div>
            </div>
            <TrendChart data={stats?.trends || []} />
          </div>
        </div>

        {/* Top Complaint Categories & Action Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Top Complaint Categories</h3>
              <Link
                href="/issues"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all clusters <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CategoryChart data={stats?.top_categories || []} />
          </div>

          {/* Quick Action Navigation Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Quick Ingestion & Exploration</h3>
              <p className="text-xs text-gray-500 mb-5">
                FeedbackIQ automatically cleans, detects sentiment, and generates dense embeddings for all customer inputs.
              </p>

              <div className="space-y-3">
                <Link
                  href="/sources"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Upload CSV or Add Feedback</div>
                      <div className="text-[11px] text-gray-500">Import bulk customer reviews or add single items</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                </Link>

                <Link
                  href="/feedback"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Open Feedback Explorer</div>
                      <div className="text-[11px] text-gray-500">Filter by sentiment, urgency, search text</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </Link>

                <Link
                  href="/issues"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Inspect Issue Clusters</div>
                      <div className="text-[11px] text-gray-500">View LLM-generated summaries and evidence</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>FeedbackIQ MVP Pipeline v1.0</span>
              <button
                onClick={fetchOverview}
                className="flex items-center gap-1.5 text-indigo-600 hover:underline font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

