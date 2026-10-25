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
        className="fixed bottom-[calc(var(--mobile-nav-h)+var(--sab)+1rem)] right-[max(1rem,var(--sar))] z-50 h-14 w-14 rounded-full shadow-lg fold:bottom-[calc(var(--sab)+1.5rem)] fold:right-[max(1.5rem,var(--sar))] lg:bottom-8 lg:right-8"
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
