'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Transaction,
  SpendingCategory,
  BudgetSurplus,
  CreateTransaction,
  UpdateTransaction,
  CreateSpendingCategory,
  SpendingSummary,
  SurplusConfig,
  RecurringTransaction,
  CreateRecurringTransaction,
} from '@/lib/supabase/types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const queryKeys = {
  spendingCategories: ['spending-categories'] as const,
  transactions: (monthKey: string) => ['transactions', monthKey] as const,
  spendingSummary: (months: number, monthKey: string) => ['spending-summary', months, monthKey] as const,
  spendingTrend: (months: number) => ['spending-trend', months] as const,
  allTransactions: ['all-transactions'] as const,
  budgetStatus: ['budget-status'] as const,
  budgetSurplus: ['budget-surplus'] as const,
  surplusConfig: ['surplus-config'] as const,
  recurringTransactions: ['recurring-transactions'] as const,
};

function invalidateSpending(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['spending-summary'] });
  qc.invalidateQueries({ queryKey: ['spending-trend'] });
  qc.invalidateQueries({ queryKey: ['all-transactions'] });
  qc.invalidateQueries({ queryKey: ['budget-status'] });
  qc.invalidateQueries({ queryKey: ['budget-surplus'] });
}

export function useSpendingCategories() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.spendingCategories,
    queryFn: async () => {
      const { data, error } = await supabase.from('spending_categories').select('*').order('name');
      if (error) throw error;
      return data as SpendingCategory[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.spendingCategories });

  const createCategory = useMutation({
    mutationFn: async (category: CreateSpendingCategory) => {
      const { data, error } = await supabase.from('spending_categories').insert(category).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateSpendingCategory> }) => {
      const { data, error } = await supabase.from('spending_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spending_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      invalidateSpending(qc);
    },
  });

  return {
    categories: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createCategory: (c: CreateSpendingCategory) => createCategory.mutateAsync(c),
    updateCategory: (id: string, u: Partial<CreateSpendingCategory>) => updateCategory.mutateAsync({ id, updates: u }),
    deleteCategory: (id: string) => deleteCategory.mutateAsync(id),
  };
}

export function useTransactions(month?: Date) {
  const qc = useQueryClient();
  const supabase = createClient();
  const monthKey = month ? format(month, 'yyyy-MM') : 'all';

  const query = useQuery({
    queryKey: queryKeys.transactions(monthKey),
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('*, category:spending_categories(*)')
        .order('transaction_date', { ascending: false });

      if (month) {
        const start = format(startOfMonth(month), 'yyyy-MM-dd');
        const end = format(endOfMonth(month), 'yyyy-MM-dd');
        q = q.gte('transaction_date', start).lte('transaction_date', end);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: CreateTransaction) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select('*, category:spending_categories(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateSpending(qc),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTransaction }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select('*, category:spending_categories(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateSpending(qc),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateSpending(qc),
  });

  return {
    transactions: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createTransaction: (t: CreateTransaction) => createTransaction.mutateAsync(t),
    updateTransaction: (id: string, u: UpdateTransaction) => updateTransaction.mutateAsync({ id, updates: u }),
    deleteTransaction: (id: string) => deleteTransaction.mutateAsync(id),
  };
}

export function useSpendingSummary(months: number = 1, baseMonth?: Date) {
  const supabase = createClient();
  const monthKey = baseMonth ? format(baseMonth, 'yyyy-MM') : 'current';

  const query = useQuery({
    queryKey: queryKeys.spendingSummary(months, monthKey),
    queryFn: async () => {
      const anchor = baseMonth || new Date();
      const startDate = format(startOfMonth(subMonths(anchor, months - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(anchor), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:spending_categories(*)')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      const categoryTotals: Record<string, { total: number; count: number; color: string }> = {};
      let total = 0;

      (data || []).forEach((transaction) => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        const categoryColor = transaction.category?.color || '#6b7280';
        const amount = Number(transaction.amount);

        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { total: 0, count: 0, color: categoryColor };
        }
        categoryTotals[categoryName].total += amount;
        categoryTotals[categoryName].count += 1;
        total += amount;
      });

      const summaryArray: SpendingSummary[] = Object.entries(categoryTotals)
        .map(([category, { total, count, color }]) => ({ category, color, total, count }))
        .sort((a, b) => b.total - a.total);

      return { summary: summaryArray, totalSpending: total };
    },
  });

  return {
    summary: query.data?.summary || [],
    totalSpending: query.data?.totalSpending || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export interface MonthlySpendingTrend {
  month: string;
  label: string;
  total: number;
  count: number;
}

export function useMonthlySpendingTrend(months: number = 12) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.spendingTrend(months),
    queryFn: async () => {
      const anchor = new Date();
      const start = format(startOfMonth(subMonths(anchor, months - 1)), 'yyyy-MM-dd');
      const end = format(endOfMonth(anchor), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .gte('transaction_date', start)
        .lte('transaction_date', end);

      if (error) throw error;

      const byMonth: Record<string, { total: number; count: number }> = {};
      (data || []).forEach((t) => {
        const key = t.transaction_date.slice(0, 7);
        if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
        byMonth[key].total += Number(t.amount);
        byMonth[key].count += 1;
      });

      const result: MonthlySpendingTrend[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(startOfMonth(anchor), i);
        const key = format(d, 'yyyy-MM');
        const entry = byMonth[key] || { total: 0, count: 0 };
        result.push({ month: key, label: format(d, 'MMM yy'), total: entry.total, count: entry.count });
      }
      return result;
    },
  });

  return {
    trend: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export function useAllTransactions(enabled: boolean = false) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.allTransactions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:spending_categories(*)')
        .order('transaction_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as Transaction[];
    },
    enabled,
  });

  return {
    transactions: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export interface BudgetStatus {
  category: SpendingCategory;
  spent: number;
  budget: number | null;
  remaining: number | null;
  percentUsed: number | null;
  isOverBudget: boolean;
}

export function useBudgetStatus() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.budgetStatus,
    queryFn: async () => {
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const [categoriesResult, transactionsResult] = await Promise.all([
        supabase.from('spending_categories').select('*').order('name'),
        supabase
          .from('transactions')
          .select('category_id, amount')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const categories = categoriesResult.data || [];
      const transactions = transactionsResult.data || [];

      const spentByCategory: Record<string, number> = {};
      transactions.forEach((t) => {
        if (t.category_id) {
          spentByCategory[t.category_id] = (spentByCategory[t.category_id] || 0) + Number(t.amount);
        }
      });

      return categories.map((category): BudgetStatus => {
        const spent = spentByCategory[category.id] || 0;
        const budget = category.budget_amount;
        const remaining = budget ? budget - spent : null;
        const percentUsed = budget ? (spent / budget) * 100 : null;
        const isOverBudget = budget ? spent > budget : false;
        return { category, spent, budget, remaining, percentUsed, isOverBudget };
      });
    },
  });

  return {
    budgetStatus: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export function useBudgetSurplus() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.budgetSurplus,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_surplus')
        .select('*')
        .order('month', { ascending: true });

      if (error) throw error;

      const rows = (data || []) as BudgetSurplus[];

      const today = new Date();
      const currentMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
      const hasCurrentMonth = rows.some((r) => r.month === currentMonthStr);

      if (!hasCurrentMonth && startOfMonth(today) >= new Date('2026-03-01')) {
        const startDate = currentMonthStr;
        const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

        const [configResult, incomeResult, categoriesResult, transactionsResult] = await Promise.all([
          supabase.from('surplus_config').select('*').eq('is_singleton', true).single(),
          supabase.from('income_records').select('net_pay').eq('month', currentMonthStr).single(),
          supabase.from('spending_categories').select('budget_amount'),
          supabase
            .from('transactions')
            .select('amount')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate),
        ]);

        const config = configResult.data || { monthly_income: 0, monthly_savings_target: 0 };
        const activeIncome = incomeResult.data && incomeResult.data.net_pay
          ? Number(incomeResult.data.net_pay)
          : Number(config.monthly_income);

        const discretionaryAllowance = activeIncome - Number(config.monthly_savings_target);

        const totalBudget = (categoriesResult.data || []).reduce(
          (sum, c) => sum + (Number(c.budget_amount) || 0),
          0
        );

        const totalSpent = (transactionsResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);

        const surplusAmount = Math.round((discretionaryAllowance - totalSpent) * 100) / 100;

        rows.push({
          id: 'live-projection',
          month: currentMonthStr,
          total_budget: totalBudget,
          total_spent: totalSpent,
          surplus_amount: surplusAmount,
          discretionary_allowance: discretionaryAllowance,
          manual_adjustments: 0,
        } as BudgetSurplus);
      }

      return { monthlyBreakdown: rows, totalSurplus: rows.reduce((sum, r) => sum + Number(r.surplus_amount), 0) };
    },
  });

  return {
    monthlyBreakdown: query.data?.monthlyBreakdown || [],
    totalSurplus: query.data?.totalSurplus || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export function useSurplusConfig() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.surplusConfig,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surplus_config')
        .select('*')
        .eq('is_singleton', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SurplusConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (input: { monthly_income: number; monthly_savings_target: number; initial_balance: number }) => {
      const { data, error } = await supabase
        .from('surplus_config')
        .upsert(
          { is_singleton: true, ...input },
          { onConflict: 'is_singleton' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.surplusConfig });
      qc.invalidateQueries({ queryKey: queryKeys.budgetSurplus });
    },
  });

  return {
    config: query.data || null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    updateConfig: (monthly_income: number, monthly_savings_target: number, initial_balance: number) =>
      updateConfig.mutateAsync({ monthly_income, monthly_savings_target, initial_balance }),
  };
}

export async function updateSurplusManualAdjustment(id: string, manual_adjustments: number, adjustment_description?: string) {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('budget_surplus')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Surplus record not found');

  const baseSurplus = Number(existing.discretionary_allowance) - Number(existing.total_spent);
  const newSurplusAmount = Math.round((baseSurplus + manual_adjustments) * 100) / 100;

  const { data, error } = await supabase
    .from('budget_surplus')
    .update({
      manual_adjustments,
      surplus_amount: newSurplusAmount,
      adjustment_description: adjustment_description ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useAddTransaction() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (t: CreateTransaction) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(t)
        .select('*, category:spending_categories(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateSpending(qc),
  });
}

export function useRecurringTransactions() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.recurringTransactions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, category:spending_categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RecurringTransaction[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.recurringTransactions });

  const createRecurringTransaction = useMutation({
    mutationFn: async (transaction: CreateRecurringTransaction) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert(transaction)
        .select('*, category:spending_categories(*)')
        .single();
      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: invalidate,
  });

  const updateRecurringTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateRecurringTransaction> & { is_active?: boolean } }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select('*, category:spending_categories(*)')
        .single();
      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: invalidate,
  });

  const deleteRecurringTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    recurringTransactions: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createRecurringTransaction: (t: CreateRecurringTransaction) => createRecurringTransaction.mutateAsync(t),
    updateRecurringTransaction: (id: string, u: Partial<CreateRecurringTransaction> & { is_active?: boolean }) =>
      updateRecurringTransaction.mutateAsync({ id, updates: u }),
    deleteRecurringTransaction: (id: string) => deleteRecurringTransaction.mutateAsync(id),
  };
}
