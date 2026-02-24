import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Initialize an admin Supabase client using the Service Role Key to bypass RLS policies
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Vercel Cron Secret to ensure only authorized triggers run this
        const authHeader = request.headers.get('Authorization');
        const expectedSecret = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

        // If the CRON_SECRET environment variable is set in Vercel, mandate it
        if (expectedSecret && authHeader !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch all auto-tracked assets from Supabase
        const { data: assets, error: fetchError } = await supabase
            .from('assets')
            .select(`
                id, 
                ticker_symbol, 
                shares, 
                source:asset_sources(fx_spread_margin)
            `)
            .eq('is_auto_tracked', true);

        if (fetchError || !assets || assets.length === 0) {
            return NextResponse.json({ message: 'No auto-tracked assets found' });
        }

        // 3. Extract unique ticker symbols
        const tickers = new Set(assets.map((a: any) => a.ticker_symbol).filter(Boolean));
        const allSymbols = Array.from(tickers).map((t: any) => t.toUpperCase());

        // 4. Fetch asset quotes from Yahoo Finance
        const quotes = await yahooFinance.quote(allSymbols) as any[];

        // Create a map for quick lookup and identify which currencies we need to fetch against SGD
        const quoteMap: Record<string, any> = {};
        const requiredCurrencies = new Set<string>();

        quotes.forEach((q: any) => {
            quoteMap[q.symbol] = q;
            if (q.currency && q.currency !== 'SGD') {
                requiredCurrencies.add(`${q.currency}SGD=X`.toUpperCase());
            }
        });

        // 5. Fetch required FX rates
        const fxRates = Array.from(requiredCurrencies) as string[];
        const fxQuotes = fxRates.length > 0 ? await yahooFinance.quote(fxRates) as any[] : [];

        const fxMap: Record<string, number> = {};
        fxQuotes.forEach((q: any) => {
            fxMap[q.symbol] = q.regularMarketPrice || 1;
        });

        // 6. Calculate lived updated values
        const updatePromises: any[] = [];

        assets.forEach((asset: any) => {
            if (!asset.ticker_symbol || !asset.shares) return;

            const normalizedTicker = asset.ticker_symbol.toUpperCase();
            const quote = quoteMap[normalizedTicker];
            if (!quote) return;

            const latestPrice = quote.regularMarketPrice || 0;
            const assetCurrency = quote.currency || 'USD';
            // Edge case handling if source array vs object returned by supabase join
            const sourceData = Array.isArray(asset.source) ? asset.source[0] : asset.source;
            const fxSpread = sourceData?.fx_spread_margin || 0;

            let exchangeRateToSgd = 1;
            if (assetCurrency !== 'SGD') {
                const pair = `${assetCurrency}SGD=X`.toUpperCase();
                exchangeRateToSgd = fxMap[pair] || 1;
            }

            // SGD Value calculation
            const sgdValue = asset.shares * latestPrice * (exchangeRateToSgd * (1 + Number(fxSpread)));

            // Round to 2 decimal places for database cleanliness
            const roundedSgdValue = Math.round(sgdValue * 100) / 100;

            // Push an update query to Supabase replacing current_value explicitly
            updatePromises.push(
                supabase
                    .from('assets')
                    .update({
                        current_value: roundedSgdValue,
                        currency: 'SGD' // Auto-tracked assets mathematically resolve into SGD 
                    })
                    .eq('id', asset.id)
                    .then(({ data, error }) => {
                        if (error) throw error;
                        return data;
                    })
            );
        });

        // 7. Await all DB updates in parallel
        await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${updatePromises.length} assets`,
            debug_asset_calculations: assets.map((asset: any) => {
                const quote = quoteMap[asset.ticker_symbol];
                const latestPrice = quote?.regularMarketPrice || 0;
                const assetCurrency = quote?.currency || 'USD';
                const sourceData = Array.isArray(asset.source) ? asset.source[0] : asset.source;
                const fxSpread = sourceData?.fx_spread_margin || 0;
                const pair = `${assetCurrency}SGD=X`.toUpperCase();
                const exchangeRateToSgd = assetCurrency !== 'SGD' ? (fxMap[pair] || 1) : 1;
                const sgdValue = asset.shares * latestPrice * (exchangeRateToSgd * (1 + Number(fxSpread)));

                return {
                    id: asset.id,
                    ticker: asset.ticker_symbol,
                    shares: asset.shares,
                    latestPrice,
                    assetCurrency,
                    fxSpread,
                    exchangeRateToSgd,
                    finalValue: Math.round(sgdValue * 100) / 100
                };
            })
        });

    } catch (error) {
        console.error('Error executing cron job:', error);
        return NextResponse.json({ error: 'Failed to synchronize assets' }, { status: 500 });
    }
}
