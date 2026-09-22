'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Asset,
  AssetCategory,
  AssetSource,
  CreateAsset,
  CreateAssetCategory,
  CreateAssetSource,
  UpdateAsset,
  NetWorthBreakdown,
  SourceBreakdown,
} from '@/lib/supabase/types';
import { ASSET_TYPE_COLORS, DEFAULT_COLOR } from '@/lib/colors';

export const assetQueryKeys = {
  categories: ['asset-categories'] as const,
  sources: (categoryId?: string) => ['asset-sources', categoryId || 'all'] as const,
  assets: ['assets'] as const,
  breakdown: ['net-worth-breakdown'] as const,
};

function invalidateAssets(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['assets'] });
  qc.invalidateQueries({ queryKey: ['asset-categories'] });
  qc.invalidateQueries({ queryKey: ['asset-sources'] });
  qc.invalidateQueries({ queryKey: ['net-worth-breakdown'] });
}

export function useAssetCategories() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: assetQueryKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase.from('asset_categories').select('*').order('display_order');
      if (error) throw error;
      return data as AssetCategory[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: assetQueryKeys.categories });

  const createCategory = useMutation({
    mutationFn: async (category: CreateAssetCategory) => {
      const { data, error } = await supabase.from('asset_categories').insert(category).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['net-worth-breakdown'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAssetCategory> }) => {
      const { data, error } = await supabase.from('asset_categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['net-worth-breakdown'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('asset_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAssets.bind(null, qc),
  });

  return {
    categories: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createCategory: (c: CreateAssetCategory) => createCategory.mutateAsync(c),
    updateCategory: (id: string, u: Partial<CreateAssetCategory>) => updateCategory.mutateAsync({ id, updates: u }),
    deleteCategory: (id: string) => deleteCategory.mutateAsync(id),
  };
}

export function useAssetSources(categoryId?: string) {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: assetQueryKeys.sources(categoryId),
    queryFn: async () => {
      let q = supabase.from('asset_sources').select('*, category:asset_categories(*)');
      if (categoryId) q = q.eq('category_id', categoryId);
      const { data, error } = await q.order('name');
      if (error) throw error;
      return data as AssetSource[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['asset-sources'] });

  const createSource = useMutation({
    mutationFn: async (source: CreateAssetSource) => {
      const { data, error } = await supabase.from('asset_sources').insert(source).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateSource = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAssetSource> }) => {
      const { data, error } = await supabase.from('asset_sources').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('asset_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['net-worth-breakdown'] });
    },
  });

  return {
    sources: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createSource: (s: CreateAssetSource) => createSource.mutateAsync(s),
    updateSource: (id: string, u: Partial<CreateAssetSource>) => updateSource.mutateAsync({ id, updates: u }),
    deleteSource: (id: string) => deleteSource.mutateAsync(id),
  };
}

export function useAssets() {
  const qc = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: assetQueryKeys.assets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*, source:asset_sources(*), category:asset_categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['assets'] });
    qc.invalidateQueries({ queryKey: ['net-worth-breakdown'] });
  };

  const createAsset = useMutation({
    mutationFn: async (asset: CreateAsset) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select('*, source:asset_sources(*), category:asset_categories(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateAsset }) => {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select('*, source:asset_sources(*), category:asset_categories(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    assets: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    createAsset: (a: CreateAsset) => createAsset.mutateAsync(a),
    updateAsset: (id: string, u: UpdateAsset) => updateAsset.mutateAsync({ id, updates: u }),
    deleteAsset: (id: string) => deleteAsset.mutateAsync(id),
  };
}

export function useNetWorthBreakdown() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: assetQueryKeys.breakdown,
    queryFn: async () => {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*, source:asset_sources(*), category:asset_categories(*)');

      if (error) throw error;

      const categoryTotals: Record<string, { value: number; type: string }> = {};
      const sourceTotals: Record<string, SourceBreakdown[]> = {};

      (assets || []).forEach((asset) => {
        const category = asset.category;
        if (!category) return;

        const categoryName = category.name;
        const categoryType = category.type;

        const sgdValue = asset.value_sgd != null ? Number(asset.value_sgd) : Number(asset.current_value);

        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { value: 0, type: categoryType };
        }
        categoryTotals[categoryName].value += sgdValue;

        if (!sourceTotals[categoryName]) sourceTotals[categoryName] = [];

        const sourceName = asset.source?.name || 'Unknown';
        const existingSource = sourceTotals[categoryName].find((s) => s.source === sourceName);

        if (existingSource) {
          existingSource.value += sgdValue;
          existingSource.assets.push(asset);
        } else {
          sourceTotals[categoryName].push({ source: sourceName, value: sgdValue, assets: [asset] });
        }
      });

      const breakdownArray: NetWorthBreakdown[] = Object.entries(categoryTotals).map(
        ([category, { value, type }]) => ({
          category,
          type: type as NetWorthBreakdown['type'],
          value,
          color: ASSET_TYPE_COLORS[type] || DEFAULT_COLOR,
        })
      );

      let assetsTotal = 0;
      let cpfTotal = 0;
      let liabilitiesTotal = 0;

      breakdownArray.forEach(({ type, value }) => {
        if (type === 'liability') liabilitiesTotal += value;
        else if (type === 'cpf') cpfTotal += value;
        else assetsTotal += value;
      });

      let gainTotal = 0;
      (assets || []).forEach((asset) => {
        if (asset.cost_basis != null) {
          const sgd = asset.value_sgd != null ? Number(asset.value_sgd) : Number(asset.current_value);
          gainTotal += sgd - Number(asset.cost_basis);
        }
      });

      return {
        breakdown: breakdownArray,
        sourceBreakdown: sourceTotals,
        totalNetWorth: assetsTotal + cpfTotal - liabilitiesTotal,
        totalAssets: assetsTotal,
        totalCpf: cpfTotal,
        totalLiabilities: liabilitiesTotal,
        totalGain: gainTotal,
      };
    },
  });

  return {
    breakdown: query.data?.breakdown || [],
    sourceBreakdown: query.data?.sourceBreakdown || {},
    totalNetWorth: query.data?.totalNetWorth || 0,
    totalAssets: query.data?.totalAssets || 0,
    totalCpf: query.data?.totalCpf || 0,
    totalLiabilities: query.data?.totalLiabilities || 0,
    totalGain: query.data?.totalGain || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
