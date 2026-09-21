'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Transaction, SpendingCategory, CreateTransaction, UpdateTransaction } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: SpendingCategory[];
  onSubmit: (data: CreateTransaction | UpdateTransaction) => Promise<void>;
  transaction?: Transaction | null;
}

export function TransactionForm({
  open,
  onOpenChange,
  categories,
  onSubmit,
  transaction,
}: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.category_id || '');
      setDescription(transaction.description || '');
      setDate(transaction.transaction_date.slice(0, 10));
    } else {
      resetForm();
    }
  }, [transaction, open]);

  const resetForm = () => {
    setAmount('');
    setCategoryId('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        amount: parseFloat(amount),
        category_id: categoryId || undefined,
        description: description || undefined,
        transaction_date: date,
      });
      toast.success(isEditing ? 'Transaction updated' : 'Transaction added');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the transaction details.'
              : 'Record a new expense or spending.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
