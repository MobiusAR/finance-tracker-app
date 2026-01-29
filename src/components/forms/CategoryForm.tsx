'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SpendingCategory, CreateSpendingCategory } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSpendingCategory) => Promise<void>;
  category?: SpendingCategory | null;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export function CategoryForm({
  open,
  onOpenChange,
  onSubmit,
  category,
}: CategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setBudgetAmount(category.budget_amount?.toString() || '');
    } else {
      resetForm();
    }
  }, [category, open]);

  const resetForm = () => {
    setName('');
    setColor('#3b82f6');
    setBudgetAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name,
        color,
        budget_amount: budgetAmount ? parseFloat(budgetAmount) : undefined,
      });
      toast.success(isEditing ? 'Category updated' : 'Category created');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details.'
              : 'Create a new spending category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Food & Dining, Transport"
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === presetColor
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setColor(presetColor)}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                  Custom:
                </Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-24 font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Monthly Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Set a monthly budget limit"
              />
              <p className="text-xs text-muted-foreground">
                Set a budget to track spending against a target
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
