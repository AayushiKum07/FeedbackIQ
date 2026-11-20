'use client';

import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {action}
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            AI
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-gray-800">Product Team</span>
            <span className="block text-[11px] text-gray-500">FeedbackIQ MVP</span>
          </div>
        </div>
      </div>
    </header>
  );
}

