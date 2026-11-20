'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import SentimentChart from '@/components/charts/SentimentChart';
import TrendChart from '@/components/charts/TrendChart';
import CategoryChart from '@/components/charts/CategoryChart';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OverviewStats, EmergingIssue } from '@/types';
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
  Flame,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [emergingIssues, setEmergingIssues] = useState<EmergingIssue[]>([]);
  const [emergingLoading, setEmergingLoading] = useState(true);
  const [lookbackDays, setLookbackDays] = useState<number>(7);

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

  const fetchEmerging = async (days: number) => {
    try {
      setEmergingLoading(true);
      const res = await api.get(`/issues/emerging?lookback_days=${days}`);
      setEmergingIssues(res.data);
    } catch (err) {
      console.error('Failed to load emerging issues:', err);
    } finally {
      setEmergingLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchEmerging(lookbackDays);
  }, [lookbackDays]);

  const handleRunClustering = async () => {
    try {
      setClusteringLoading(true);
      const res = await api.post('/issues/cluster');
      setNotification(res.data.message);
      await Promise.all([fetchOverview(), fetchEmerging(lookbackDays)]);
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

        {/* Emerging Issues & Spike Detection Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">Emerging Issues & Spike Detection</h3>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full uppercase">
                    Phase 4
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Statistical anomaly alerts flagging clusters whose complaint volume is surging over historical baseline
                </p>
              </div>
            </div>

            {/* Lookback Window Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Baseline:
              </span>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
                <button
                  type="button"
                  onClick={() => setLookbackDays(7)}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                    lookbackDays === 7
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setLookbackDays(14)}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                    lookbackDays === 14
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  14 Days
                </button>
              </div>
            </div>
          </div>

          {emergingLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Analyzing historical complaint time-series...</span>
            </div>
          ) : emergingIssues.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-xl bg-gray-50/70 border border-dashed border-gray-200 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">No Emerging Spikes Detected</h4>
              <p className="text-xs text-gray-500 max-w-md">
                All complaint clusters are operating within normal baseline volumes over the selected {lookbackDays}-day window. No statistical anomalies were identified.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergingIssues.map((issue) => (
                <div
                  key={issue.issue_id}
                  className="p-5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            issue.severity === 'critical'
                              ? 'critical'
                              : issue.severity === 'high'
                              ? 'high'
                              : 'medium'
                          }
                        >
                          {issue.severity}
                        </Badge>
                        <Badge variant="info">{issue.category}</Badge>
                      </div>
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-100/80 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        +{issue.increase_pct}% spike
                      </span>
                    </div>

                    <Link
                      href="/issues"
                      className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-2.5 block"
                    >
                      {issue.issue_name}
                    </Link>

                    {/* Explainable Detection Reason Alert */}
                    <div className="p-3 rounded-lg bg-white/95 border border-rose-100 text-xs text-gray-700 mb-3 flex items-start gap-2 shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{issue.detection_reason}</span>
                    </div>

                    {/* Volume statistics row */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-gray-50/80 border border-gray-100 text-center mb-3">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Spike Day</div>
                        <div className="text-sm font-extrabold text-gray-900">{issue.current_count}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Baseline Avg</div>
                        <div className="text-sm font-bold text-gray-600">{issue.baseline_avg}/day</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Z-Score</div>
                        <div className="text-sm font-extrabold text-indigo-600">+{issue.z_score}σ</div>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="mb-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Daily Volume Timeline</span>
                        <span>{issue.trend.length}d trend</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-10 w-full pt-1">
                        {issue.trend.map((pt, idx) => {
                          const maxCount = Math.max(...issue.trend.map((t) => t.count), 1);
                          const heightPct = Math.max((pt.count / maxCount) * 100, 10);
                          const isLast = idx === issue.trend.length - 1;
                          return (
                            <div
                              key={pt.date}
                              className="flex-1 flex flex-col items-center group relative h-full justify-end"
                            >
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={clsx(
                                  'w-full rounded-xs transition-all',
                                  isLast
                                    ? 'bg-rose-500 group-hover:bg-rose-600'
                                    : pt.count > 0
                                    ? 'bg-indigo-300 group-hover:bg-indigo-400'
                                    : 'bg-gray-200'
                                )}
                              />
                              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                <span className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                                  {pt.date}: {pt.count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-1">
                    <span className="text-[11px] text-gray-400">
                      Window: {new Date(issue.window_start).toLocaleDateString()} - {new Date(issue.window_end).toLocaleDateString()}
                    </span>
                    <Link
                      href="/issues"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Investigate Cluster <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                onClick={() => {
                  fetchOverview();
                  fetchEmerging(lookbackDays);
                }}
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

