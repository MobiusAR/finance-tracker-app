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
import { AssetCategory, AssetType, CreateAssetCategory } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface AssetCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAssetCategory) => Promise<void>;
  category?: AssetCategory | null;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash & Savings' },
  { value: 'property', label: 'Property' },
  { value: 'liability', label: 'Liability' },
];

export function AssetCategoryForm({
  open,
  onOpenChange,
  onSubmit,
  category,
}: AssetCategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('investment');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [loading, setLoading] = useState(false);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setDisplayOrder(category.display_order.toString());
    } else {
      resetForm();
    }
  }, [category, open]);

  const resetForm = () => {
    setName('');
    setType('investment');
    setDisplayOrder('0');
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
        type,
        display_order: parseInt(displayOrder) || 0,
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
          <DialogTitle>{isEditing ? 'Edit Asset Category' : 'Add Asset Category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the asset category details.'
              : 'Create a new category for your assets.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cryptocurrency, Bonds"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-type">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Liabilities are subtracted from your net worth
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
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
