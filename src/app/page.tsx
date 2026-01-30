'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { LiabilitiesChart } from '@/components/charts/LiabilitiesChart';
import { SpendingChart } from '@/components/charts/SpendingChart';
import { SourceBreakdownChart } from '@/components/charts/SourceBreakdownChart';
import { NetWorthTrendChart } from '@/components/charts/NetWorthTrendChart';
import { useNetWorthBreakdown } from '@/hooks/useAssets';
import { useSpendingSummary } from '@/hooks/useTransactions';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Camera, History, PieChart, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const { history, loading: historyLoading, takeSnapshot, refetch: refetchHistory } = useNetWorthHistory();
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<string | null>(null);
  const [selectedLiabilityCategory, setSelectedLiabilityCategory] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
  const previousSnapshot = history.length > 1 ? history[history.length - 2] : null;
  
  // Calculate month-over-month change
  const netWorthChange = lastSnapshot && previousSnapshot
    ? lastSnapshot.net_worth - previousSnapshot.net_worth
    : null;

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your financial health"
      />

      {/* Summary Cards - 2x2 grid on mobile, 4 cols on desktop */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Net Worth</CardTitle>
            <Wallet className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">
              {assetsLoading ? '...' : formatCurrency(totalNetWorth)}
            </div>
            {netWorthChange !== null && (
              <p className={`text-[10px] md:text-xs ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorthChange >= 0 ? '+' : ''}{formatCurrency(netWorthChange)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Assets</CardTitle>
            <TrendingUp className="h-3 w-3 text-green-500 md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold text-green-600 md:text-2xl">
              {assetsLoading ? '...' : formatCurrency(totalAssets)}
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              Investments + Cash
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Liabilities</CardTitle>
            <TrendingDown className="h-3 w-3 text-red-500 md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold text-red-600 md:text-2xl">
              {assetsLoading ? '...' : formatCurrency(totalLiabilities)}
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              Loans & debts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Spending</CardTitle>
            <CreditCard className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">
              {spendingLoading ? '...' : formatCurrency(totalSpending)}
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:py-2 md:px-4">
            <History className="h-4 w-4" />
            <span className="text-[10px] md:text-sm">History</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex flex-col items-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:py-2 md:px-4">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] md:text-sm">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="liabilities" className="flex flex-col items-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:py-2 md:px-4">
            <TrendingDown className="h-4 w-4" />
            <span className="text-[10px] md:text-sm">Liabilities</span>
          </TabsTrigger>
          <TabsTrigger value="spending" className="flex flex-col items-center gap-1 py-2 px-1 md:flex-row md:gap-2 md:py-2 md:px-4">
            <Receipt className="h-4 w-4" />
            <span className="text-[10px] md:text-sm">Spending</span>
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
                <div className="flex h-[250px] items-center justify-center md:h-[400px]">
                  Loading history...
                </div>
              ) : (
                <div className="h-[250px] md:h-[400px]">
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
                  <PieChart className="h-4 w-4 text-green-500 md:h-5 md:w-5" />
                  Assets Breakdown
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Tap a category to see details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {assetsLoading ? (
                  <div className="flex h-[250px] items-center justify-center md:h-[350px]">
                    Loading...
                  </div>
                ) : (
                  <div className="h-[250px] md:h-[350px]">
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
                  <div className="h-[250px] md:h-[350px]">
                    <SourceBreakdownChart
                      data={sourceBreakdown[selectedAssetCategory]}
                      category={selectedAssetCategory}
                    />
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground md:h-[350px]">
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
                  <PieChart className="h-4 w-4 text-red-500 md:h-5 md:w-5" />
                  Liabilities Breakdown
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Tap a category to see details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {assetsLoading ? (
                  <div className="flex h-[250px] items-center justify-center md:h-[350px]">
                    Loading...
                  </div>
                ) : (
                  <div className="h-[250px] md:h-[350px]">
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
                  <div className="h-[250px] md:h-[350px]">
                    <SourceBreakdownChart
                      data={sourceBreakdown[selectedLiabilityCategory]}
                      category={selectedLiabilityCategory}
                    />
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground md:h-[350px]">
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
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {spendingLoading ? (
                <div className="flex h-[300px] items-center justify-center md:h-[400px]">
                  Loading...
                </div>
              ) : (
                <div className="h-[300px] md:h-[400px]">
                  <SpendingChart data={summary} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
