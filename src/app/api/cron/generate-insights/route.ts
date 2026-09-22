import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format, subDays, startOfWeek } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Missing Supabase Service Keys.' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = request.headers.get('Authorization');
        const expectedSecret = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
        if (expectedSecret && authHeader !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const currentStart = format(subDays(now, 6), 'yyyy-MM-dd');
        const currentEnd = format(now, 'yyyy-MM-dd');
        const prevStart = format(subDays(now, 13), 'yyyy-MM-dd');
        const prevEnd = format(subDays(now, 7), 'yyyy-MM-dd');

        const { data: txns, error: txError } = await supabase
            .from('transactions')
            .select('amount, transaction_date, category:spending_categories(name)')
            .gte('transaction_date', prevStart)
            .lte('transaction_date', currentEnd);

        if (txError) throw txError;

        const summarize = (start: string, end: string) => {
            const items = (txns || []).filter(
                (t) => t.transaction_date >= start && t.transaction_date <= end
            );
            let total = 0;
            const cats: Record<string, number> = {};
            items.forEach((t) => {
                total += Number(t.amount);
                const cat = t.category as unknown as { name?: string }[] | { name?: string } | null;
                const name = Array.isArray(cat) ? cat[0]?.name : cat?.name;
                const key = name || 'Uncategorized';
                cats[key] = (cats[key] || 0) + Number(t.amount);
            });
            const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return { total, count: items.length, top };
        };

        const current = summarize(currentStart, currentEnd);
        const previous = summarize(prevStart, prevEnd);

        const { data: history } = await supabase
            .from('net_worth_history')
            .select('net_worth, snapshot_date')
            .order('snapshot_date', { ascending: false })
            .limit(2);

        const latestNw = history?.[0]?.net_worth ?? null;
        const prevNw = history?.[1]?.net_worth ?? null;
        const nwChange = latestNw != null && prevNw != null ? Number(latestNw) - Number(prevNw) : null;
        const spendingChange =
            previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : null;

        const dataLines = [
            `Current week (${currentStart} to ${currentEnd}): spent ${current.total.toFixed(2)} across ${current.count} transactions.`,
            `Top categories this week: ${current.top.map(([k, v]) => `${k} (${v.toFixed(0)})`).join(', ') || 'none'}.`,
            `Previous week (${prevStart} to ${prevEnd}): spent ${previous.total.toFixed(2)} across ${previous.count} transactions.`,
            `Week-over-week spending change: ${spendingChange != null ? `${spendingChange.toFixed(1)}%` : 'n/a'}.`,
            latestNw != null
                ? `Latest net worth: ${Number(latestNw).toFixed(0)}; change vs prior snapshot: ${nwChange != null ? Number(nwChange).toFixed(0) : 'n/a'}.`
                : 'No net worth snapshots available yet.',
        ].join('\n');

        const apiKey = process.env.LLM_API_KEY || '';
        const apiUrl = process.env.LLM_API_URL || '';
        const model = process.env.LLM_MODEL || '';

        if (!apiKey || !apiUrl || !model) {
            return NextResponse.json({ message: 'LLM env vars not configured; skipping', skipped: true });
        }

        const prompt = [
            'You are a concise personal finance assistant. Using the weekly data below, write a short, friendly insight summary.',
            'Format as 3-5 short bullet points (plain text, no markdown headings). Focus on week-over-week changes, notable spending shifts, and one actionable suggestion. Keep it under 150 words.',
            '',
            'DATA:',
            dataLines,
        ].join('\n');

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 400,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`LLM request failed (${res.status}): ${errText.slice(0, 200)}`);
        }

        const json = await res.json();
        const analysis = json?.choices?.[0]?.message?.content?.trim();
        if (!analysis) throw new Error('LLM returned no content');

        const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

        const { error: upsertError } = await supabase
            .from('insights')
            .upsert({ week_start: weekStart, analysis }, { onConflict: 'week_start' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true, week_start: weekStart, analysis });
    } catch (error) {
        console.error('Error generating insights:', error);
        return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
    }
}
