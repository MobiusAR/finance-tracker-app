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
import { Asset, AssetCategory, AssetSource, CreateAsset, UpdateAsset } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AssetCategory[];
  sources: AssetSource[];
  onSubmit: (data: CreateAsset | UpdateAsset) => Promise<void>;
  asset?: Asset | null;
  onCreateSource?: () => void;
}

export function AssetForm({
  open,
  onOpenChange,
  categories,
  sources,
  onSubmit,
  asset,
  onCreateSource,
}: AssetFormProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [notes, setNotes] = useState('');
  const [isAutoTracked, setIsAutoTracked] = useState(false);
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!asset;

  // Filter sources based on selected category
  const filteredSources = sources.filter(
    (source) => !categoryId || source.category_id === categoryId
  );

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setCategoryId(asset.category_id);
      setSourceId(asset.source_id);
      setCurrentValue(asset.current_value.toString());
      setCurrency(asset.currency);
      setNotes(asset.notes || '');
      setIsAutoTracked(asset.is_auto_tracked || false);
      setTickerSymbol(asset.ticker_symbol || '');
      setShares(asset.shares?.toString() || '');
    } else {
      resetForm();
    }
  }, [asset, open]);

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setSourceId('');
    setCurrentValue('');
    setCurrency('SGD');
    setNotes('');
    setIsAutoTracked(false);
    setTickerSymbol('');
    setShares('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !categoryId || !sourceId) {
      toast.error('Please fill in all required basic fields');
      return;
    }

    if (isAutoTracked && (!tickerSymbol || !shares)) {
      toast.error('Please provide a ticker symbol and number of shares for auto-tracked assets');
      return;
    }

    if (!isAutoTracked && !currentValue) {
      toast.error('Please provide a current value');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name,
        category_id: categoryId,
        source_id: sourceId,
        current_value: isAutoTracked ? 0 : parseFloat(currentValue),
        currency: isAutoTracked ? 'USD' : currency,
        notes: notes || undefined,
        is_auto_tracked: isAutoTracked,
        ticker_symbol: isAutoTracked ? tickerSymbol.toUpperCase() : undefined,
        shares: isAutoTracked ? parseFloat(shares) : undefined,
      });
      toast.success(isEditing ? 'Asset updated' : 'Asset created');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the asset details below.'
              : 'Enter the details for your new asset.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AAPL Shares, Emergency Fund"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={(value) => {
                setCategoryId(value);
                setSourceId(''); // Reset source when category changes
              }}>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="source">Source/Platform *</Label>
                {onCreateSource && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCreateSource}
                    className="h-auto p-0 text-xs text-primary"
                  >
                    + Add New Source
                  </Button>
                )}
              </div>
              <Select value={sourceId} onValueChange={setSourceId} disabled={!categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={categoryId ? "Select a source" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="auto-track"
                checked={isAutoTracked}
                onChange={(e) => setIsAutoTracked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="auto-track" className="font-normal cursor-pointer">
                Auto-track value via US Stock Market
              </Label>
            </div>

            {isAutoTracked ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ticker">Ticker Symbol *</Label>
                  <Input
                    id="ticker"
                    value={tickerSymbol}
                    onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shares">Number of Shares *</Label>
                  <Input
                    id="shares"
                    type="number"
                    step="0.0001"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="e.g., 10.5"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="value">Current Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
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
