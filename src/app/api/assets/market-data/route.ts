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

        // 1. Fetch all unique ticker symbols plus USD/SGD
        const tickers = new Set(assets.map((a: any) => a.ticker_symbol).filter(Boolean));
        const allSymbols = Array.from(tickers).concat(['USDSGD=X']);

        // Fetch quotes in parallel
        const quotes = await yahooFinance.quote(allSymbols) as any[];

        // Create a map for quick lookup
        const quoteMap: Record<string, number> = {};
        quotes.forEach((q: any) => {
            quoteMap[q.symbol] = q.regularMarketPrice || 0;
        });

        const usdSgdRate = quoteMap['USDSGD=X'] || 1.34; // fallback to 1.34 if API fails

        // 2. Calculate lived updated values for the requested assets
        const calculatedPrices: Record<string, number> = {};

        assets.forEach((asset: any) => {
            if (!asset.ticker_symbol || !asset.shares) return;

            const latestPrice = quoteMap[asset.ticker_symbol] || 0;
            const fxSpread = asset.source?.fx_spread_margin || 0;

            // Value in SGD = Shares * USD Price * (SGD/USD spot rate * (1 + broker markup))
            const sgdValue = asset.shares * latestPrice * (usdSgdRate * (1 + Number(fxSpread)));

            calculatedPrices[asset.id] = sgdValue;
        });

        return NextResponse.json({ prices: calculatedPrices });
    } catch (error) {
        console.error('Error fetching market data:', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
