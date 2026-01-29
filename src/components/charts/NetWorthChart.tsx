'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { NetWorthBreakdown } from '@/lib/supabase/types';

interface NetWorthChartProps {
  data: NetWorthBreakdown[];
  onCategoryClick?: (category: string) => void;
}

export function NetWorthChart({ data, onCategoryClick }: NetWorthChartProps) {
  // Filter out zero values and liabilities for the pie chart
  const chartData = data.filter((item) => item.value > 0 && item.type !== 'liability');

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No asset data to display
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: NetWorthBreakdown }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="category"
          onClick={(entry) => onCategoryClick?.(entry.category)}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
