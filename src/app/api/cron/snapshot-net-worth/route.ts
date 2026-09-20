import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

// Resolve the current calendar date in Singapore time (UTC+8) so the
// "last day of the month" gate lines up with the user's local timezone.
function getSgtDateParts(d: Date): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);

    const map: Record<string, number> = {};
    for (const p of parts) {
        if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    return { year: map.year, month: map.month, day: map.day };
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

        // Gate: only snapshot on the last day of the month (SGT)
        const now = new Date();
        const { year, month, day } = getSgtDateParts(now);
        const lastDay = new Date(year, month, 0).getDate();

        if (day !== lastDay) {
            return NextResponse.json({ message: 'Not the last day of the month', skipped: true });
        }

        const snapshotDate = `${year}-${pad(month)}-${pad(day)}`;

        // Fetch all assets with their category type
        const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select('id, current_value, value_sgd, category:asset_categories(type)');

        if (assetsError) throw assetsError;

        let totalAssets = 0;
        let totalLiabilities = 0;

        (assets || []).forEach((asset: {
            id: string;
            current_value: number;
            value_sgd: number | null;
            category?: { type: string } | { type: string }[] | null;
        }) => {
            const category = Array.isArray(asset.category) ? asset.category[0] : asset.category;
            const value = asset.value_sgd != null ? Number(asset.value_sgd) : Number(asset.current_value);
            if (category?.type === 'liability') {
                totalLiabilities += value;
            } else {
                totalAssets += value;
            }
        });

        const netWorth = Math.round((totalAssets - totalLiabilities) * 100) / 100;

        // Idempotent upsert keyed on snapshot_date (UNIQUE constraint)
        const { data: history, error: upsertError } = await supabase
            .from('net_worth_history')
            .upsert(
                {
                    snapshot_date: snapshotDate,
                    total_assets: Math.round(totalAssets * 100) / 100,
                    total_liabilities: Math.round(totalLiabilities * 100) / 100,
                    net_worth: netWorth,
                },
                { onConflict: 'snapshot_date' }
            )
            .select()
            .single();

        if (upsertError) throw upsertError;

        // Persist per-asset snapshots only when the history row is brand new
        const { data: existingSnaps } = await supabase
            .from('asset_snapshots')
            .select('id')
            .eq('history_id', history.id)
            .limit(1);

        if ((existingSnaps || []).length === 0 && assets && assets.length > 0) {
            const rows = assets.map((a: { id: string; current_value: number; value_sgd: number | null }) => ({
                history_id: history.id,
                asset_id: a.id,
                value: a.value_sgd != null ? Number(a.value_sgd) : Number(a.current_value),
            }));
            const { error: snapshotsError } = await supabase.from('asset_snapshots').insert(rows);
            if (snapshotsError) throw snapshotsError;
        }

        return NextResponse.json({
            success: true,
            snapshot_date: snapshotDate,
            total_assets: Math.round(totalAssets * 100) / 100,
            total_liabilities: Math.round(totalLiabilities * 100) / 100,
            net_worth: netWorth,
        });
    } catch (error) {
        console.error('Error snapshotting net worth:', error);
        return NextResponse.json(
            { error: 'Failed to snapshot net worth' },
            { status: 500 }
        );
    }
}
