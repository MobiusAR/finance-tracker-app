'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useSpendingCategories, insertTransaction } from '@/hooks/useTransactions';
import { CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';
import { notifyTransactionsChanged } from '@/lib/events';

export function QuickAddExpense() {
  const [open, setOpen] = useState(false);
  const { categories } = useSpendingCategories();

  const handleSubmit = async (data: CreateTransaction | UpdateTransaction) => {
    await insertTransaction(data as CreateTransaction);
    notifyTransactionsChanged();
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon-lg"
        aria-label="Add expense"
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
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
