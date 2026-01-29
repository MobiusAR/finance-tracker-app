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
import { AssetCategory, CreateAssetSource } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface SourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AssetCategory[];
  onSubmit: (data: CreateAssetSource) => Promise<void>;
  defaultCategoryId?: string;
}

export function SourceForm({
  open,
  onOpenChange,
  categories,
  onSubmit,
  defaultCategoryId,
}: SourceFormProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [open, defaultCategoryId]);

  const resetForm = () => {
    setName('');
    setCategoryId(defaultCategoryId || '');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name,
        category_id: categoryId,
        description: description || undefined,
      });
      toast.success('Source created');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>
            Add a new platform or institution (e.g., moomoo, IBKR, DBS).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="source-name">Source Name *</Label>
              <Input
                id="source-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., moomoo, IBKR, DBS"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-description">Description</Label>
              <Input
                id="source-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
