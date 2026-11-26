'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useSpendingCategories, useAddTransaction } from '@/hooks/useTransactions';
import { CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';

/** Fired by the Duo rail's Add button, which replaces the FAB in rail layouts. */
export const QUICK_ADD_EVENT = 'quick-add:open';

export function QuickAddExpense() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(QUICK_ADD_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_ADD_EVENT, onOpen);
  }, []);
  const { categories } = useSpendingCategories();
  const addTransaction = useAddTransaction();

  const handleSubmit = async (data: CreateTransaction | UpdateTransaction) => {
    await addTransaction.mutateAsync(data as CreateTransaction);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon-lg"
        aria-label="Add expense"
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg bars:bottom-[calc(var(--mobile-nav-h)+var(--sab)+1rem)] bars:right-[max(1.5rem,var(--sar))] rail:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TransactionForm
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </>
  );
}
