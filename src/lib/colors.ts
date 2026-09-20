// Centralized data-visualization colors so asset types and charts stay
// consistent across pages and themes. Fixed hex values are safe for data
// colors because they sit on top of both light and dark surfaces.

export const ASSET_TYPE_COLORS: Record<string, string> = {
  investment: '#22c55e', // sage
  cpf: '#8b5cf6', // violet
  cash: '#3b82f6', // blue
  property: '#f97316', // orange
  liability: '#ef4444', // red
};

export const DEFAULT_COLOR = '#6b7280';

// Shades of red for liability pie slices
export const LIABILITY_COLORS = [
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
];

// Multi-category palette for source breakdowns
export const SOURCE_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#eab308',
];

// Trend-line colors (net worth / assets / liabilities)
export const TREND_COLORS = {
  netWorth: '#8b5cf6',
  assets: '#22c55e',
  liabilities: '#ef4444',
};

// Personal loan status colors (outstanding vs repaid)
export const LOAN_STATUS_COLORS = {
  active: '#2563eb', // blue-600
  repaid: '#059669', // emerald-600
};

// Brand accent used for spending visualizations (stable across themes)
export const TERRACOTTA = '#D98364';

export function assetTypeColor(type: string | undefined): string {
  return (type && ASSET_TYPE_COLORS[type]) || DEFAULT_COLOR;
}
