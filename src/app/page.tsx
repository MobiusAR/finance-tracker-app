'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { LiabilitiesChart } from '@/components/charts/LiabilitiesChart';
import { SpendingChart } from '@/components/charts/SpendingChart';
import { SourceBreakdownChart } from '@/components/charts/SourceBreakdownChart';
import { NetWorthTrendChart } from '@/components/charts/NetWorthTrendChart';
import { useNetWorthBreakdown } from '@/hooks/useAssets';
import { useSpendingSummary, useBudgetStatus } from '@/hooks/useTransactions';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { useLatestInsight } from '@/hooks/useInsights';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Camera, History, PieChart, Receipt, Shield, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { ASSET_TYPE_COLORS } from '@/lib/colors';

export default function Dashboard() {
  const {
    breakdown,
    sourceBreakdown,
    totalNetWorth,
    totalAssets,
    totalCpf,
    totalLiabilities,
    totalGain,
    loading: assetsLoading,
  } = useNetWorthBreakdown();

  const { summary, totalSpending, loading: spendingLoading } = useSpendingSummary(1);
  const { budgetStatus, loading: budgetLoading } = useBudgetStatus();
  const { history, loading: historyLoading, takeSnapshot, refetch: refetchHistory } = useNetWorthHistory();
  const { insight } = useLatestInsight();
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<string | null>(null);
  const [selectedLiabilityCategory, setSelectedLiabilityCategory] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const handleTakeSnapshot = async () => {
    try {
      setSnapshotLoading(true);
      await takeSnapshot();
      toast.success('Snapshot saved!');
      refetchHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to take snapshot');
    } finally {
      setSnapshotLoading(false);
    }
  };

  // Get last snapshot info
  const lastSnapshot = history.length > 0 ? history[history.length - 1] : null;

  // Change in live net worth since the most recent snapshot
  const netWorthChange = lastSnapshot && !assetsLoading
    ? totalNetWorth - lastSnapshot.net_worth
    : null;

  const totalBudget = budgetStatus
    .filter((s) => s.budget !== null)
    .reduce((sum, s) => sum + (s.budget || 0), 0);
  const totalBudgetSpent = budgetStatus.reduce((sum, s) => sum + s.spent, 0);
  const overBudgetCategories = budgetStatus.filter((s) => s.isOverBudget);

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your financial health"
      />

      {/* Summary Cards - 2x2 grid on mobile, 4 cols on desktop */}
      <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2 px-2 md:gap-4 md:px-0 md:mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-medium md:text-sm truncate mr-1">Net Worth</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {assetsLoading ? (
              <Skeleton className="h-7 w-24 md:h-8 md:w-32" />
            ) : (
              <div className="text-base sm:text-lg font-bold md:text-2xl truncate">
                {formatCurrency(totalNetWorth, 'SGD', 0)}
              </div>
            )}
            {netWorthChange !== null && (
              <p className={`text-[11px] md:text-xs ${netWorthChange >= 0 ? 'text-sage' : 'text-destructive'}`}>
                {netWorthChange >= 0 ? '+' : ''}{formatCurrency(netWorthChange, 'SGD', 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sage">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-medium md:text-sm truncate mr-1">Assets</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-sage shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {assetsLoading ? (
              <Skeleton className="h-7 w-24 md:h-8 md:w-32" />
            ) : (
              <div className="text-base sm:text-lg font-bold text-sage md:text-2xl truncate">
                {formatCurrency(totalAssets, 'SGD', 0)}
              </div>
            )}
            <p className="hidden text-xs text-muted-foreground md:block">
              Investments + Cash
            </p>
            {totalGain !== 0 && (
              <p className={`text-[11px] md:text-xs ${totalGain >= 0 ? 'text-sage' : 'text-destructive'}`}>
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, 'SGD', 0)} total return
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: ASSET_TYPE_COLORS.cpf }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-medium md:text-sm truncate mr-1">CPF</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" style={{ color: ASSET_TYPE_COLORS.cpf }} />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {assetsLoading ? (
              <Skeleton className="h-7 w-24 md:h-8 md:w-32" />
            ) : (
              <div className="text-base sm:text-lg font-bold md:text-2xl truncate" style={{ color: ASSET_TYPE_COLORS.cpf }}>
                {formatCurrency(totalCpf, 'SGD', 0)}
              </div>
            )}
            <p className="hidden text-xs text-muted-foreground md:block">
              Retirement funds
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-medium md:text-sm truncate mr-1">Liabilities</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {assetsLoading ? (
              <Skeleton className="h-7 w-24 md:h-8 md:w-32" />
            ) : (
              <div className="text-base sm:text-lg font-bold text-destructive md:text-2xl truncate">
                {formatCurrency(totalLiabilities, 'SGD', 0)}
              </div>
            )}
            <p className="hidden text-xs text-muted-foreground md:block">
              Loans & debts
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-terracotta">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[11px] sm:text-xs font-medium md:text-sm truncate mr-1">Spending</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-terracotta shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {spendingLoading ? (
              <Skeleton className="h-7 w-24 md:h-8 md:w-32" />
            ) : (
              <div className="text-base sm:text-lg font-bold md:text-2xl truncate">
                {formatCurrency(totalSpending, 'SGD', 0)}
              </div>
            )}
            <p className="hidden text-xs text-muted-foreground md:block">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <div className="mb-4 px-2 md:px-0 md:mb-6">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base">Budget Overview</CardTitle>
              {budgetLoading ? null : overBudgetCategories.length > 0 ? (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {overBudgetCategories.length} over budget
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-sage">
                  <CheckCircle className="h-4 w-4" />
                  On track
                </span>
              )}
            </div>
            <CardDescription className="text-xs sm:text-sm">This month&apos;s spending vs budget</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2 sm:p-6 sm:pt-2">
            {budgetLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : totalBudget === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets set. Add budgets in Categories.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium">{formatCurrency(totalBudgetSpent, 'SGD', 0)}</span>
                    <span className="text-muted-foreground">of {formatCurrency(totalBudget, 'SGD', 0)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${totalBudgetSpent > totalBudget ? 'bg-destructive' : 'bg-sage'}`}
                      style={{ width: `${Math.min((totalBudgetSpent / totalBudget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {overBudgetCategories.length > 0 && (
                  <div className="space-y-1.5">
                    {overBudgetCategories.slice(0, 3).map(({ category, spent, budget, percentUsed }) => (
                      <div key={category.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="truncate">{category.name}</span>
                        </div>
                        <span className="shrink-0 text-destructive font-medium">
                          {formatCurrency(Math.abs((budget || 0) - spent), 'SGD', 0)} over · {Math.round(percentUsed || 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Insights */}
      {insight && (
        <div className="mb-4 px-2 md:px-0 md:mb-6">
          <Card className="border-l-4 border-l-terracotta">
            <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="h-4 w-4 text-terracotta" />
                Weekly Insights
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Week of {format(new Date(insight.week_start), 'MMM d')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-2 sm:p-6 sm:pt-2">
              <p className="whitespace-pre-line text-sm text-muted-foreground">{insight.analysis}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="history" className="space-y-4 px-2 md:px-0">
        <TabsList className="grid grid-cols-4 h-auto w-full p-1 gap-1">
          <TabsTrigger value="history" className="flex flex-col items-center justify-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:px-4">
            <History className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm truncate">History</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex flex-col items-center justify-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:px-4">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm truncate">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="liabilities" className="flex flex-col items-center justify-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:px-4">
            <TrendingDown className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm truncate">Liab.</span>
          </TabsTrigger>
          <TabsTrigger value="spending" className="flex flex-col items-center justify-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:px-4">
            <Receipt className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm truncate">Spend</span>
          </TabsTrigger>
        </TabsList>

        {/* Net Worth History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <History className="h-4 w-4 md:h-5 md:w-5" />
                    Net Worth History
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {lastSnapshot && (
                      <span>Last: {format(new Date(lastSnapshot.snapshot_date), 'MMM d, yyyy')}</span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleTakeSnapshot}
                  disabled={snapshotLoading || assetsLoading}
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {snapshotLoading ? 'Saving...' : 'Take Snapshot'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {historyLoading ? (
                <Skeleton className="h-[300px] w-full rounded-xl md:h-[400px]" />
              ) : (
                <div className="h-[300px] md:h-[400px]">
                  <NetWorthTrendChart data={history} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <PieChart className="h-4 w-4 text-sage md:h-5 md:w-5" />
                  Assets Breakdown
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Tap a category to see details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {assetsLoading ? (
                  <Skeleton className="h-[300px] w-full rounded-full md:h-[350px]" />
                ) : (
                  <div className="h-[300px] md:h-[350px]">
                    <NetWorthChart
                      data={breakdown}
                      onCategoryClick={setSelectedAssetCategory}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">
                  {selectedAssetCategory ? `${selectedAssetCategory}` : 'Source Breakdown'}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {selectedAssetCategory
                    ? 'By source/platform'
                    : 'Select a category above'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {selectedAssetCategory && sourceBreakdown[selectedAssetCategory] ? (
                  <div className="h-[300px] md:h-[350px]">
                    <SourceBreakdownChart
                      data={sourceBreakdown[selectedAssetCategory]}
                      category={selectedAssetCategory}
                    />
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground md:h-[350px]">
                    {assetsLoading
                      ? 'Loading...'
                      : 'Tap a category to see breakdown'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Liabilities Tab */}
        <TabsContent value="liabilities">
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <PieChart className="h-4 w-4 text-destructive md:h-5 md:w-5" />
                  Liabilities Breakdown
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Tap a category to see details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {assetsLoading ? (
                  <Skeleton className="h-[300px] w-full rounded-full md:h-[350px]" />
                ) : (
                  <div className="h-[300px] md:h-[350px]">
                    <LiabilitiesChart
                      data={breakdown}
                      onCategoryClick={setSelectedLiabilityCategory}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">
                  {selectedLiabilityCategory ? `${selectedLiabilityCategory}` : 'Source Breakdown'}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {selectedLiabilityCategory
                    ? 'By source/platform'
                    : 'Select a category above'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {selectedLiabilityCategory && sourceBreakdown[selectedLiabilityCategory] ? (
                  <div className="h-[300px] md:h-[350px]">
                    <SourceBreakdownChart
                      data={sourceBreakdown[selectedLiabilityCategory]}
                      category={selectedLiabilityCategory}
                    />
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground md:h-[350px]">
                    {assetsLoading
                      ? 'Loading...'
                      : 'Tap a category to see breakdown'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Spending Tab */}
        <TabsContent value="spending">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                Spending by Category
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                This month&apos;s expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0 overflow-hidden">
              {spendingLoading ? (
                <Skeleton className="h-[200px] w-full rounded-xl md:h-[300px]" />
              ) : (
                <SpendingChart data={summary} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
