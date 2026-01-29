'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Asset,
  AssetCategory,
  AssetSource,
  CreateAsset,
  CreateAssetSource,
  UpdateAsset,
  NetWorthBreakdown,
  SourceBreakdown,
} from '@/lib/supabase/types';

export function useAssetCategories() {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('display_order');

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

  return { categories, loading, error, refetch: fetchCategories };
}

export function useAssetSources(categoryId?: string) {
  const [sources, setSources] = useState<AssetSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from('asset_sources')
        .select('*, category:asset_categories(*)');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const createSource = async (source: CreateAssetSource) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('asset_sources')
      .insert(source)
      .select()
      .single();

    if (error) throw error;
    await fetchSources();
    return data;
  };

  const deleteSource = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('asset_sources').delete().eq('id', id);
    if (error) throw error;
    await fetchSources();
  };

  return { sources, loading, error, refetch: fetchSources, createSource, deleteSource };
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assets')
        .select('*, source:asset_sources(*), category:asset_categories(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (asset: CreateAsset) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select('*, source:asset_sources(*), category:asset_categories(*)')
      .single();

    if (error) throw error;
    await fetchAssets();
    return data;
  };

  const updateAsset = async (id: string, updates: UpdateAsset) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select('*, source:asset_sources(*), category:asset_categories(*)')
      .single();

    if (error) throw error;
    await fetchAssets();
    return data;
  };

  const deleteAsset = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
    await fetchAssets();
  };

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}

export function useNetWorthBreakdown() {
  const [breakdown, setBreakdown] = useState<NetWorthBreakdown[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, SourceBreakdown[]>>({});
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryColors: Record<string, string> = {
    investment: '#22c55e',
    cash: '#3b82f6',
    property: '#f97316',
    liability: '#ef4444',
  };

  const fetchBreakdown = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all assets with their categories and sources
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*, source:asset_sources(*), category:asset_categories(*)');

      if (error) throw error;

      // Calculate breakdown by category
      const categoryTotals: Record<string, { value: number; type: string }> = {};
      const sourceTotals: Record<string, SourceBreakdown[]> = {};

      (assets || []).forEach((asset) => {
        const category = asset.category;
        if (!category) return;

        const categoryName = category.name;
        const categoryType = category.type;

        // Category totals
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { value: 0, type: categoryType };
        }
        categoryTotals[categoryName].value += Number(asset.current_value);

        // Source breakdown within category
        if (!sourceTotals[categoryName]) {
          sourceTotals[categoryName] = [];
        }

        const sourceName = asset.source?.name || 'Unknown';
        const existingSource = sourceTotals[categoryName].find(
          (s) => s.source === sourceName
        );

        if (existingSource) {
          existingSource.value += Number(asset.current_value);
          existingSource.assets.push(asset);
        } else {
          sourceTotals[categoryName].push({
            source: sourceName,
            value: Number(asset.current_value),
            assets: [asset],
          });
        }
      });

      // Convert to array format
      const breakdownArray: NetWorthBreakdown[] = Object.entries(categoryTotals).map(
        ([category, { value, type }]) => ({
          category,
          type: type as NetWorthBreakdown['type'],
          value,
          color: categoryColors[type] || '#6b7280',
        })
      );

      // Calculate totals
      let assetsTotal = 0;
      let liabilitiesTotal = 0;

      breakdownArray.forEach(({ type, value }) => {
        if (type === 'liability') {
          liabilitiesTotal += value;
        } else {
          assetsTotal += value;
        }
      });

      setBreakdown(breakdownArray);
      setSourceBreakdown(sourceTotals);
      setTotalAssets(assetsTotal);
      setTotalLiabilities(liabilitiesTotal);
      setTotalNetWorth(assetsTotal - liabilitiesTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return {
    breakdown,
    sourceBreakdown,
    totalNetWorth,
    totalAssets,
    totalLiabilities,
    loading,
    error,
    refetch: fetchBreakdown,
  };
}
