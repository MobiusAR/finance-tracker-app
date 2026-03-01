import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SURPLUS_START_MONTH = new Date('2026-03-01');

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Missing Supabase Service Keys.' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = request.headers.get('Authorization');
        const expectedSecret = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

        if (expectedSecret && authHeader !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate for the previous month
        const now = new Date();
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        if (targetMonth < SURPLUS_START_MONTH) {
            return NextResponse.json({
                message: `Surplus tracking starts from March 2026. Skipping ${targetMonth.toISOString().slice(0, 7)}.`
            });
        }

        const monthStr = targetMonth.toISOString().slice(0, 10); // e.g. '2026-03-01'
        const startDate = monthStr;
        const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
            .toISOString().slice(0, 10);

        // Fetch global config, total budget (sum of all category budgets) and total spending in parallel
        const [configResult, categoriesResult, transactionsResult] = await Promise.all([
            supabase.from('surplus_config').select('*').eq('is_singleton', true).single(),
            supabase.from('spending_categories').select('budget_amount'),
            supabase
                .from('transactions')
                .select('amount')
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate),
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (transactionsResult.error) throw transactionsResult.error;

        // If no config exists, default to 0 for income and savings
        const config = configResult.data || { monthly_income: 0, monthly_savings_target: 0 };
        const discretionaryAllowance = Number(config.monthly_income) - Number(config.monthly_savings_target);

        const totalBudget = (categoriesResult.data || []).reduce(
            (sum, c) => sum + (Number(c.budget_amount) || 0),
            0
        );

        const totalSpent = (transactionsResult.data || []).reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );

        // Fetch existing surplus record to preserve manual_adjustments if it exists
        const { data: existingSurplus } = await supabase
            .from('budget_surplus')
            .select('manual_adjustments')
            .eq('month', monthStr)
            .single();

        const manualAdjustments = existingSurplus ? Number(existingSurplus.manual_adjustments) : 0;

        // Revised surplus calculation
        const surplusAmount = Math.round((discretionaryAllowance - totalSpent + manualAdjustments) * 100) / 100;

        // Upsert into budget_surplus (idempotent)
        const { error: upsertError } = await supabase
            .from('budget_surplus')
            .upsert(
                {
                    month: monthStr,
                    total_budget: Math.round(totalBudget * 100) / 100,
                    total_spent: Math.round(totalSpent * 100) / 100,
                    surplus_amount: surplusAmount,
                    discretionary_allowance: discretionaryAllowance,
                    manual_adjustments: manualAdjustments
                },
                { onConflict: 'month' }
            );

        if (upsertError) throw upsertError;

        return NextResponse.json({
            success: true,
            month: monthStr,
            discretionary_allowance: discretionaryAllowance,
            total_spent: totalSpent,
            manual_adjustments: manualAdjustments,
            surplus_amount: surplusAmount,
        });
    } catch (error) {
        console.error('Error calculating surplus:', error);
        return NextResponse.json(
            { error: 'Failed to calculate budget surplus' },
            { status: 500 }
        );
    }
}
