'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentDistribution } from '@/types';

interface SentimentChartProps {
  data?: SentimentDistribution;
}

const COLORS = {
  positive: '#10B981', // Emerald 500
  neutral: '#94A3B8',  // Slate 400
  negative: '#F43F5E', // Rose 500
};

export default function SentimentChart({ data }: SentimentChartProps) {
  if (!data || (data.positive === 0 && data.neutral === 0 && data.negative === 0)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm">
        No sentiment data available
      </div>
    );
  }

  const chartData = [
    { name: 'Positive', value: data.positive, color: COLORS.positive, pct: data.positive_percentage },
    { name: 'Neutral', value: data.neutral, color: COLORS.neutral, pct: data.neutral_percentage },
    { name: 'Negative', value: data.negative, color: COLORS.negative, pct: data.negative_percentage },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="w-full sm:w-1/2 h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: any, name: any, item: any) => [
                `${value} items (${item.payload.pct}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#1E293B',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 space-y-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-900">{item.value}</span>
              <span className="text-[11px] text-gray-500 ml-1.5">({item.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

