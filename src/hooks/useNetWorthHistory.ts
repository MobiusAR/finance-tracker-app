'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['net-worth-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .order('snapshot_date', { ascending: true });
      if (error) throw error;
      return data as NetWorthHistoryEntry[];
    },
  });

  const takeSnapshot = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const snapshotDate = format(today, 'yyyy-MM-dd');

      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

      const { data: existing } = await supabase
        .from('net_worth_history')
        .select('id')
        .gte('snapshot_date', monthStart)
        .lte('snapshot_date', monthEnd)
        .single();

      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*, category:asset_categories(type)');

      if (assetsError) throw assetsError;

      let totalAssets = 0;
      let totalLiabilities = 0;

      (assets || []).forEach((asset: {
        id: string;
        current_value: number;
        value_sgd: number | null;
        category?: { type: string } | { type: string }[] | null;
      }) => {
        const category = Array.isArray(asset.category) ? asset.category[0] : asset.category;
        const value = asset.value_sgd != null ? Number(asset.value_sgd) : Number(asset.current_value);
        if (category?.type === 'liability') totalLiabilities += value;
        else totalAssets += value;
      });

      const netWorth = totalAssets - totalLiabilities;

      if (existing) {
        const { error } = await supabase
          .from('net_worth_history')
          .update({ total_assets: totalAssets, total_liabilities: totalLiabilities, net_worth: netWorth, snapshot_date: snapshotDate })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data: historyEntry, error: historyError } = await supabase
          .from('net_worth_history')
          .insert({ total_assets: totalAssets, total_liabilities: totalLiabilities, net_worth: netWorth, snapshot_date: snapshotDate })
          .select()
          .single();
        if (historyError) throw historyError;

        const assetSnapshots = (assets || []).map((asset: { id: string; current_value: number; value_sgd: number | null }) => ({
          history_id: historyEntry.id,
          asset_id: asset.id,
          value: asset.value_sgd != null ? Number(asset.value_sgd) : Number(asset.current_value),
        }));

        if (assetSnapshots.length > 0) {
          const { error: snapshotsError } = await supabase.from('asset_snapshots').insert(assetSnapshots);
          if (snapshotsError) throw snapshotsError;
        }
      }

      return { snapshot_date: snapshotDate };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['net-worth-history'] }),
  });

  const deleteSnapshot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('net_worth_history').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['net-worth-history'] }),
  });

  return {
    history: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    takeSnapshot: () => takeSnapshot.mutateAsync(),
    deleteSnapshot: (id: string) => deleteSnapshot.mutateAsync(id),
  };
}
