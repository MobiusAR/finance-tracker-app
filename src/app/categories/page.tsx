'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useSpendingCategories, useBudgetStatus } from '@/hooks/useTransactions';
import { SpendingCategory, CreateSpendingCategory } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CategoriesPage() {
  const { createCategory, updateCategory, deleteCategory } = useSpendingCategories();
  const { budgetStatus, loading, refetch } = useBudgetStatus();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpendingCategory | null>(null);

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCreateCategory = async (data: CreateSpendingCategory) => {
    await createCategory(data);
    refetch();
  };

  const handleUpdateCategory = async (data: CreateSpendingCategory) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      setEditingCategory(null);
      refetch();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? Transactions with this category will become uncategorized.')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted');
        refetch();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleEditCategory = (category: SpendingCategory) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const getProgressColor = (percentUsed: number | null) => {
    if (percentUsed === null) return 'bg-gray-300';
    if (percentUsed >= 100) return 'bg-red-500';
    if (percentUsed >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate totals
  const totalBudget = budgetStatus
    .filter((s) => s.budget !== null)
    .reduce((sum, s) => sum + (s.budget || 0), 0);
  const totalSpent = budgetStatus.reduce((sum, s) => sum + s.spent, 0);
  const overBudgetCount = budgetStatus.filter((s) => s.isOverBudget).length;

  return (
    <div>
      <Header
        title="Spending Categories"
        description="Manage your expense categories and track budgets"
      />

      {/* Budget Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Across {budgetStatus.filter((s) => s.budget).length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spent This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            {overBudgetCount > 0 ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{overBudgetCount}</span>
                <span className="text-sm text-muted-foreground">over budget</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">All good!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            Loading categories...
          </CardContent>
        </Card>
      ) : budgetStatus.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">No categories found</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgetStatus.map(({ category, spent, budget, remaining, percentUsed, isOverBudget }) => (
            <Card key={category.id} className={isOverBudget ? 'border-red-300 bg-red-50/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Over Budget
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {budget ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        <span className="font-medium">{formatCurrency(spent)}</span>
                        <span className="text-muted-foreground"> of {formatCurrency(budget)}</span>
                      </span>
                      <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {remaining !== null && remaining >= 0
                          ? `${formatCurrency(remaining)} left`
                          : `${formatCurrency(Math.abs(remaining || 0))} over`}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={Math.min(percentUsed || 0, 100)} 
                        className="h-2"
                      />
                      {/* Overlay for over-budget indicator */}
                      <div 
                        className={`absolute inset-0 h-2 rounded-full ${getProgressColor(percentUsed)}`}
                        style={{ width: `${Math.min(percentUsed || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentUsed !== null ? `${Math.round(percentUsed)}% used` : ''}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        <span className="font-medium">{formatCurrency(spent)}</span>
                        <span className="text-muted-foreground"> spent this month</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">No budget set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
      />
    </div>
  );
}
