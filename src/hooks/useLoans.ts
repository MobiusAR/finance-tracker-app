'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    PersonalLoan,
    CreatePersonalLoan,
    UpdatePersonalLoan,
} from '@/lib/supabase/types';

export function useLoans() {
    const [loans, setLoans] = useState<PersonalLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLoans = useCallback(async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase
                .from('personal_loans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch personal loans');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const createLoan = async (loan: CreatePersonalLoan) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('personal_loans')
            .insert(loan)
            .select()
            .single();

        if (error) throw error;
        await fetchLoans();
        return data;
    };

    const updateLoan = async (id: string, updates: UpdatePersonalLoan) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('personal_loans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        await fetchLoans();
        return data;
    };

    const deleteLoan = async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('personal_loans').delete().eq('id', id);
        if (error) throw error;
        await fetchLoans();
    };

    return {
        loans,
        loading,
        error,
        refetch: fetchLoans,
        createLoan,
        updateLoan,
        deleteLoan,
    };
}
