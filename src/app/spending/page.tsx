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

      <div className="mb-6 flex items-center justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentMonth}>
            {format(currentMonth, 'MMMM yyyy')}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

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

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Spending</CardTitle>
            <CardDescription>{format(currentMonth, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(monthlyTotal)}</div>
            <p className="text-sm text-muted-foreground">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
            <CardDescription>This month&apos;s breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart data={summary} />
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      {loading ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            Loading transactions...
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">No transactions for {format(currentMonth, 'MMMM yyyy')}</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              All expenses for {format(currentMonth, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
