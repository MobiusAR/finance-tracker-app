'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { NetWorthHistoryEntry } from '@/hooks/useNetWorthHistory';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { TREND_COLORS } from '@/lib/colors';

interface NetWorthTrendChartProps {
  data: NetWorthHistoryEntry[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'netWorth' && 'Net Worth: '}
            {entry.dataKey === 'assets' && 'Assets: '}
            {entry.dataKey === 'liabilities' && 'Liabilities: '}
            {formatCurrency(entry.value, 'SGD', 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function NetWorthTrendChart({ data }: NetWorthTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No history data yet. Take your first snapshot to start tracking.
      </div>
    );
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const chartData = data.map((entry) => ({
    ...entry,
    date: format(parseISO(entry.snapshot_date), 'MMM yyyy'),
    netWorth: entry.net_worth,
    assets: entry.total_assets,
    liabilities: entry.total_liabilities,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="netWorth"
          name="Net Worth"
          stroke={TREND_COLORS.netWorth}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.netWorth, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="assets"
          name="Assets"
          stroke={TREND_COLORS.assets}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.assets, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="liabilities"
          name="Liabilities"
          stroke={TREND_COLORS.liabilities}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.liabilities, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
