'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PersonalLoan, CreatePersonalLoan, UpdatePersonalLoan } from '@/lib/supabase/types';

export function useLoans() {
    const qc = useQueryClient();
    const supabase = createClient();

    const query = useQuery({
        queryKey: ['personal-loans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('personal_loans')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as PersonalLoan[];
        },
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['personal-loans'] });

    const createLoan = useMutation({
        mutationFn: async (loan: CreatePersonalLoan) => {
            const { data, error } = await supabase.from('personal_loans').insert(loan).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: invalidate,
    });

    const updateLoan = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdatePersonalLoan }) => {
            const { data, error } = await supabase.from('personal_loans').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: invalidate,
    });

    const deleteLoan = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('personal_loans').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: invalidate,
    });

    return {
        loans: query.data || [],
        loading: query.isLoading,
        error: query.error ? (query.error as Error).message : null,
        refetch: query.refetch,
        createLoan: (l: CreatePersonalLoan) => createLoan.mutateAsync(l),
        updateLoan: (id: string, u: UpdatePersonalLoan) => updateLoan.mutateAsync({ id, updates: u }),
        deleteLoan: (id: string) => deleteLoan.mutateAsync(id),
    };
}
