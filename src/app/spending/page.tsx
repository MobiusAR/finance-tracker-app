'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SpendingChart } from '@/components/charts/SpendingChart';
import { MonthlySpendingTrendChart } from '@/components/charts/MonthlySpendingTrendChart';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useTransactions, useSpendingCategories, useSpendingSummary, useMonthlySpendingTrend, useAllTransactions } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Transaction, CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, Search, X, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMonths, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { TRANSACTIONS_CHANGED_EVENT, notifyTransactionsChanged } from '@/lib/events';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SpendingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction, refetch: refetchTransactions } =
    useTransactions(currentMonth);
  const { categories } = useSpendingCategories();
  const { summary, refetch: refetchSummary } = useSpendingSummary(1, currentMonth);
  const { trend, loading: trendLoading, refetch: refetchTrend } = useMonthlySpendingTrend(12);

  useEffect(() => {
    const onChanged = () => {
      refetchTransactions();
      refetchSummary();
      refetchTrend();
    };
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, onChanged);
  }, [refetchTransactions, refetchSummary, refetchTrend]);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const prevMonthRef = useRef<string>('');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || amountMin || amountMax;

  const isSearchingAll = searchQuery.trim().length > 0;
  const { transactions: allTransactions, loading: allLoading } = useAllTransactions(isSearchingAll);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAmountMin('');
    setAmountMax('');
  };

  const sourceTransactions = isSearchingAll ? allTransactions : transactions;

  const filteredTransactions = sourceTransactions.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      const matchCategory = t.category?.name ? t.category.name.toLowerCase().includes(q) : false;
      const matchAmount = t.amount ? formatCurrency(t.amount).includes(q) : false;
      if (!matchDesc && !matchCategory && !matchAmount) return false;
    }
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        if (t.category_id) return false;
      } else {
        if (t.category_id !== categoryFilter) return false;
      }
    }
    if (amountMin && Number(t.amount) < Number(amountMin)) return false;
    if (amountMax && Number(t.amount) > Number(amountMax)) return false;
    return true;
  });

  // Auto-expand the most recent date when month changes
  useEffect(() => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    const isNewMonth = prevMonthRef.current !== monthKey;
    if (isNewMonth && transactions.length > 0) {
      prevMonthRef.current = monthKey;
      const sortedDates = [...new Set(transactions.map(t => t.transaction_date))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (sortedDates.length > 0) {
        // Use functional state update to avoid stale closures, though we are setting a new set
        setTimeout(() => {
          setOpenDates(new Set([sortedDates[0]]));
        }, 0);
      }
    }
  }, [transactions, currentMonth]);

  const toggleDate = (date: string) => {
    setOpenDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };



  const handleCreateTransaction = async (data: CreateTransaction | UpdateTransaction) => {
    await createTransaction(data as CreateTransaction);
  };

  const handleUpdateTransaction = async (data: CreateTransaction | UpdateTransaction) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      await deleteTransaction(transaction.id);
      notifyTransactionsChanged();
      toast.success('Transaction deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await createTransaction({
                amount: transaction.amount,
                category_id: transaction.category_id || undefined,
                description: transaction.description || undefined,
                transaction_date: transaction.transaction_date.slice(0, 10),
              });
              notifyTransactionsChanged();
              toast.success('Transaction restored');
            } catch {
              toast.error('Failed to undo');
            }
          },
        },
      });
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Group filtered transactions by date
  const transactionsByDate = filteredTransactions.reduce((acc, transaction) => {
    const date = transaction.transaction_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calculate monthly total (always from all transactions, not filtered)
  const monthlyTotal = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const filteredTotal = filteredTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  return (
    <div>
      <Header
        title="Spending Tracker"
        description="Track your daily expenses and spending habits"
      />

      {/* Month Navigation & Add Button */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={goToCurrentMonth}>
              {format(currentMonth, 'MMM yyyy')}
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Mobile Buttons */}
          <div className="flex sm:hidden gap-1.5">
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link href="/subscriptions">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTransaction(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/subscriptions">
              <CalendarDays className="mr-2 h-4 w-4" />
              Subscriptions
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 grid gap-3 sm:mb-6 sm:gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-terracotta">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Monthly Spending</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{format(currentMonth, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl font-bold sm:text-3xl">{formatCurrency(monthlyTotal, 'SGD', 0)}</div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Spending by Category</CardTitle>
            <CardDescription className="text-xs sm:text-sm">This month&apos;s breakdown</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 overflow-hidden">
            <SpendingChart data={summary} />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Trend */}
      <div className="mb-4 sm:mb-6">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Monthly Spending Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {trendLoading ? (
              <Skeleton className="h-[250px] w-full rounded-xl" />
            ) : (
              <MonthlySpendingTrendChart
                data={trend}
                budget={categories.reduce((sum, c) => sum + (Number(c.budget_amount) || 0), 0)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      {(!loading && transactions.length > 0) || isSearchingAll ? (
        <div className="mb-4 space-y-3 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-end sm:gap-3 sm:p-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-1">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Min ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="h-9 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Max ($)</label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="h-9 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0 text-xs">
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isSearchingAll ? 'Searching all history · ' : ''}
                Showing {filteredTransactions.length} of {sourceTransactions.length} transactions
                {filteredTransactions.length !== sourceTransactions.length && (
                  <> &middot; {formatCurrency(filteredTotal, 'SGD', 0)}</>
                )}
              </span>
              <button onClick={clearAllFilters} className="underline hover:text-foreground">
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Transactions List */}
      {(() => {
        const listLoading = isSearchingAll ? allLoading : loading;
        const listTitle = isSearchingAll ? 'Search Results' : 'Transactions';
        const listDescription = isSearchingAll
          ? 'Across all history'
          : `All expenses for ${format(currentMonth, 'MMMM yyyy')}`;
        const showNoTransactions = !isSearchingAll && transactions.length === 0;
        const showNoMatch =
          !listLoading && !showNoTransactions && filteredTransactions.length === 0;

        if (listLoading) {
          return (
            <Card>
              <CardContent className="flex h-40 items-center justify-center text-sm sm:h-64">
                {isSearchingAll ? 'Searching all history...' : 'Loading transactions...'}
              </CardContent>
            </Card>
          );
        }

        if (showNoTransactions) {
          return (
            <Card>
              <CardContent className="flex h-40 flex-col items-center justify-center gap-3 sm:h-64 sm:gap-4">
                <p className="text-sm text-muted-foreground">No transactions for {format(currentMonth, 'MMM yyyy')}</p>
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Transaction
                </Button>
              </CardContent>
            </Card>
          );
        }

        if (showNoMatch) {
          return (
            <Card>
              <CardContent className="flex h-40 flex-col items-center justify-center gap-3 sm:h-64 sm:gap-4">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {isSearchingAll ? 'No transactions match your search' : 'No transactions match your filters'}
                </p>
                <Button size="sm" variant="outline" onClick={clearAllFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{listTitle}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{listDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {Object.entries(transactionsByDate)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, dayTransactions]) => {
                    const dailyTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
                    const isOpen = openDates.has(date);
                    return (
                      <div key={date}>
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                            />
                            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              {format(new Date(date), 'EEE, MMM d')}
                            </span>
                            <span className="text-xs text-muted-foreground">({dayTransactions.length})</span>
                          </div>
                          <span className="text-sm sm:text-base font-semibold">{formatCurrency(dailyTotal)}</span>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 sm:px-6 sm:pb-4">
                            <div className="space-y-2 sm:hidden">
                              {dayTransactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="flex-1 min-w-0 mr-2">
                                    <p className="font-medium text-sm truncate">
                                      {transaction.description || 'No description'}
                                    </p>
                                    {transaction.category ? (
                                      <Badge
                                        variant="secondary"
                                        className="mt-1 text-xs"
                                        style={{
                                          backgroundColor: `${transaction.category.color}20`,
                                          color: transaction.category.color,
                                        }}
                                      >
                                        {transaction.category.name}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="mt-1 text-xs">Uncategorized</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-sm whitespace-nowrap">
                                      {formatCurrency(transaction.amount)}
                                    </span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Transaction actions">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                          <Pencil className="mr-2 h-4 w-4" />Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDeleteTarget(transaction)} className="text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="hidden sm:block space-y-1">
                              {dayTransactions.map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex items-center gap-4 rounded-md px-3 py-2 hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex-1 min-w-0 text-sm">
                                    {transaction.description || (
                                      <span className="text-muted-foreground">No description</span>
                                    )}
                                  </div>
                                  <div className="shrink-0">
                                    {transaction.category ? (
                                      <Badge
                                        variant="secondary"
                                        style={{
                                          backgroundColor: `${transaction.category.color}20`,
                                          color: transaction.category.color,
                                          borderColor: transaction.category.color,
                                        }}
                                      >
                                        {transaction.category.name}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Uncategorized</Badge>
                                    )}
                                  </div>
                                  <div className="w-24 text-right font-medium text-sm shrink-0">
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                  <div className="shrink-0">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="Transaction actions">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => setDeleteTarget(transaction)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        categories={categories}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        transaction={editingTransaction}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? You can undo this from the toast.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) handleDeleteTransaction(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
