import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function lastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function matchesSchedule(
    frequency: string,
    dayOfWeek: number | null,
    dayOfMonth: number | null,
    monthOfYear: number | null,
    today: Date
): boolean {
    const todayDay = today.getDay();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const lastDay = lastDayOfMonth(today.getFullYear(), today.getMonth());

    switch (frequency) {
        case 'weekly':
            return dayOfWeek !== null && todayDay === dayOfWeek;

        case 'monthly':
            if (dayOfMonth === null) return false;
            // If the target day exceeds the month's length, fire on the last day
            if (dayOfMonth > lastDay) return todayDate === lastDay;
            return todayDate === dayOfMonth;

        case 'yearly':
            if (dayOfMonth === null || monthOfYear === null) return false;
            if (todayMonth !== monthOfYear) return false;
            if (dayOfMonth > lastDay) return todayDate === lastDay;
            return todayDate === dayOfMonth;

        default:
            return false;
    }
}

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

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        // Fetch all active recurring transactions within their date window
        const { data: recurring, error: fetchError } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', todayStr)
            .or(`end_date.is.null,end_date.gte.${todayStr}`);

        if (fetchError) throw fetchError;
        if (!recurring || recurring.length === 0) {
            return NextResponse.json({ message: 'No active recurring transactions found' });
        }

        let created = 0;
        let skipped = 0;

        for (const rec of recurring) {
            // Already generated today — skip
            if (rec.last_generated_date && rec.last_generated_date >= todayStr) {
                skipped++;
                continue;
            }

            if (!matchesSchedule(rec.frequency, rec.day_of_week, rec.day_of_month, rec.month_of_year, today)) {
                skipped++;
                continue;
            }

            // Create the transaction
            const { error: insertError } = await supabase.from('transactions').insert({
                category_id: rec.category_id,
                amount: rec.amount,
                description: rec.description,
                transaction_date: todayStr,
            });

            if (insertError) {
                console.error(`Failed to create transaction for recurring ${rec.id}:`, insertError);
                continue;
            }

            // Mark as generated today
            await supabase
                .from('recurring_transactions')
                .update({ last_generated_date: todayStr })
                .eq('id', rec.id);

            created++;
        }

        return NextResponse.json({
            success: true,
            date: todayStr,
            created,
            skipped,
            total_checked: recurring.length,
        });
    } catch (error) {
        console.error('Error generating recurring transactions:', error);
        return NextResponse.json(
            { error: 'Failed to generate recurring transactions' },
            { status: 500 }
        );
    }
}
