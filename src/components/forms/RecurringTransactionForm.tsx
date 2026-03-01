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
import { RecurringTransaction, CreateRecurringTransaction, SpendingCategory } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface RecurringTransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateRecurringTransaction) => Promise<void>;
    transaction?: RecurringTransaction | null;
    categories: SpendingCategory[];
}

export function RecurringTransactionForm({
    open,
    onOpenChange,
    onSubmit,
    transaction,
    categories,
}: RecurringTransactionFormProps) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('uncategorized');
    const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [dayOfWeek, setDayOfWeek] = useState('1'); // 1 = Monday, 7 = Sunday
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description || '');
            setAmount(transaction.amount.toString());
            setCategoryId(transaction.category_id || 'uncategorized');
            setFrequency(transaction.frequency || 'monthly');
            setDayOfMonth(transaction.day_of_month?.toString() || '1');
            setDayOfWeek(transaction.day_of_week?.toString() || '1');
        } else {
            resetForm();
        }
    }, [transaction, open]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCategoryId('uncategorized');
        setFrequency('monthly');
        setDayOfMonth('1');
        setDayOfWeek('1');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || isNaN(Number(amount))) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const data: CreateRecurringTransaction = {
                amount: Number(amount),
                description: description || undefined,
                category_id: categoryId === 'uncategorized' ? undefined : categoryId,
                frequency,
                day_of_month: frequency === 'monthly' ? Number(dayOfMonth) : undefined,
                day_of_week: frequency === 'weekly' ? Number(dayOfWeek) : undefined,
                start_date: new Date().toISOString().split('T')[0], // Defaults to today for new rules
            };

            await onSubmit(data);
            toast.success(transaction ? 'Subscription updated' : 'Subscription created');
            onOpenChange(false);
            resetForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{transaction ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
                    <DialogDescription>
                        Automate recurring payments like rent, Netflix, or gym memberships.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Subscription Name</Label>
                            <Input
                                id="description"
                                placeholder="e.g. Netflix, Gym, Rent"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (SGD)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uncategorized">None / Uncategorized</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    {category.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={(val: 'monthly' | 'weekly' | 'yearly') => setFrequency(val)}>
                                <SelectTrigger id="frequency">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {frequency === 'monthly' && (
                            <div className="grid gap-2">
                                <Label htmlFor="dayOfMonth">Day of the Month</Label>
                                <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                                    <SelectTrigger id="dayOfMonth">
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                {day}{getOrdinalIndicator(day)}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="29">29th (Or last day)</SelectItem>
                                        <SelectItem value="30">30th (Or last day)</SelectItem>
                                        <SelectItem value="31">31st (Or last day)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">Transactions will be generated automatically on this day.</p>
                            </div>
                        )}

                        {frequency === 'weekly' && (
                            <div className="grid gap-2">
                                <Label htmlFor="dayOfWeek">Day of the Week</Label>
                                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                                    <SelectTrigger id="dayOfWeek">
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Monday</SelectItem>
                                        <SelectItem value="2">Tuesday</SelectItem>
                                        <SelectItem value="3">Wednesday</SelectItem>
                                        <SelectItem value="4">Thursday</SelectItem>
                                        <SelectItem value="5">Friday</SelectItem>
                                        <SelectItem value="6">Saturday</SelectItem>
                                        <SelectItem value="7">Sunday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {frequency === 'yearly' && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">Yearly subscriptions will be generated on the exact Month &amp; Day of the &quot;Start Date&quot;. The start date is set to Today.</p>
                        )}

                    </div>
                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Saving...' : transaction ? 'Save Changes' : 'Add Subscription'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Helper for suffixes
function getOrdinalIndicator(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
