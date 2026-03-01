'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RecurringTransactionForm } from '@/components/forms/RecurringTransactionForm';
import { useSpendingCategories, useRecurringTransactions } from '@/hooks/useTransactions';
import { RecurringTransaction, CreateRecurringTransaction } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, CalendarDays, ZapOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SubscriptionsPage() {
    const { categories } = useSpendingCategories();
    const { recurringTransactions, loading, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useRecurringTransactions();

    const [formOpen, setFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleCreate = async (data: CreateRecurringTransaction) => {
        await createRecurringTransaction(data);
    };

    const handleUpdate = async (data: CreateRecurringTransaction) => {
        if (editingTransaction) {
            await updateRecurringTransaction(editingTransaction.id, data);
            setEditingTransaction(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this subscription? No further transactions will be generated.')) {
            try {
                await deleteRecurringTransaction(id);
                toast.success('Subscription deleted');
            } catch {
                toast.error('Failed to delete subscription');
            }
        }
    };

    const handleEdit = (transaction: RecurringTransaction) => {
        setEditingTransaction(transaction);
        setFormOpen(true);
    };

    const toggleStatus = async (transaction: RecurringTransaction) => {
        try {
            await updateRecurringTransaction(transaction.id, { is_active: !transaction.is_active });
            toast.success(transaction.is_active ? 'Subscription Paused' : 'Subscription Resumed');
        } catch {
            toast.error('Failed to update status');
        }
    };

    const formatFrequency = (transaction: RecurringTransaction) => {
        if (transaction.frequency === 'monthly') {
            return `Monthly on the ${transaction.day_of_month}${getOrdinalIndicator(transaction.day_of_month || 1)}`;
        } else if (transaction.frequency === 'weekly') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `Weekly on ${days[(transaction.day_of_week || 1) % 7]}`;
        } else if (transaction.frequency === 'yearly') {
            return `Yearly starting ${format(new Date(transaction.start_date), 'MMM d')}`;
        }
        return transaction.frequency;
    };

    // Calculate totals
    const activeCount = recurringTransactions.filter(t => t.is_active).length;
    const pausedCount = recurringTransactions.filter(t => !t.is_active).length;

    // Approximate Monthly Cost
    const totalMonthlyCost = recurringTransactions
        .filter(t => t.is_active)
        .reduce((sum, t) => {
            let monthlyEquiv = t.amount;
            if (t.frequency === 'weekly') monthlyEquiv = (t.amount * 52) / 12;
            if (t.frequency === 'yearly') monthlyEquiv = t.amount / 12;
            return sum + monthlyEquiv;
        }, 0);

    return (
        <div>
            <Header
                title="Recurring Subscriptions"
                description="Manage your automated payments and memberships"
            />

            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs font-medium sm:text-sm">Monthly Burn Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="text-lg font-bold sm:text-2xl">{formatCurrency(totalMonthlyCost)}</div>
                        <p className="text-[10px] text-muted-foreground sm:text-xs">
                            Projected active cost per month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-sage">
                    <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs font-medium sm:text-sm">Active</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-sage sm:h-5 sm:w-5" />
                            <span className="text-lg font-bold text-sage sm:text-2xl">{activeCount}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-muted hidden md:block">
                    <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs font-medium sm:text-sm">Paused</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="flex items-center gap-2">
                            <ZapOff className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                            <span className="text-lg font-bold text-muted-foreground sm:text-2xl">{pausedCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-4 flex items-center justify-between sm:mb-6 sm:justify-end">
                <Button
                    size="sm"
                    className="sm:size-default w-full sm:w-auto"
                    onClick={() => {
                        setEditingTransaction(null);
                        setFormOpen(true);
                    }}
                >
                    <Plus className="mr-1 h-4 w-4 sm:mr-2" />
                    <span>Add Subscription</span>
                </Button>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="flex h-40 items-center justify-center sm:h-64">
                        Loading subscriptions...
                    </CardContent>
                </Card>
            ) : recurringTransactions.length === 0 ? (
                <Card>
                    <CardContent className="flex h-40 flex-col items-center justify-center gap-3 sm:h-64 sm:gap-4">
                        <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No automated subscriptions set up yet</p>
                        <Button size="sm" onClick={() => setFormOpen(true)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Subscription
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {recurringTransactions.map((sub) => (
                        <Card key={sub.id} className={!sub.is_active ? 'opacity-70 border-dashed bg-muted/20' : ''}>
                            <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 sm:gap-3">
                                        <div
                                            className="h-3 w-3 shrink-0 rounded-full sm:h-4 sm:w-4"
                                            style={{ backgroundColor: sub.category?.color || '#6b7280' }}
                                        />
                                        <CardTitle className="text-sm truncate sm:text-base">{sub.description || 'Unnamed Subscription'}</CardTitle>
                                        {!sub.is_active && (
                                            <Badge variant="secondary" className="hidden text-xs sm:flex">
                                                Paused
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-[44px] w-[44px]">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(sub)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(sub)}>
                                                    <ZapOff className="mr-2 h-4 w-4" />
                                                    {sub.is_active ? 'Pause Subscription' : 'Resume Subscription'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(sub.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                                <div className="space-y-4 pt-2 border-t">
                                    <div className="flex flex-wrap justify-between gap-x-2 text-xs sm:text-sm items-center">
                                        <div>
                                            <span className="font-semibold text-base sm:text-lg">{formatCurrency(sub.amount)}</span>
                                            <p className="text-muted-foreground text-[10px] sm:text-xs mt-1">
                                                {formatFrequency(sub)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" style={sub.category ? { borderColor: `${sub.category.color}40`, color: sub.category.color, backgroundColor: `${sub.category.color}10` } : {}}>
                                                {sub.category ? sub.category.name : 'Uncategorized'}
                                            </Badge>
                                            <p className="text-muted-foreground text-[10px] mt-2">
                                                Last run: {sub.last_generated_date ? format(new Date(sub.last_generated_date), 'MMM d, yyyy') : 'Never'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Dialog */}
            <RecurringTransactionForm
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditingTransaction(null);
                }}
                onSubmit={editingTransaction ? handleUpdate : handleCreate}
                transaction={editingTransaction}
                categories={categories}
            />
        </div>
    );
}

// Helper for suffixes
function getOrdinalIndicator(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
