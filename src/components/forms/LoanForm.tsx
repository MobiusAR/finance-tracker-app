'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CreatePersonalLoan, UpdatePersonalLoan, PersonalLoan } from '@/lib/supabase/types';

interface LoanFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreatePersonalLoan | UpdatePersonalLoan) => Promise<void>;
    loan?: PersonalLoan;
}

export function LoanForm({ open, onOpenChange, onSubmit, loan }: LoanFormProps) {
    const [loading, setLoading] = useState(false);
    const [borrowerName, setBorrowerName] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('SGD');
    const [status, setStatus] = useState<'active' | 'repaid' | 'defaulted'>('active');
    const [dateLent, setDateLent] = useState(() => new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (loan && open) {
            setBorrowerName(loan.borrower_name);
            setAmount(loan.amount.toString());
            setCurrency(loan.currency || 'SGD');
            setStatus(loan.status || 'active');
            setDateLent(loan.date_lent);
            setDueDate(loan.due_date || '');
            setReason(loan.reason || '');
        } else {
            resetForm();
        }
    }, [loan, open]);

    const resetForm = () => {
        setBorrowerName('');
        setAmount('');
        setCurrency('SGD');
        setStatus('active');
        setDateLent(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setReason('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!borrowerName || !amount || !dateLent) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                borrower_name: borrowerName,
                amount: Number(amount),
                currency,
                status,
                date_lent: dateLent,
                due_date: dueDate || null,
                reason: reason || null,
            });
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Error submitting loan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{loan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="borrowerName">Borrower Name *</Label>
                        <Input
                            id="borrowerName"
                            value={borrowerName}
                            onChange={(e) => setBorrowerName(e.target.value)}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                                id="currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                placeholder="SGD"
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(value: 'active' | 'repaid' | 'defaulted') => setStatus(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active (Outstanding)</SelectItem>
                                <SelectItem value="repaid">Repaid</SelectItem>
                                <SelectItem value="defaulted">Defaulted (Written Off)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateLent">Date Lent *</Label>
                            <Input
                                id="dateLent"
                                type="date"
                                value={dateLent}
                                onChange={(e) => setDateLent(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date (Optional)</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason / Notes (Optional)</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Dinner split, travel booking..."
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : loan ? 'Update Loan' : 'Add Loan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
