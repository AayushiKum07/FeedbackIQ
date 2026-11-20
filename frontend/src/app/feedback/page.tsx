'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Feedback, FeedbackListResponse } from '@/types';
import api from '@/lib/api';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function FeedbackExplorerPage() {
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  // Manual feedback modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 10 };
      if (search.trim()) params.search = search.trim();
      if (sentiment) params.sentiment = sentiment;
      if (priority) params.priority = priority;

      const res = await api.get('/feedback', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sentiment, priority]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleToggleIrrelevant = async (id: string) => {
    try {
      await api.patch(`/feedback/${id}/irrelevant`);
      fetchFeedback();
    } catch (err) {
      alert('Failed to update relevance status');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    try {
      setSubmittingManual(true);
      const res = await api.post('/feedback/manual', {
        text: manualText.trim(),
        source_name: 'Manual Ingestion',
      });
      setNotification(`Feedback ingested! Detected sentiment: ${res.data.sentiment} (${res.data.priority} priority).`);
      setManualText('');
      setIsModalOpen(false);
      setPage(1);
      fetchFeedback();
    } catch (err: any) {
      alert('Submission failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingManual(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Feedback Explorer"
        description="Inspect, search, and filter all collected customer feedback across channels"
        action={
          <div className="flex items-center gap-2">
            <Link href="/sources">
              <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />}>
                Import CSV
              </Button>
            </Link>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Feedback
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Notification toast */}
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

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search feedback text, issues, or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sentiment dropdown */}
            <select
              value={sentiment}
              onChange={(e) => {
                setSentiment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            {/* Priority dropdown */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

            {(search || sentiment || priority) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSentiment('');
                  setPriority('');
                  setPage(1);
                }}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Feedback Table Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">
              Customer Feedback ({data?.total ?? 0} total)
            </div>
            <div className="text-xs text-gray-500">
              Showing page {page} of {data?.total_pages || 1}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Customer Feedback</th>
                  <th className="px-4 py-3.5">Sentiment</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Discovered Cluster</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Loading feedback records...
                      </div>
                    </td>
                  </tr>
                ) : data && data.items.length > 0 ? (
                  data.items.map((fb) => (
                    <tr
                      key={fb.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        fb.is_irrelevant ? 'opacity-40 line-through bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-gray-900 font-medium text-xs leading-relaxed">
                          {fb.original_text}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                          Source: {fb.source_name || 'Direct'}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={fb.sentiment as any}>
                          {fb.sentiment} ({fb.sentiment_score > 0 ? `+${fb.sentiment_score}` : fb.sentiment_score})
                        </Badge>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={fb.priority as any}>{fb.priority}</Badge>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {fb.cluster_title ? (
                          <Link
                            href={`/issues`}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline bg-indigo-50/60 px-2.5 py-1 rounded-md border border-indigo-100"
                          >
                            <Sparkles className="w-3 h-3" />
                            {fb.cluster_title}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unclustered</span>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(fb.feedback_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleToggleIrrelevant(fb.id)}
                          title={fb.is_irrelevant ? 'Mark as relevant' : 'Mark as irrelevant'}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {fb.is_irrelevant ? (
                            <Eye className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No feedback matches the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data && data.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <span className="text-xs font-medium text-gray-600">
                Page {page} of {data.total_pages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Feedback Submission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Feedback Manually"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Feedback Text / Review
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. The app crashed twice while transferring money through UPI..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              FeedbackIQ will automatically analyze sentiment, detect priority, and prepare sentence embeddings.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submittingManual}>
              Save & Analyze
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

