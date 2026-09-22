'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { UserSettings, IncomeRecord } from '@/lib/supabase/types';

export function useUserSettings() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_settings').select('*').limit(1).single();

      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert({})
          .select()
          .single();
        if (insertError) throw insertError;
        return newData as UserSettings;
      }
      if (error) throw error;
      return data as UserSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      const settings = query.data;
      if (!settings?.id) throw new Error('No settings record found to update');

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-settings'] }),
  });

  return {
    settings: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateSettings: (u: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>) => updateSettings.mutateAsync(u),
  };
}

export function useIncomeRecords(year?: number) {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['income-records', year ?? 'all'],
    queryFn: async () => {
      const startOfYear = year ? `${year}-01-01` : '1970-01-01';
      const endOfYear = year ? `${year}-12-31` : '2999-12-31';

      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .gte('month', startOfYear)
        .lte('month', endOfYear)
        .order('month', { ascending: false });

      if (error) throw error;
      return data as IncomeRecord[];
    },
  });

  const saveRecord = useMutation({
    mutationFn: async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('income_records')
        .upsert(record, { onConflict: 'month' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-records'] }),
  });

  return {
    records: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    saveRecord: (r: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>) => saveRecord.mutateAsync(r),
  };
}
