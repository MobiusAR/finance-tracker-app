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
import { SurplusConfig } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface SurplusConfigFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (monthly_income: number, monthly_savings_target: number, initial_balance: number) => Promise<void>;
    config?: SurplusConfig | null;
}

export function SurplusConfigForm({
    open,
    onOpenChange,
    onSubmit,
    config,
}: SurplusConfigFormProps) {
    const [income, setIncome] = useState('');
    const [savingsTarget, setSavingsTarget] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (config) {
            setIncome(config.monthly_income?.toString() || '');
            setSavingsTarget(config.monthly_savings_target?.toString() || '');
            setInitialBalance(config.initial_balance?.toString() || '0');
        } else {
            resetForm();
        }
    }, [config, open]);

    const resetForm = () => {
        setIncome('');
        setSavingsTarget('');
        setInitialBalance('0');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!income || !savingsTarget) {
            toast.error('Please enter both income and savings target.');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(parseFloat(income), parseFloat(savingsTarget), parseFloat(initialBalance) || 0);
            toast.success('Surplus global settings updated!');
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Global Surplus Configuration</DialogTitle>
                    <DialogDescription>
                        Set your expected monthly income and savings target to define your baseline discretionary allowance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="income">Monthly Income</Label>
                            <Input
                                id="income"
                                type="number"
                                step="0.01"
                                min="0"
                                value={income}
                                onChange={(e) => setIncome(e.target.value)}
                                placeholder="e.g. 5400"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="savingsTarget">Monthly Savings Target</Label>
                            <Input
                                id="savingsTarget"
                                type="number"
                                step="0.01"
                                min="0"
                                value={savingsTarget}
                                onChange={(e) => setSavingsTarget(e.target.value)}
                                placeholder="e.g. 3000"
                            />
                        </div>

                        <div className="grid gap-2 pt-2 border-t">
                            <Label htmlFor="initialBalance">Adjust Current Surplus Value ($)</Label>
                            <Input
                                id="initialBalance"
                                type="number"
                                step="0.01"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(e.target.value)}
                                placeholder="e.g. 10000 or -2000"
                            />
                            <p className="text-xs text-muted-foreground mt-1">This sets a master balance that your monthly surpluses configure against. You can use this to sync historic savings or deduct one-off amounts like taxes.</p>
                        </div>

                        <div className="bg-muted p-3 rounded-md mt-2">
                            <div className="text-sm flex justify-between">
                                <span className="text-muted-foreground">Discretionary Allowance:</span>
                                <span className="font-semibold text-primary">
                                    ${Math.max(0, (parseFloat(income) || 0) - (parseFloat(savingsTarget) || 0)).toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">This amount covers your categorized budgets and extra spending.</p>
                        </div>

                    </div>
                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
