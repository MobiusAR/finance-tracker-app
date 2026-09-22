'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Insight } from '@/lib/supabase/types';

export function useLatestInsight() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ['latest-insight'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Insight | null;
    },
  });

  return {
    insight: query.data || null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
