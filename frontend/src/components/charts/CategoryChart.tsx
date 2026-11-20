'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CategoryCount } from '@/types';

interface CategoryChartProps {
  data: CategoryCount[];
}

const BAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6'];

export default function CategoryChart({ data }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm">
        No category breakdown available. Trigger clustering to classify issues.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#475569' }}
            width={120}
          />
          <Tooltip
            formatter={(value: any, name: any, item: any) => [
              `${value} complaints (${item.payload.percentage}%)`,
              'Feedback Count',
            ]}
            contentStyle={{
              backgroundColor: '#1E293B',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

