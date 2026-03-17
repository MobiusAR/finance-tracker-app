import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserSettings, IncomeRecord } from '@/lib/supabase/types';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1)
        .single();
        
      // If no row exists, we insert one on the fly (since we only need 1 row for a single-user app)
      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert({})
          .select()
          .single();
          
        if (insertError) throw insertError;
        setSettings(newData);
      } else if (error) {
        throw error;
      } else {
        setSettings(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch settings'));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (!settings?.id) throw new Error('No settings record found to update');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to update settings');
    }
  };

  return { settings, loading, error, fetchSettings, updateSettings };
}

export function useIncomeRecords() {
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchRecords = useCallback(async (year: number) => {
    try {
      setLoading(true);
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .gte('month', startOfYear)
        .lte('month', endOfYear)
        .order('month', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch income records'));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const saveRecord = async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Upsert based on the month (which is unique)
      const { data, error } = await supabase
        .from('income_records')
        .upsert(record, { onConflict: 'month' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to save income record');
    }
  };

  return { records, loading, error, fetchRecords, saveRecord };
}
