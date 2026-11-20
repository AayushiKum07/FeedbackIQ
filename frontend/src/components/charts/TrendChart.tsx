'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendPoint } from '@/types';

interface TrendChartProps {
  data: TrendPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Total Feedback"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
          <Area
            type="monotone"
            dataKey="negative"
            name="Negative Issues"
            stroke="#F43F5E"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNeg)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

