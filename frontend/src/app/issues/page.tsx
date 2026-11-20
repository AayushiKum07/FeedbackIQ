'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { IssueCluster, IssueClusterDetail } from '@/types';
import api from '@/lib/api';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  Tag,
  Quote,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function IssueIntelligencePage() {
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<IssueClusterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPriority) params.priority = selectedPriority;

      const res = await api.get('/issues', { params });
      setClusters(res.data);
    } catch (err) {
      console.error('Failed to load clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [selectedCategory, selectedPriority]);

  const handleRunClustering = async () => {
    try {
      setClusteringLoading(true);
      const res = await api.post('/issues/cluster');
      setNotification(res.data.message);
      await fetchClusters();
    } catch (err: any) {
      alert('Clustering error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setClusteringLoading(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleViewClusterDetail = async (clusterId: string) => {
    try {
      setDetailLoading(true);
      setIsDetailModalOpen(true);
      const res = await api.get(`/issues/${clusterId}`);
      setSelectedCluster(res.data);
    } catch (err) {
      alert('Failed to load issue cluster details');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Issue Intelligence"
        description="AI-grouped customer complaint clusters, recurring root causes, and automated summaries"
        action={
          <Button
            onClick={handleRunClustering}
            loading={clusteringLoading}
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Re-cluster & Summarize
          </Button>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Notification Toast */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Discovered Issue Clusters ({clusters.length})</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Payment & Transactions">Payment & Transactions</option>
              <option value="Authentication & Security">Authentication & Security</option>
              <option value="App Performance">App Performance</option>
              <option value="UI & UX">UI & UX</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Customer Support">Customer Support</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

            {(selectedCategory || selectedPriority) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPriority('');
                }}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Cluster Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">
            <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block mb-3" />
            <p className="text-sm font-medium">Extracting semantic clusters and generating summaries...</p>
          </div>
        ) : clusters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-6"
              >
                <div>
                  {/* Top metadata tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{cluster.primary_category}</Badge>
                      <Badge variant={cluster.priority as any}>{cluster.priority}</Badge>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {cluster.feedback_count} complaints
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">
                    {cluster.title}
                  </h3>

                  {/* AI Summary */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 mb-4 text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-indigo-700 block mb-1">
                      AI Problem Synthesis:
                    </span>
                    {cluster.summary || cluster.description || 'No summary available.'}
                  </div>

                  {/* Keywords */}
                  {cluster.keywords && cluster.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      <Tag className="w-3 h-3 text-gray-400 mr-0.5" />
                      {cluster.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Representative Sample Complaints */}
                  {cluster.representative_feedback && cluster.representative_feedback.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Representative Customer Voices:
                      </span>
                      {cluster.representative_feedback.slice(0, 2).map((sample, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/70"
                        >
                          <Quote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>&ldquo;{sample.text}&rdquo;</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer button */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400">
                    Avg Sentiment: {cluster.avg_sentiment_score > 0 ? `+${cluster.avg_sentiment_score}` : cluster.avg_sentiment_score}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewClusterDetail(cluster.id)}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View All {cluster.feedback_count} Feedback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm max-w-lg mx-auto">
            <Layers className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">No Issue Clusters Yet</h3>
            <p className="text-xs text-gray-500 mb-5">
              Run the AI clustering pipeline to discover recurring customer complaints and generate technical summaries.
            </p>
            <Button
              onClick={handleRunClustering}
              loading={clusteringLoading}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Run AI Discovery Pipeline
            </Button>
          </div>
        )}
      </div>

      {/* Cluster Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCluster?.title || 'Cluster Member Feedback'}
        maxWidth="max-w-3xl"
      >
        {detailLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Loading associated customer feedback...
          </div>
        ) : selectedCluster ? (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="info">{selectedCluster.primary_category}</Badge>
                <Badge variant={selectedCluster.priority as any}>{selectedCluster.priority}</Badge>
                <span className="font-semibold text-indigo-900 ml-auto">
                  {selectedCluster.feedback_count} feedback records
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed font-normal">
                {selectedCluster.summary}
              </p>
            </div>

            {/* List of all member feedback */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                All Customer Complaints in this Issue Group
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {selectedCluster.members && selectedCluster.members.length > 0 ? (
                  selectedCluster.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs space-y-1.5"
                    >
                      <p className="text-gray-900 font-medium">{m.text}</p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <div className="flex items-center gap-2">
                          <Badge variant={m.sentiment as any}>{m.sentiment}</Badge>
                          <Badge variant={m.priority as any}>{m.priority}</Badge>
                        </div>
                        <span>
                          {new Date(m.feedback_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No member records found.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <Button size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}

