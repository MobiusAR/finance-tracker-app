// Shared currency formatter. Use `decimals = 0` for large summary totals
// (net worth, assets, monthly spending) and the default 2 for line items
// (transactions, loans, subscriptions).

export function formatCurrency(
  value: number,
  currency: string = 'SGD',
  decimals: number = 2,
): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
