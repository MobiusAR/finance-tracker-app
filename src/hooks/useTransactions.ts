'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useSpendingCategories() {
  const [categories, setCategories] = useState<SpendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('spending_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (category: CreateSpendingCategory) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('spending_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<CreateSpendingCategory>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('spending_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const deleteCategory = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('spending_categories').delete().eq('id', id);
    if (error) throw error;
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useTransactions(month?: Date) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('transactions')
        .select('*, category:spending_categories(*)')
        .order('transaction_date', { ascending: false });

      if (month) {
        const start = format(startOfMonth(month), 'yyyy-MM-dd');
        const end = format(endOfMonth(month), 'yyyy-MM-dd');
        query = query.gte('transaction_date', start).lte('transaction_date', end);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (transaction: CreateTransaction) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select('*, category:spending_categories(*)')
      .single();

    if (error) throw error;
    await fetchTransactions();
    return data;
  };

  const updateTransaction = async (id: string, updates: UpdateTransaction) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, category:spending_categories(*)')
      .single();

    if (error) throw error;
    await fetchTransactions();
    return data;
  };

  const deleteTransaction = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export function useSpendingSummary(months: number = 1, baseMonth?: Date) {
  const [summary, setSummary] = useState<SpendingSummary[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const anchor = baseMonth || new Date();
      const startDate = format(startOfMonth(subMonths(anchor, months - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(anchor), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:spending_categories(*)')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      // Group by category
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
        .map(([category, { total, count, color }]) => ({
          category,
          color,
          total,
          count,
        }))
        .sort((a, b) => b.total - a.total);

      setSummary(summaryArray);
      setTotalSpending(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [months, baseMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, totalSpending, loading, error, refetch: fetchSummary };
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
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetStatus = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get current month's date range
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch categories and transactions in parallel
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

      // Calculate spent per category
      const spentByCategory: Record<string, number> = {};
      transactions.forEach((t) => {
        if (t.category_id) {
          spentByCategory[t.category_id] = (spentByCategory[t.category_id] || 0) + Number(t.amount);
        }
      });

      // Build budget status for each category
      const status: BudgetStatus[] = categories.map((category) => {
        const spent = spentByCategory[category.id] || 0;
        const budget = category.budget_amount;
        const remaining = budget ? budget - spent : null;
        const percentUsed = budget ? (spent / budget) * 100 : null;
        const isOverBudget = budget ? spent > budget : false;

        return {
          category,
          spent,
          budget,
          remaining,
          percentUsed,
          isOverBudget,
        };
      });

      setBudgetStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgetStatus();
  }, [fetchBudgetStatus]);

  return { budgetStatus, loading, error, refetch: fetchBudgetStatus };
}

export function useBudgetSurplus() {
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<BudgetSurplus[]>([]);
  const [totalSurplus, setTotalSurplus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurplus = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('budget_surplus')
        .select('*')
        .order('month', { ascending: true });

      if (error) throw error;

      const rows = (data || []) as BudgetSurplus[];

      // -- SYNTHESIZE CURRENT MONTH LIVE PROJECTION --
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
        const activeIncome = (incomeResult.data && incomeResult.data.net_pay)
          ? Number(incomeResult.data.net_pay)
          : Number(config.monthly_income);

        const discretionaryAllowance = activeIncome - Number(config.monthly_savings_target);

        const totalBudget = (categoriesResult.data || []).reduce(
          (sum, c) => sum + (Number(c.budget_amount) || 0),
          0
        );

        const totalSpent = (transactionsResult.data || []).reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );

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

      setMonthlyBreakdown(rows);
      setTotalSurplus(
        rows.reduce((sum, r) => sum + Number(r.surplus_amount), 0)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget surplus');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurplus();
  }, [fetchSurplus]);

  return { monthlyBreakdown, totalSurplus, loading, error, refetch: fetchSurplus };
}

export function useSurplusConfig() {
  const [config, setConfig] = useState<SurplusConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('surplus_config')
        .select('*')
        .eq('is_singleton', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignoring 0 row errors
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surplus config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (monthly_income: number, monthly_savings_target: number, initial_balance: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('surplus_config')
      .upsert(
        { is_singleton: true, monthly_income, monthly_savings_target, initial_balance },
        { onConflict: 'is_singleton' }
      )
      .select()
      .single();
    if (error) throw error;
    setConfig(data);
    return data;
  };

  return { config, loading, error, refetch: fetchConfig, updateConfig };
}

export async function updateSurplusManualAdjustment(id: string, manual_adjustments: number, adjustment_description?: string) {
  const supabase = createClient();

  // First, fetch the current row to get discretionary_allowance and total_spent
  const { data: existing, error: fetchError } = await supabase
    .from('budget_surplus')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Surplus record not found');

  // Recalculate surplus_amount: base surplus (without any adjustments) + new adjustment
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

export function useRecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurringTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, category:spending_categories(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurringTransactions((data as RecurringTransaction[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recurring transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const createRecurringTransaction = async (transaction: CreateRecurringTransaction) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(transaction)
      .select('*, category:spending_categories(*)')
      .single();

    if (error) throw error;
    await fetchRecurringTransactions();
    return data as RecurringTransaction;
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<CreateRecurringTransaction> & { is_active?: boolean }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id)
      .select('*, category:spending_categories(*)')
      .single();

    if (error) throw error;
    await fetchRecurringTransactions();
    return data as RecurringTransaction;
  };

  const deleteRecurringTransaction = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (error) throw error;
    await fetchRecurringTransactions();
  };

  return {
    recurringTransactions,
    loading,
    error,
    refetch: fetchRecurringTransactions,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
  };
}
