'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Transaction,
  SpendingCategory,
  CreateTransaction,
  UpdateTransaction,
  CreateSpendingCategory,
  SpendingSummary,
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

export function useSpendingSummary(months: number = 1) {
  const [summary, setSummary] = useState<SpendingSummary[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const startDate = format(startOfMonth(subMonths(new Date(), months - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

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
  }, [months]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, totalSpending, loading, error, refetch: fetchSummary };
}
