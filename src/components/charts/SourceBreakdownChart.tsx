'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SourceBreakdown } from '@/lib/supabase/types';

interface SourceBreakdownChartProps {
  data: SourceBreakdown[];
  category: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

export function SourceBreakdownChart({ data, category }: SourceBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No source data for {category}
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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SourceBreakdown }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium">{data.source}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground">{data.assets.length} asset(s)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{category} Breakdown</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            nameKey="source"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
