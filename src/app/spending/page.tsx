'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SpendingChart } from '@/components/charts/SpendingChart';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useTransactions, useSpendingCategories, useSpendingSummary } from '@/hooks/useTransactions';
import { Transaction, CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export default function SpendingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions(currentMonth);
  const { categories } = useSpendingCategories();
  const { summary, totalSpending } = useSpendingSummary(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        toast.success('Transaction deleted');
      } catch (error) {
        toast.error('Failed to delete transaction');
      }
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

  // Group transactions by date
  const transactionsByDate = transactions.reduce((acc, transaction) => {
    const date = transaction.transaction_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calculate monthly total
  const monthlyTotal = transactions.reduce(
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
          {/* Mobile Add Button */}
          <Button
            size="sm"
            className="sm:hidden"
            onClick={() => {
              setEditingTransaction(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop Add Button */}
        <Button
          className="hidden sm:flex"
          onClick={() => {
            setEditingTransaction(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 grid gap-3 sm:mb-6 sm:gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-lg">Monthly Spending</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{format(currentMonth, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl font-bold sm:text-3xl">{formatCurrency(monthlyTotal)}</div>
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
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="h-[180px] sm:h-auto">
              <SpendingChart data={summary} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      {loading ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-sm sm:h-64">
            Loading transactions...
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-3 sm:h-64 sm:gap-4">
            <p className="text-sm text-muted-foreground">No transactions for {format(currentMonth, 'MMM yyyy')}</p>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              All expenses for {format(currentMonth, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {/* Mobile: Card-based list */}
            <div className="space-y-3 sm:hidden">
              {Object.entries(transactionsByDate)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dayTransactions]) => (
                  <div key={date}>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {format(new Date(date), 'EEE, MMM d')}
                    </p>
                    <div className="space-y-2">
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
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                  <Pencil className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(transactionsByDate)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayTransactions]) => (
                      <>
                        {dayTransactions.map((transaction, index) => (
                          <TableRow key={transaction.id}>
                            {index === 0 && (
                              <TableCell
                                rowSpan={dayTransactions.length}
                                className="font-medium align-top"
                              >
                                {format(new Date(date), 'EEE, MMM d')}
                              </TableCell>
                            )}
                            <TableCell>
                              {transaction.description || (
                                <span className="text-muted-foreground">No description</span>
                              )}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditTransaction(transaction)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
