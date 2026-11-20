'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  UploadCloud,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Feedback Explorer', href: '/feedback', icon: MessageSquare },
  { name: 'Issue Intelligence', href: '/issues', icon: Layers },
  { name: 'Data Ingestion', href: '/sources', icon: UploadCloud },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white">FeedbackIQ</span>
          <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
            AI Issue Discovery
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              )}
            >
              <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* System Status card in sidebar */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">AI Engine Ready</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            TF-IDF embeddings + Agglomerative clustering + NLP summarization active.
          </p>
        </div>
      </div>
    </aside>
  );
}

