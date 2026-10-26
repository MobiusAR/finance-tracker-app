'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useSpendingCategories, useAddTransaction } from '@/hooks/useTransactions';
import { CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';

export function QuickAddExpense() {
  const [open, setOpen] = useState(false);
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
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg bars:bottom-[calc(var(--mobile-nav-h)+var(--sab)+1rem)] bars:right-[max(1.5rem,var(--sar))] rail:bottom-auto rail:top-[calc(var(--rail-top)+0.5rem)] rail:right-[calc((var(--rail-col)-2.75rem)/2)] rail:h-11 rail:w-11 rail:z-[60] rail:shadow-none rail:ring-1 rail:ring-black/5 dark:rail:ring-white/15"
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
