'use client';

import { useState } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { Header } from '@/components/layout/Header';
import { LoanForm } from '@/components/forms/LoanForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, HandCoins, Calendar, Info, Loader2 } from 'lucide-react';
import { PersonalLoan, CreatePersonalLoan } from '@/lib/supabase/types';
import { format } from 'date-fns';

export default function LoansPage() {
    const { loans, loading, createLoan, updateLoan } = useLoans();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<PersonalLoan | undefined>();

    const formatCurrency = (value: number, currency: string = 'SGD') => {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const activeLoans = loans.filter((l) => l.status === 'active');
    const repaidLoans = loans.filter((l) => l.status === 'repaid');
    const defaultedLoans = loans.filter((l) => l.status === 'defaulted');

    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepaid = repaidLoans.reduce((sum, l) => sum + l.amount, 0);

    const handleEdit = (loan: PersonalLoan) => {
        setSelectedLoan(loan);
        setIsFormOpen(true);
    };

    const handleOpenNew = () => {
        setSelectedLoan(undefined);
        setIsFormOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-blue-600">Active</Badge>;
            case 'repaid':
                return <Badge variant="default" className="bg-emerald-600">Repaid</Badge>;
            case 'defaulted':
                return <Badge variant="destructive">Defaulted</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
                    <p>Loading personal loans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <Header
                    title="Personal Loans"
                    description="Track money you've lent out independently of your core Net Worth."
                />
                <Button onClick={handleOpenNew} size="sm" className="hidden md:flex">
                    <Plus className="mr-2 h-4 w-4" /> Add Loan
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 rtl:auto-cols-fr">
                <Card className="border shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <HandCoins className="h-4 w-4" />
                            <h3 className="text-sm font-medium">Total Outstanding</h3>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className="text-2xl font-bold sm:text-3xl text-blue-600">
                                {formatCurrency(totalOutstanding)}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Across {activeLoans.length} active loans</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <HandCoins className="h-4 w-4" />
                            <h3 className="text-sm font-medium">Total Repaid</h3>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className="text-2xl font-bold sm:text-3xl text-emerald-600">
                                {formatCurrency(totalRepaid)}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Across {repaidLoans.length} completed loans</p>
                    </CardContent>
                </Card>
            </div>

            {/* Loan List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Loan Ledger</h2>
                    <Button onClick={handleOpenNew} size="sm" variant="outline" className="md:hidden">
                        <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                </div>

                {loans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                        <HandCoins className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <h3 className="mt-4 text-sm font-semibold">No loans recorded</h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                            Keep track of money you've lent to friends and family without messing up your main net worth calculations.
                        </p>
                        <Button onClick={handleOpenNew} variant="outline" className="mt-4 bg-background">
                            <Plus className="mr-2 h-4 w-4" />
                            Add your first loan
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {loans.map((loan) => (
                            <Card
                                key={loan.id}
                                className={`cursor-pointer overflow-hidden transition-all hover:border-terracotta/50 hover:shadow-md ${loan.status === 'repaid' ? 'opacity-70 bg-secondary/20' : ''
                                    }`}
                                onClick={() => handleEdit(loan)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate font-medium leading-none">{loan.borrower_name}</h3>
                                                {getStatusBadge(loan.status)}
                                            </div>
                                            <div className="mt-3 flex items-baseline gap-1.5">
                                                <span className="font-bold text-lg">
                                                    {formatCurrency(loan.amount, loan.currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground border-t pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            <span>Lent: {format(new Date(loan.date_lent), 'MMM d, yyyy')}</span>
                                        </div>
                                        {loan.due_date && (
                                            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                <span>Due: {format(new Date(loan.due_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        )}
                                        {loan.reason && (
                                            <div className="flex items-start gap-1.5 line-clamp-2">
                                                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span>{loan.reason}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <LoanForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                loan={selectedLoan}
                onSubmit={async (data) => {
                    if (selectedLoan) {
                        await updateLoan(selectedLoan.id, data);
                    } else {
                        await createLoan(data as CreatePersonalLoan);
                    }
                }}
            />
        </div>
    );
}
