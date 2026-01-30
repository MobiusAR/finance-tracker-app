'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { LiabilitiesChart } from '@/components/charts/LiabilitiesChart';
import { SpendingChart } from '@/components/charts/SpendingChart';
import { SourceBreakdownChart } from '@/components/charts/SourceBreakdownChart';
import { useNetWorthBreakdown } from '@/hooks/useAssets';
import { useSpendingSummary } from '@/hooks/useTransactions';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const {
    breakdown,
    sourceBreakdown,
    totalNetWorth,
    totalAssets,
    totalLiabilities,
    loading: assetsLoading,
  } = useNetWorthBreakdown();

  const { summary, totalSpending, loading: spendingLoading } = useSpendingSummary(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle category click from either chart
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your financial health"
      />

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assetsLoading ? '...' : formatCurrency(totalNetWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assetsLoading ? '...' : formatCurrency(totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground">
              Investments + Cash + Property
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assetsLoading ? '...' : formatCurrency(totalLiabilities)}
            </div>
            <p className="text-xs text-muted-foreground">
              Loans & other liabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spendingLoading ? '...' : formatCurrency(totalSpending)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month&apos;s expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Assets Breakdown
            </CardTitle>
            <CardDescription>
              Click on a category to see source breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                Loading...
              </div>
            ) : (
              <NetWorthChart
                data={breakdown}
                onCategoryClick={handleCategoryClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Liabilities Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Liabilities Breakdown
            </CardTitle>
            <CardDescription>
              Click on a category to see source breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <div className="flex h-[250px] items-center justify-center">
                Loading...
              </div>
            ) : (
              <LiabilitiesChart
                data={breakdown}
                onCategoryClick={handleCategoryClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory ? `${selectedCategory} Sources` : 'Source Breakdown'}
            </CardTitle>
            <CardDescription>
              {selectedCategory
                ? 'Breakdown by source/platform'
                : 'Select a category from the charts above'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCategory && sourceBreakdown[selectedCategory] ? (
              <SourceBreakdownChart
                data={sourceBreakdown[selectedCategory]}
                category={selectedCategory}
              />
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                {assetsLoading
                  ? 'Loading...'
                  : 'Click a category in the charts above to see details'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              This month&apos;s expenses breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                Loading...
              </div>
            ) : (
              <SpendingChart data={summary} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
