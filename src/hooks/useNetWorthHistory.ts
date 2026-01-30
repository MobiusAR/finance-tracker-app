'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, endOfMonth, startOfMonth } from 'date-fns';

export interface NetWorthHistoryEntry {
  id: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  snapshot_date: string;
  created_at: string;
}

export function useNetWorthHistory() {
  const [history, setHistory] = useState<NetWorthHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .order('snapshot_date', { ascending: true });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const takeSnapshot = async () => {
    const supabase = createClient();
    
    // Get current date (end of current month for the snapshot)
    const today = new Date();
    const snapshotDate = format(today, 'yyyy-MM-dd');
    
    // Check if snapshot for this month already exists
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
    
    const { data: existing } = await supabase
      .from('net_worth_history')
      .select('id')
      .gte('snapshot_date', monthStart)
      .lte('snapshot_date', monthEnd)
      .single();

    // Fetch all current assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*, category:asset_categories(type)');

    if (assetsError) throw assetsError;

    // Calculate totals
    let totalAssets = 0;
    let totalLiabilities = 0;

    (assets || []).forEach((asset) => {
      const value = Number(asset.current_value);
      if (asset.category?.type === 'liability') {
        totalLiabilities += value;
      } else {
        totalAssets += value;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    if (existing) {
      // Update existing snapshot for this month
      const { error } = await supabase
        .from('net_worth_history')
        .update({
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          snapshot_date: snapshotDate,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new snapshot
      const { data: historyEntry, error: historyError } = await supabase
        .from('net_worth_history')
        .insert({
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          snapshot_date: snapshotDate,
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Save individual asset snapshots
      const assetSnapshots = (assets || []).map((asset) => ({
        history_id: historyEntry.id,
        asset_id: asset.id,
        value: Number(asset.current_value),
      }));

      if (assetSnapshots.length > 0) {
        const { error: snapshotsError } = await supabase
          .from('asset_snapshots')
          .insert(assetSnapshots);

        if (snapshotsError) throw snapshotsError;
      }
    }

    await fetchHistory();
  };

  const deleteSnapshot = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('net_worth_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchHistory();
  };

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    takeSnapshot,
    deleteSnapshot,
  };
}
