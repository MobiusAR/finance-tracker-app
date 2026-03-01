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
import { BudgetSurplus } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface SurplusAdjustmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (id: string, manual_adjustments: number) => Promise<void>;
    surplusList: BudgetSurplus[];
}

export function SurplusAdjustmentForm({
    open,
    onOpenChange,
    onSubmit,
    surplusList,
}: SurplusAdjustmentFormProps) {
    const [selectedSurplusId, setSelectedSurplusId] = useState('');
    const [adjustmentValue, setAdjustmentValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (surplusList.length > 0) {
                // Default to the most recent month
                const latest = surplusList[surplusList.length - 1];
                setSelectedSurplusId(latest.id);
                setAdjustmentValue(latest.manual_adjustments?.toString() || '0');
            } else {
                setSelectedSurplusId('');
                setAdjustmentValue('0');
            }
        }
    }, [open, surplusList]);

    const handleSelectChange = (id: string) => {
        setSelectedSurplusId(id);
        const selected = surplusList.find(s => s.id === id);
        if (selected) {
            setAdjustmentValue(selected.manual_adjustments?.toString() || '0');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSurplusId) {
            toast.error('No surplus month selected.');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(selectedSurplusId, parseFloat(adjustmentValue) || 0);
            toast.success('Surplus adjustment saved!');
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update adjustment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manual Surplus Adjustment</DialogTitle>
                    <DialogDescription>
                        Add or subtract from a specific month&apos;s surplus. Use negative numbers for expenses like taxes, or positive numbers to add extra surplus.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">

                        <div className="grid gap-2">
                            <Label htmlFor="surplusMonth">Month</Label>
                            <select
                                id="surplusMonth"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedSurplusId}
                                onChange={(e) => handleSelectChange(e.target.value)}
                            >
                                {surplusList.length === 0 && <option value="" disabled>No surplus records found</option>}
                                {surplusList.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {format(parseISO(s.month), 'MMMM yyyy')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="adjustmentValue">Adjustment Amount ($)</Label>
                            <Input
                                id="adjustmentValue"
                                type="number"
                                step="0.01"
                                value={adjustmentValue}
                                onChange={(e) => setAdjustmentValue(e.target.value)}
                                placeholder="e.g. -500 or 1000"
                            />
                        </div>

                        {selectedSurplusId && surplusList.find(s => s.id === selectedSurplusId) && (
                            <div className="bg-muted p-3 rounded-md mt-2 space-y-2">
                                <div className="text-sm flex justify-between">
                                    <span className="text-muted-foreground">Original Surplus:</span>
                                    <span>
                                        ${(surplusList.find(s => s.id === selectedSurplusId)!.surplus_amount - surplusList.find(s => s.id === selectedSurplusId)!.manual_adjustments).toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-sm flex justify-between font-semibold border-t pt-2 border-border">
                                    <span>New Surplus Amount:</span>
                                    <span className={surplusList.find(s => s.id === selectedSurplusId)!.surplus_amount - surplusList.find(s => s.id === selectedSurplusId)!.manual_adjustments + (parseFloat(adjustmentValue) || 0) >= 0 ? "text-sage" : "text-destructive"}>
                                        ${(surplusList.find(s => s.id === selectedSurplusId)!.surplus_amount - surplusList.find(s => s.id === selectedSurplusId)!.manual_adjustments + (parseFloat(adjustmentValue) || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                    </div>
                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Saving...' : 'Apply Adjustment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
