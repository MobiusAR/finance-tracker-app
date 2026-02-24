import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// In Next.js App Router, POST method is easiest for sending a list of assets
export async function POST(request: Request) {
    try {
        const { assets } = await request.json();

        if (!assets || !Array.isArray(assets) || assets.length === 0) {
            return NextResponse.json({ prices: {} });
        }

        // 1. Fetch all unique ticker symbols
        const tickers = new Set(assets.map((a: any) => a.ticker_symbol).filter(Boolean));
        const allSymbols = Array.from(tickers) as string[];

        // Fetch asset quotes first
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

        // 2. Fetch required FX rates
        const fxRates = Array.from(requiredCurrencies) as string[];
        const fxQuotes = fxRates.length > 0 ? await yahooFinance.quote(fxRates) as any[] : [];

        const fxMap: Record<string, number> = {};
        fxQuotes.forEach((q: any) => {
            fxMap[q.symbol] = q.regularMarketPrice || 1;
        });

        // 3. Calculate lived updated values for the requested assets
        const calculatedPrices: Record<string, number> = {};

        assets.forEach((asset: any) => {
            if (!asset.ticker_symbol || !asset.shares) return;

            const quote = quoteMap[asset.ticker_symbol];
            if (!quote) return;

            const latestPrice = quote.regularMarketPrice || 0;
            const assetCurrency = quote.currency || 'USD';
            const fxSpread = asset.source?.fx_spread_margin || 0;

            let exchangeRateToSgd = 1;

            if (assetCurrency !== 'SGD') {
                const pair = `${assetCurrency}SGD=X`.toUpperCase();
                exchangeRateToSgd = fxMap[pair] || 1;
            }

            // Value in SGD = Shares * Local Price * (Local/SGD spot rate * (1 + broker markup))
            const sgdValue = asset.shares * latestPrice * (exchangeRateToSgd * (1 + Number(fxSpread)));

            calculatedPrices[asset.id] = sgdValue;
        });

        return NextResponse.json({ prices: calculatedPrices });
    } catch (error) {
        console.error('Error fetching market data:', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
