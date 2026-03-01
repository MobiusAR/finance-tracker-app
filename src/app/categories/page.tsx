'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useSpendingCategories, useBudgetStatus, useBudgetSurplus, useSurplusConfig, updateSurplusManualAdjustment } from '@/hooks/useTransactions';
import { SpendingCategory, CreateSpendingCategory } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle, CheckCircle, PiggyBank, Settings, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SurplusConfigForm } from '@/components/forms/SurplusConfigForm';
import { SurplusAdjustmentForm } from '@/components/forms/SurplusAdjustmentForm';

export default function CategoriesPage() {
  const { createCategory, updateCategory, deleteCategory } = useSpendingCategories();
  const { budgetStatus, loading, refetch } = useBudgetStatus();
  const { totalSurplus, monthlyBreakdown, loading: surplusLoading, refetch: refetchSurplus } = useBudgetSurplus();
  const { config, updateConfig, loading: configLoading } = useSurplusConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
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
    if (percentUsed === null) return 'bg-muted-foreground/30';
    if (percentUsed >= 100) return 'bg-destructive';
    if (percentUsed >= 80) return 'bg-terracotta';
    return 'bg-sage';
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
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg font-bold sm:text-2xl">{formatCurrency(totalBudget)}</div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {budgetStatus.filter((s) => s.budget).length} categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-terracotta">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Spent</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg font-bold sm:text-2xl">{formatCurrency(totalSpent)}</div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {format(new Date(), 'MMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sage">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {overBudgetCount > 0 ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
                <span className="text-lg font-bold text-destructive sm:text-2xl">{overBudgetCount}</span>
                <span className="text-xs text-muted-foreground sm:text-sm">over budget</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sage sm:h-5 sm:w-5" />
                <span className="text-lg font-bold text-sage sm:text-2xl">All good!</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 border-l-4 border-l-primary md:col-span-1 relative">
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium sm:text-sm">Budget Surplus</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-1 right-1 sm:top-2 sm:right-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {surplusLoading ? (
              <div className="text-lg font-bold sm:text-2xl">...</div>
            ) : monthlyBreakdown.length === 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  <span className="text-lg font-bold text-muted-foreground sm:text-2xl">-</span>
                </div>
                <p className="text-[10px] text-muted-foreground sm:text-xs">Starts Mar 2026</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <PiggyBank className={`h-4 w-4 sm:h-5 sm:w-5 ${totalSurplus + (config?.initial_balance || 0) >= 0 ? 'text-sage' : 'text-destructive'}`} />
                  <span className={`text-lg font-bold sm:text-2xl ${totalSurplus + (config?.initial_balance || 0) >= 0 ? 'text-sage' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(totalSurplus + (config?.initial_balance || 0)))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setAdjustmentOpen(true)}
                    title="Manual Adjustment"
                  >
                    <FileEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground sm:text-xs">
                  {totalSurplus >= 0 ? 'Accumulated savings' : 'Overspent'} &middot; since Mar 2026
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between sm:mb-6 sm:justify-end">
        <span className="text-sm font-medium text-muted-foreground sm:hidden">
          {budgetStatus.length} categories
        </span>
        <Button
          size="sm"
          className="sm:size-default"
          onClick={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4 sm:mr-2" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Category</span>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center sm:h-64">
            Loading categories...
          </CardContent>
        </Card>
      ) : budgetStatus.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-3 sm:h-64 sm:gap-4">
            <p className="text-sm text-muted-foreground">No categories found</p>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {budgetStatus.map(({ category, spent, budget, remaining, percentUsed, isOverBudget }) => (
            <Card key={category.id} className={isOverBudget ? 'border border-destructive/30 bg-destructive/5' : ''}>
              <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1 sm:gap-3">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full sm:h-4 sm:w-4"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-sm truncate sm:text-base">{category.name}</CardTitle>
                    {isOverBudget && (
                      <Badge variant="destructive" className="hidden text-xs sm:flex">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Over
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isOverBudget && (
                      <AlertTriangle className="h-4 w-4 text-destructive sm:hidden" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                {budget ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-between gap-x-2 text-xs sm:text-sm">
                      <span>
                        <span className="font-medium">{formatCurrency(spent)}</span>
                        <span className="text-muted-foreground"> / {formatCurrency(budget)}</span>
                      </span>
                      <span className={isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {remaining !== null && remaining >= 0
                          ? `${formatCurrency(remaining)} left`
                          : `${formatCurrency(Math.abs(remaining || 0))} over`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:h-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentUsed)}`}
                        style={{ width: `${Math.min(percentUsed || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      {percentUsed !== null ? `${Math.round(percentUsed)}% used` : ''}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">{formatCurrency(spent)}</span>
                      <span className="text-muted-foreground"> spent</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">No budget set</p>
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

      <SurplusConfigForm
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSubmit={updateConfig}
        config={config}
      />

      <SurplusAdjustmentForm
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        onSubmit={async (id, val) => {
          await updateSurplusManualAdjustment(id, val);
          refetchSurplus();
        }}
        surplusList={monthlyBreakdown}
      />
    </div>
  );
}
