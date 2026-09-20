'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { NetWorthBreakdown } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/format';
import { LIABILITY_COLORS } from '@/lib/colors';

interface LiabilitiesChartProps {
  data: NetWorthBreakdown[];
  onCategoryClick?: (category: string) => void;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: NetWorthBreakdown }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{data.category}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(data.value, 'SGD', 0)}</p>
      </div>
    );
  }
  return null;
};

export function LiabilitiesChart({ data, onCategoryClick }: LiabilitiesChartProps) {
  // Filter for liabilities only
  const chartData = data.filter((item) => item.value > 0 && item.type === 'liability');

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No liabilities to display
      </div>
    );
  }

  // Use different shades of red for liabilities
  const COLORS = LIABILITY_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="category"
          onClick={(entry) => onCategoryClick?.(entry.category)}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
