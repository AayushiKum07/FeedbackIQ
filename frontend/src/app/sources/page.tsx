'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import {
  UploadCloud,
  FileText,
  PlusCircle,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react';

export default function SourcesPage() {
  // CSV Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual feedback state
  const [manualText, setManualText] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Demo seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setUploadError('Please select a valid .csv file');
        setFile(null);
      } else {
        setFile(selected);
        setUploadError(null);
      }
    }
  };

  const handleUploadCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/feedback/csv-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess(res.data.message);
      setFile(null);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    try {
      setSubmittingManual(true);
      setManualSuccess(null);

      const res = await api.post('/feedback/manual', {
        text: manualText.trim(),
        source_name: 'Manual Entry Form',
      });

      setManualSuccess(
        `Added! Sentiment: ${res.data.sentiment.toUpperCase()} (Priority: ${res.data.priority.toUpperCase()})`
      );
      setManualText('');
    } catch (err: any) {
      alert('Manual submission failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      setSeedSuccess(null);
      const res = await api.post('/feedback/seed');
      setSeedSuccess(res.data.message);
    } catch (err: any) {
      alert('Failed to seed demo data: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Data Ingestion"
        description="Ingest customer feedback through CSV file uploads, manual submissions, or pre-loaded datasets"
      />

      <div className="p-8 space-y-8 max-w-6xl">
        {/* 3 Ingestion Channels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. CSV File Upload */}
          <div className="bg-white p-7 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Upload CSV Feedback</h3>
                  <span className="text-xs text-gray-500">Bulk import customer reviews</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 my-4 leading-relaxed">
                Upload any CSV containing columns like <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">text</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">review</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">comment</code>, or{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">content</code>. FeedbackIQ automatically parses text and dates.
              </p>

              <form onSubmit={handleUploadCSV} className="space-y-4">
                <label className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-indigo-50/20 transition-all block">
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">
                    {file ? file.name : 'Click to select or drag & drop CSV'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">.csv format up to 25MB</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {uploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400">
                    {file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'No file chosen'}
                  </span>
                  <Button type="submit" size="sm" loading={uploading} disabled={!file}>
                    Start Ingestion
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <Link
                href="/feedback"
                className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                View all in Feedback Explorer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Manual Feedback Entry */}
          <div className="bg-white p-7 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Feedback Manually</h3>
                  <span className="text-xs text-gray-500">Test single reviews in real-time</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 my-4 leading-relaxed">
                Paste an individual customer comment, app review, or support ticket. FeedbackIQ will immediately analyze its sentiment, score urgency, and create embeddings.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. The app crashed twice when I scanned the merchant QR code. Very frustrating bug!"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {manualSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{manualSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={submittingManual}>
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Automatic sentiment & priority scoring applied</span>
            </div>
          </div>
        </div>

        {/* 3. Demo Dataset Quick Seed Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-2xl shadow-lg border border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Pre-Loaded Realistic Demo Dataset</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Want to see the platform in action without uploading files? Seed 28+ realistic customer complaints from Google Pay / FinTech apps spanning UPI failures, biometric errors, app crashes, and support delays.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {seedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold">{seedSuccess}</span>
            )}
            <Button
              onClick={handleSeedDemoData}
              loading={seeding}
              variant="secondary"
              size="md"
              icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            >
              Seed Demo Data
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

