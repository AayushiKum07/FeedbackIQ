import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral' | 'critical' | 'high' | 'moderate' | 'medium' | 'low' | 'info' | 'default';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    negative: 'bg-rose-50 text-rose-700 border-rose-200/70',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    critical: 'bg-red-100 text-red-800 border-red-300 font-semibold',
    high: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
    moderate: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium uppercase tracking-wide',
        styles[variant] || styles.default,
        className
      )}
    >
      {children}
    </span>
  );
}

